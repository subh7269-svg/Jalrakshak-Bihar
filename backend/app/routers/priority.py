from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.schemas.priority import PriorityRankingResponse, PriorityWeights
from app.services.priority_service import evaluate_priority_ranking

router = APIRouter(prefix="/priority-ranking", tags=["Priority Engine"])

@router.get("", response_model=PriorityRankingResponse)
def get_priority_ranking(
    district: Optional[str] = None,
    w_risk: float = Query(0.30, ge=0.0, le=1.0),
    w_pop: float = Query(0.25, ge=0.0, le=1.0),
    w_road: float = Query(0.15, ge=0.0, le=1.0),
    w_shelter: float = Query(0.15, ge=0.0, le=1.0),
    w_rise: float = Query(0.15, ge=0.0, le=1.0),
    db: Session = Depends(get_db)
):
    custom_weights = PriorityWeights(
        weight_flood_risk=w_risk,
        weight_population_exposure=w_pop,
        weight_road_blockage=w_road,
        weight_shelter_gap=w_shelter,
        weight_river_rise_rate=w_rise
    )
    return evaluate_priority_ranking(db, district_filter=district, custom_weights=custom_weights)
