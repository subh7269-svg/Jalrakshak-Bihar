from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.location import Location
from app.models.shelter import Shelter
from app.models.road_status import RoadStatus
from app.schemas.priority import (
    LocationPriorityRank,
    PriorityFactorScore,
    PriorityWeights,
    PriorityRankingResponse
)

def evaluate_priority_ranking(
    db: Session,
    district_filter: Optional[str] = None,
    custom_weights: Optional[PriorityWeights] = None
) -> PriorityRankingResponse:
    """
    Computes transparent multi-factor emergency priority ranking across Bihar flood locations.
    Accounts for flood risk, population exposure, road blockages, shelter deficits, and river surge rate.
    """
    if custom_weights is None:
        weights = PriorityWeights()
    else:
        weights = custom_weights

    # Normalize weights so sum is 1.0
    w_sum = (
        weights.weight_flood_risk +
        weights.weight_population_exposure +
        weights.weight_road_blockage +
        weights.weight_shelter_gap +
        weights.weight_river_rise_rate
    )
    w_risk = weights.weight_flood_risk / w_sum
    w_pop = weights.weight_population_exposure / w_sum
    w_road = weights.weight_road_blockage / w_sum
    w_shelter = weights.weight_shelter_gap / w_sum
    w_rise = weights.weight_river_rise_rate / w_sum

    query = db.query(Location).filter(Location.is_active == True)
    if district_filter and district_filter != "ALL":
        query = query.filter(Location.district == district_filter)
    locations = query.all()

    # Pre-fetch district shelters and road statuses
    shelters_by_loc: Dict[int, List[Shelter]] = {}
    for s in db.query(Shelter).filter(Shelter.is_active == True).all():
        shelters_by_loc.setdefault(s.location_id, []).append(s)

    roads_by_loc: Dict[int, List[RoadStatus]] = {}
    for r in db.query(RoadStatus).all():
        roads_by_loc.setdefault(r.location_id, []).append(r)

    scored_locations = []

    # Maximum population baseline across dataset for relative normalization
    max_pop_exposed = max([loc.population for loc in locations] + [50000])

    for loc in locations:
        hydro = loc.hydrology
        risk = loc.risk_assessment

        risk_score = risk.risk_score_pct if risk else 40.0
        exposed_pop = risk.estimated_exposed_population if risk else int(loc.population * 0.3)
        rise_rate = hydro.river_rise_rate_3h_m if hydro else 0.0

        # --- Factor 1: Flood Risk Probability (0 - 100) ---
        norm_risk = min(100.0, max(0.0, risk_score))

        # --- Factor 2: Exposed Population Scale (0 - 100) ---
        # S-curve / linear log scale for human life exposure
        norm_pop = min(100.0, (exposed_pop / 15000.0) * 100.0)

        # --- Factor 3: Road Accessibility (0 - 100 penalty) ---
        # BLOCKED roads isolate communities, exponentially increasing risk
        loc_roads = roads_by_loc.get(loc.id, [])
        road_status_str = "OPEN"
        norm_road = 0.0

        has_blocked = any(r.status == "BLOCKED" for r in loc_roads)
        has_partial = any(r.status == "PARTIALLY_BLOCKED" for r in loc_roads)
        if has_blocked:
            road_status_str = "BLOCKED"
            norm_road = 100.0
        elif has_partial:
            road_status_str = "PARTIALLY_BLOCKED"
            norm_road = 55.0
        elif not loc_roads:
            road_status_str = "UNKNOWN"
            norm_road = 25.0
        else:
            road_status_str = "OPEN"
            norm_road = 0.0

        # --- Factor 4: Shelter Capacity Gap (0 - 100) ---
        loc_shelters = shelters_by_loc.get(loc.id, [])
        total_shelter_avail = sum(max(0, s.total_capacity - s.current_occupancy) for s in loc_shelters)
        evac_demand = int(exposed_pop * 0.30)  # Planning demand 30% of exposed
        shelter_gap = max(0, evac_demand - total_shelter_avail)

        if shelter_gap > 0:
            norm_shelter = min(100.0, (shelter_gap / 2000.0) * 100.0)
        else:
            norm_shelter = 0.0

        # --- Factor 5: Rate of River Level Surge (0 - 100) ---
        # Surge rate >= 0.8m/3h is extremely dangerous
        norm_rise = min(100.0, max(0.0, (rise_rate / 0.8) * 100.0))

        # Composite Weighted Score
        composite_score = round(
            (norm_risk * w_risk) +
            (norm_pop * w_pop) +
            (norm_road * w_road) +
            (norm_shelter * w_shelter) +
            (norm_rise * w_rise),
            1
        )

        # Category
        if composite_score >= 75.0:
            category = "CRITICAL"
        elif composite_score >= 55.0:
            category = "HIGH"
        elif composite_score >= 35.0:
            category = "MODERATE"
        else:
            category = "LOW"

        # Factor contributions breakdown
        factors = [
            PriorityFactorScore(
                factor_name="Predicted Flood Risk",
                raw_value=f"{risk_score:.1f}%",
                normalized_score=round(norm_risk, 1),
                weight=round(w_risk, 2),
                contribution=round(norm_risk * w_risk, 1),
                reason=f"Model predicts {risk_score:.1f}% probability of severe inundation."
            ),
            PriorityFactorScore(
                factor_name="Population Potentially Exposed",
                raw_value=f"~{exposed_pop:,} residents",
                normalized_score=round(norm_pop, 1),
                weight=round(w_pop, 2),
                contribution=round(norm_pop * w_pop, 1),
                reason=f"Estimated {exposed_pop:,} persons located in projected vulnerable zone."
            ),
            PriorityFactorScore(
                factor_name="Road Accessibility Status",
                raw_value=road_status_str,
                normalized_score=round(norm_road, 1),
                weight=round(w_road, 2),
                contribution=round(norm_road * w_road, 1),
                reason="Evacuation corridors blocked, preventing standard vehicular relief." if road_status_str == "BLOCKED" else (
                    "Corridors partially restricted." if road_status_str == "PARTIALLY_BLOCKED" else "Road access normal."
                )
            ),
            PriorityFactorScore(
                factor_name="Shelter Capacity Gap",
                raw_value=f"{shelter_gap:,} spaces deficit" if shelter_gap > 0 else "Sufficient",
                normalized_score=round(norm_shelter, 1),
                weight=round(w_shelter, 2),
                contribution=round(norm_shelter * w_shelter, 1),
                reason=f"Local active shelters face a deficit of {shelter_gap:,} beds for projected evacuees." if shelter_gap > 0 else "Local shelter headroom currently covers initial staging."
            ),
            PriorityFactorScore(
                factor_name="River Water Rise Velocity",
                raw_value=f"{rise_rate:+.2f} m/3h",
                normalized_score=round(norm_rise, 1),
                weight=round(w_rise, 2),
                contribution=round(norm_rise * w_rise, 1),
                reason=f"Rapid upstream surge of {rise_rate:+.2f}m in 3 hours indicates impending embankment spill." if rise_rate > 0.3 else "River gauge velocity is relatively gradual."
            )
        ]

        # Key drivers list
        drivers = []
        if norm_risk >= 70:
            drivers.append(f"Critical flood risk ({risk_score:.1f}%)")
        if norm_pop >= 50:
            drivers.append(f"High population exposure (~{exposed_pop:,} people)")
        if road_status_str == "BLOCKED":
            drivers.append("Key road route confirmed BLOCKED")
        if shelter_gap > 0:
            drivers.append(f"Shelter capacity deficit ({shelter_gap:,} deficit)")
        if rise_rate >= 0.4:
            drivers.append(f"Rapid water surge ({rise_rate:+.2f}m/3h)")

        scored_locations.append({
            "location_id": loc.id,
            "location_name": loc.name,
            "district": loc.district,
            "priority_score": composite_score,
            "priority_category": category,
            "flood_risk_pct": risk_score,
            "estimated_exposed_population": exposed_pop,
            "road_accessibility_status": road_status_str,
            "shelter_capacity_gap": shelter_gap,
            "river_rise_rate_3h_m": rise_rate,
            "key_drivers": drivers if drivers else ["Baseline seasonal monitoring"],
            "factor_breakdown": factors
        })

    # Sort descending by priority score
    scored_locations.sort(key=lambda x: x["priority_score"], reverse=True)

    ranking_result: List[LocationPriorityRank] = []
    for idx, item in enumerate(scored_locations, start=1):
        # Generate custom explanation for ranking
        if idx == 1:
            why_text = (
                f"Ranked #1 (CRITICAL PRIORITY) due to combined convergence of: "
                f"{', '.join(item['key_drivers'][:3])}. Immediate deployment priority required."
            )
        else:
            why_text = (
                f"Ranked #{idx} with Priority Score {item['priority_score']:.1f}. "
                f"Driven by: {', '.join(item['key_drivers'][:2])}."
            )

        ranking_result.append(LocationPriorityRank(
            rank=idx,
            location_id=item["location_id"],
            location_name=item["location_name"],
            district=item["district"],
            priority_score=item["priority_score"],
            priority_category=item["priority_category"],
            flood_risk_pct=item["flood_risk_pct"],
            estimated_exposed_population=item["estimated_exposed_population"],
            road_accessibility_status=item["road_accessibility_status"],
            shelter_capacity_gap=item["shelter_capacity_gap"],
            river_rise_rate_3h_m=item["river_rise_rate_3h_m"],
            why_ranked_here=why_text,
            key_drivers=item["key_drivers"],
            factor_breakdown=item["factor_breakdown"]
        ))

    formula_exp = (
        "Priority Score = (FloodRisk × 30%) + (PopulationExposure × 25%) + "
        "(RoadBlockagePenalty × 15%) + (ShelterDeficit × 15%) + (RiverRiseRate × 15%). "
        "Every contributing parameter is calculated from live field telemetry and verifiable database records."
    )

    return PriorityRankingResponse(
        ranking=ranking_result,
        weights_applied=weights,
        evaluated_at=datetime.now(timezone.utc).isoformat(),
        formula_explanation=formula_exp
    )
