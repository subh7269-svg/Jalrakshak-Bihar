from pydantic import BaseModel
from typing import List, Optional

class RecommendationItem(BaseModel):
    category: str  # EVACUATION, RESOURCE_MOBILIZATION, SHELTER_ROUTING, MEDICAL, ACCESS_BYPASS
    action: str
    rationale: str
    urgency: str  # IMMEDIATE, HIGH, MEDIUM

class LocationRecommendationResponse(BaseModel):
    location_id: int
    location_name: str
    district: str
    priority_rank: int
    priority_category: str
    flood_risk_pct: float
    trigger_reasons: List[str]
    planning_recommendations: List[RecommendationItem]
    underlying_evidence: List[str]
    official_disclaimer: str = (
        "DECISION SUPPORT NOTICE: These planning recommendations are generated from current hydrological, "
        "spatial, and operational field inputs. Final operational decisions remain with authorized "
        "disaster-management officials. This platform does not replace on-ground verification or statutory authority."
    )
