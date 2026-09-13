from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
from datetime import datetime, timezone
from app.models.location import Location
from app.models.hydrology import HydrologyData
from app.models.risk import RiskAssessment
from app.ml.inference import risk_engine
from app.schemas.risk import WhyAtRiskResponse, ContributingFactor, RawSensorValues, PopulationExposureEstimate

def assess_location_risk(db: Session, location: Location) -> RiskAssessment:
    """
    Evaluates ML flood risk for a location using current hydrological telemetry.
    Updates or creates the RiskAssessment entity.
    """
    hydro = location.hydrology
    if not hydro:
        # Fallback values if no sensor record
        raw_dict = {
            "rainfall_24h_mm": 20.0,
            "river_level_m": 42.0,
            "danger_mark_m": 50.0,
            "river_rise_rate_3h_m": 0.05,
            "elevation_m": location.elevation_m,
            "distance_to_river_km": 3.0,
            "soil_saturation_pct": 50.0,
            "historical_flood_index": location.baseline_vulnerability
        }
    else:
        raw_dict = {
            "rainfall_24h_mm": hydro.rainfall_24h_mm,
            "river_level_m": hydro.river_level_m,
            "danger_mark_m": hydro.danger_mark_m,
            "river_rise_rate_3h_m": hydro.river_rise_rate_3h_m,
            "elevation_m": location.elevation_m,
            "distance_to_river_km": hydro.distance_to_river_km,
            "soil_saturation_pct": hydro.soil_saturation_pct,
            "historical_flood_index": location.baseline_vulnerability
        }

    pred = risk_engine.predict(raw_dict)
    risk_score = pred["risk_score_pct"]
    risk_level = pred["risk_level"]
    pred_exposure_pct = pred["predicted_exposure_pct"]

    # Transparent calculation: population * predicted_exposure_pct / 100
    estimated_exposed = int(round(location.population * (pred_exposure_pct / 100.0)))

    # Explanatory narrative
    top_factors = pred["contributing_factors"][:3]
    summary_reasons = [f["factor_name"] for f in top_factors if "INCREASE" in f.get("impact", "")]
    if not summary_reasons:
        summary_reasons = ["Hydrological levels within manageable limits"]
    explanation = f"Location classified as {risk_level} risk ({risk_score}%). Primary drivers: " + "; ".join(summary_reasons) + "."

    assessment = location.risk_assessment
    if not assessment:
        assessment = RiskAssessment(
            location_id=location.id,
            risk_score_pct=risk_score,
            risk_level=risk_level,
            predicted_exposure_pct=pred_exposure_pct,
            estimated_exposed_population=estimated_exposed,
            contributing_factors_json=json.dumps(pred["contributing_factors"]),
            explanation_summary=explanation,
            calculation_method=pred["calculation_method"],
            is_simulated=True,
            assessed_at=datetime.now(timezone.utc)
        )
        db.add(assessment)
    else:
        assessment.risk_score_pct = risk_score
        assessment.risk_level = risk_level
        assessment.predicted_exposure_pct = pred_exposure_pct
        assessment.estimated_exposed_population = estimated_exposed
        assessment.contributing_factors_json = json.dumps(pred["contributing_factors"])
        assessment.explanation_summary = explanation
        assessment.assessed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(assessment)
    return assessment

def get_why_at_risk(db: Session, location_id: int) -> WhyAtRiskResponse:
    """
    Constructs the detailed 'Why is this area at risk?' panel response.
    Includes exact raw values, explainable feature impacts, and transparent population exposure estimate.
    """
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise ValueError(f"Location {location_id} not found")

    hydro = loc.hydrology
    assessment = loc.risk_assessment
    if not assessment:
        assessment = assess_location_risk(db, loc)

    try:
        factors_raw = json.loads(assessment.contributing_factors_json)
    except Exception:
        factors_raw = []

    factors = [
        ContributingFactor(
            factor_name=f["factor_name"],
            impact=f["impact"],
            weight_pct=f["weight_pct"],
            description=f["description"],
            feature_value=f["feature_value"]
        )
        for f in factors_raw
    ]

    raw_inputs = RawSensorValues(
        river_level_m=hydro.river_level_m if hydro else 0.0,
        danger_mark_m=hydro.danger_mark_m if hydro else 50.0,
        river_rise_rate_3h_m=hydro.river_rise_rate_3h_m if hydro else 0.0,
        rainfall_24h_mm=hydro.rainfall_24h_mm if hydro else 0.0,
        elevation_m=loc.elevation_m,
        distance_to_river_km=hydro.distance_to_river_km if hydro else 2.0,
        soil_saturation_pct=hydro.soil_saturation_pct if hydro else 60.0,
        data_source=hydro.data_source_type if hydro else "Simulated demonstration data",
        is_simulated=hydro.is_simulated if hydro else True
    )

    # Transparent population calculation
    pop_exposure = PopulationExposureEstimate(
        total_population=loc.population,
        predicted_exposure_pct=assessment.predicted_exposure_pct,
        estimated_exposed_population=assessment.estimated_exposed_population,
        calculation_formula=f"Estimated exposed = total_population ({loc.population:,}) × predicted_exposure ({assessment.predicted_exposure_pct}%) = ~{assessment.estimated_exposed_population:,}",
        is_model_estimate=True,
        methodology_note="MODEL ESTIMATE: Reflects statistical probability of flood extent overlap with residential settlement boundaries. Not an absolute count of casualties or inundated households."
    )

    return WhyAtRiskResponse(
        location_id=loc.id,
        location_name=loc.name,
        district=loc.district,
        risk_score_pct=assessment.risk_score_pct,
        risk_level=assessment.risk_level,
        model_name="RandomForest Hydrological Classifier (120 Estimators)",
        is_simulated=assessment.is_simulated,
        data_source_badge="DEMO / SIMULATED DATA",
        factors=factors,
        raw_inputs=raw_inputs,
        population_exposure=pop_exposure,
        disclaimer=(
            "DECISION SUPPORT NOTICE: Model outputs indicate relative hydrological vulnerability. "
            "They do not replace official Central Water Commission (CWC) or Bihar Disaster Management Department notifications."
        )
    )
