from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class HydrologyBrief(BaseModel):
    rainfall_24h_mm: float
    river_level_m: float
    danger_mark_m: float
    warning_mark_m: float
    river_rise_rate_3h_m: float
    distance_to_river_km: float
    soil_saturation_pct: float
    data_source_type: str
    is_simulated: bool
    recorded_at: datetime

    class Config:
        from_attributes = True

class RiskBrief(BaseModel):
    risk_score_pct: float
    risk_level: str
    predicted_exposure_pct: float
    estimated_exposed_population: int
    calculation_method: str
    is_simulated: bool
    assessed_at: datetime

    class Config:
        from_attributes = True

class LocationBase(BaseModel):
    name: str
    district: str
    block: str
    panchayat: Optional[str] = None
    latitude: float
    longitude: float
    elevation_m: float
    population: int
    river_basin: str
    baseline_vulnerability: float

class LocationResponse(LocationBase):
    id: int
    is_active: bool
    created_at: datetime
    hydrology: Optional[HydrologyBrief] = None
    risk_assessment: Optional[RiskBrief] = None

    class Config:
        from_attributes = True

class LocationDetail(LocationResponse):
    pass
