from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class ContributingFactor(BaseModel):
    factor_name: str
    impact: str  # POSITIVE, NEGATIVE, NEUTRAL
    weight_pct: float
    description: str
    feature_value: str

class RawSensorValues(BaseModel):
    river_level_m: float
    danger_mark_m: float
    river_rise_rate_3h_m: float
    rainfall_24h_mm: float
    elevation_m: float
    distance_to_river_km: float
    soil_saturation_pct: float
    data_source: str
    is_simulated: bool

class PopulationExposureEstimate(BaseModel):
    total_population: int
    predicted_exposure_pct: float
    estimated_exposed_population: int
    calculation_formula: str
    is_model_estimate: bool = True
    methodology_note: str

class WhyAtRiskResponse(BaseModel):
    location_id: int
    location_name: str
    district: str
    risk_score_pct: float
    risk_level: str  # LOW, MODERATE, HIGH, CRITICAL
    model_name: str
    is_simulated: bool
    data_source_badge: str
    factors: List[ContributingFactor]
    raw_inputs: RawSensorValues
    population_exposure: PopulationExposureEstimate
    disclaimer: str

class RiskAssessmentResponse(BaseModel):
    id: int
    location_id: int
    location_name: Optional[str] = None
    district: Optional[str] = None
    risk_score_pct: float
    risk_level: str
    predicted_exposure_pct: float
    estimated_exposed_population: int
    contributing_factors: List[Dict[str, Any]]
    explanation_summary: Optional[str] = None
    calculation_method: str
    is_simulated: bool
    assessed_at: datetime

    class Config:
        from_attributes = True
