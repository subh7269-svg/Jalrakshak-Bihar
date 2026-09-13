import pytest
from app.ml.feature_pipeline import engineer_features, FEATURE_NAMES
from app.ml.inference import risk_engine
from app.services.risk_service import get_why_at_risk
from app.models.location import Location

def test_feature_engineering_pipeline():
    raw_data = {
        "rainfall_24h_mm": 180.0,
        "river_level_m": 53.5,
        "danger_mark_m": 52.0,
        "river_rise_rate_3h_m": 0.7,
        "elevation_m": 42.0,
        "distance_to_river_km": 1.2,
        "soil_saturation_pct": 90.0,
        "historical_flood_index": 0.8
    }
    df = engineer_features(raw_data)
    for col in FEATURE_NAMES:
        assert col in df.columns
    assert df["gauge_to_danger_ratio"].iloc[0] > 1.0
    assert df["runoff_accumulation_index"].iloc[0] > 0

def test_ml_inference_boundaries_and_explanations():
    raw_critical = {
        "rainfall_24h_mm": 220.0,
        "river_level_m": 54.5,
        "danger_mark_m": 52.0,
        "river_rise_rate_3h_m": 0.85,
        "elevation_m": 35.0,
        "distance_to_river_km": 0.5,
        "soil_saturation_pct": 95.0,
        "historical_flood_index": 0.9
    }
    pred = risk_engine.predict(raw_critical)
    assert 0.0 <= pred["risk_score_pct"] <= 100.0
    assert pred["risk_level"] in ["HIGH", "CRITICAL"]
    assert len(pred["contributing_factors"]) > 0

def test_why_at_risk_service_contract(db_session):
    supaul = db_session.query(Location).filter(Location.name.contains("Kunauli")).first()
    assert supaul is not None

    why_data = get_why_at_risk(db_session, supaul.id)
    assert why_data.location_id == supaul.id
    assert why_data.raw_inputs.river_level_m > 0
    assert why_data.population_exposure.is_model_estimate is True
    # Test transparent population exposure formula: pop * predicted_prob
    expected_calc = int(round(supaul.population * (why_data.risk_score_pct / 100.0)))
    assert abs(why_data.population_exposure.estimated_exposed_population - expected_calc) <= 1
