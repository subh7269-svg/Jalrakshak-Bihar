from sqlalchemy.orm import Session
from typing import List
from app.models.location import Location
from app.schemas.recommendation import (
    LocationRecommendationResponse,
    RecommendationItem
)
from app.services.priority_service import evaluate_priority_ranking
from app.services.resource_service import calculate_location_resource_requirements
from app.services.shelter_service import get_all_shelters

def generate_location_recommendation(db: Session, location_id: int) -> LocationRecommendationResponse:
    """
    Generates evidence-based decision-support recommendations grounded strictly in current data.
    """
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise ValueError(f"Location {location_id} not found")

    # Fetch priority rank & factor breakdown
    priority_board = evaluate_priority_ranking(db)
    loc_rank = next((r for r in priority_board.ranking if r.location_id == location_id), None)
    rank_idx = loc_rank.rank if loc_rank else 99
    priority_category = loc_rank.priority_category if loc_rank else "MODERATE"
    key_drivers = loc_rank.key_drivers if loc_rank else ["Baseline monitoring"]

    # Fetch resource requirements & gaps
    res_plan = calculate_location_resource_requirements(db, location_id)
    boat_shortage = next((r.shortage_quantity for r in res_plan.requirements if r.resource_type == "Rescue boats"), 0)
    avail_boats = next((r.available_quantity for r in res_plan.requirements if r.resource_type == "Rescue boats"), 0)

    # Road & Shelters
    road_statuses = loc.road_statuses
    has_blocked_road = any(r.status == "BLOCKED" for r in road_statuses)
    blocked_names = [r.road_name for r in road_statuses if r.status == "BLOCKED"]

    shelters = db.query(Location).filter(Location.id == location_id).first().shelters
    total_avail_shelter = sum(max(0, s.total_capacity - s.current_occupancy) for s in shelters)

    recs: List[RecommendationItem] = []
    evidence: List[str] = []

    # 1. Boat Deployment / Mobilization
    if boat_shortage > 0:
        recs.append(RecommendationItem(
            category="RESOURCE_MOBILIZATION",
            action=f"Deploy all {avail_boats} currently available rescue boats from local post immediately; request mutual-aid transfer of {boat_shortage} additional boats from state pool / SDRF.",
            rationale=f"Evacuation requirement of ~{res_plan.estimated_evacuation_target:,} persons exceeds local boat capacity by {boat_shortage} vessels.",
            urgency="IMMEDIATE" if priority_category in ["CRITICAL", "HIGH"] else "HIGH"
        ))
        evidence.append(f"Rescue boat deficit of {boat_shortage} boats calculated at 20 persons/trip × 2 trips.")
    elif avail_boats > 0:
        recs.append(RecommendationItem(
            category="RESOURCE_MOBILIZATION",
            action=f"Stage {avail_boats} available rescue boats at primary river embankment access points.",
            rationale="Current available boats cover projected initial evacuation target.",
            urgency="HIGH" if priority_category == "CRITICAL" else "MEDIUM"
        ))
        evidence.append(f"Local boat inventory currently adequate ({avail_boats} vessels on standby).")

    # 2. Road Accessibility / Aerial or Marine Bypass
    if has_blocked_road:
        recs.append(RecommendationItem(
            category="ACCESS_BYPASS",
            action=f"Route evacuation convoys away from {', '.join(blocked_names)}; dispatch aerial reconnaissance or boat ferrying for cut-off pockets.",
            rationale=f"Field reports verify key route {', '.join(blocked_names)} is submerged/blocked.",
            urgency="IMMEDIATE"
        ))
        evidence.append(f"Active road blockage reported on {', '.join(blocked_names)}.")
    else:
        recs.append(RecommendationItem(
            category="ACCESS_BYPASS",
            action="Keep designated emergency corridors open and clear of civilian choke points.",
            rationale="All reported access arteries currently open.",
            urgency="MEDIUM"
        ))
        evidence.append("All connecting transit corridors reported OPEN.")

    # 3. Shelter Capacity & Evacuee Redirection
    if res_plan.estimated_evacuation_target > total_avail_shelter:
        gap = res_plan.estimated_evacuation_target - total_avail_shelter
        recs.append(RecommendationItem(
            category="SHELTER_ROUTING",
            action=f"Open high-ground school/community camp overflow facilities to accommodate ~{gap:,} evacuees, or activate transit buses to adjacent block shelters.",
            rationale=f"Local active shelter capacity has a projected gap of {gap:,} beds.",
            urgency="HIGH"
        ))
        evidence.append(f"Local shelter deficit: {gap:,} persons demand over active capacity.")
    else:
        recs.append(RecommendationItem(
            category="SHELTER_ROUTING",
            action=f"Direct primary evacuation flow toward nearest facility: {shelters[0].name if shelters else 'Designated Block Shelter'}.",
            rationale=f"Local shelter has {total_avail_shelter:,} available spaces.",
            urgency="MEDIUM"
        ))
        evidence.append(f"Local shelters currently have {total_avail_shelter:,} available spaces.")

    # 4. Medical & Relief Stocking
    recs.append(RecommendationItem(
        category="MEDICAL",
        action="Pre-position halogen tablets, ORS packets, and snake-venom antiserum at staging medical centers.",
        rationale="Flood inundation severely heightens gastrointestinal and vector-borne emergency rates.",
        urgency="HIGH" if priority_category in ["CRITICAL", "HIGH"] else "MEDIUM"
    ))
    evidence.append(f"Population density of {loc.name} requires structured medical pre-positioning.")

    return LocationRecommendationResponse(
        location_id=loc.id,
        location_name=loc.name,
        district=loc.district,
        priority_rank=rank_idx,
        priority_category=priority_category,
        flood_risk_pct=loc_rank.flood_risk_pct if loc_rank else 50.0,
        trigger_reasons=key_drivers,
        planning_recommendations=recs,
        underlying_evidence=evidence
    )
