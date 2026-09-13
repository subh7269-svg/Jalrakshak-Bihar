from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class PriorityFactorScore(BaseModel):
    factor_name: str
    raw_value: str
    normalized_score: float  # 0 to 100
    weight: float
    contribution: float  # normalized_score * weight
    reason: str

class LocationPriorityRank(BaseModel):
    rank: int
    location_id: int
    location_name: str
    district: str
    priority_score: float  # 0 to 100
    priority_category: str  # CRITICAL, HIGH, MODERATE, LOW
    flood_risk_pct: float
    estimated_exposed_population: int
    road_accessibility_status: str
    shelter_capacity_gap: int
    river_rise_rate_3h_m: float
    why_ranked_here: str
    key_drivers: List[str]
    factor_breakdown: List[PriorityFactorScore]

class PriorityWeights(BaseModel):
    weight_flood_risk: float = 0.30
    weight_population_exposure: float = 0.25
    weight_road_blockage: float = 0.15
    weight_shelter_gap: float = 0.15
    weight_river_rise_rate: float = 0.15

class PriorityRankingResponse(BaseModel):
    ranking: List[LocationPriorityRank]
    weights_applied: PriorityWeights
    evaluated_at: str
    formula_explanation: str
