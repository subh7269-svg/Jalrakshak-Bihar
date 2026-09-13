from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.recommendation import LocationRecommendationResponse
from app.services.recommendation_service import generate_location_recommendation

router = APIRouter(prefix="/recommendations", tags=["Decision Support Recommendations"])

@router.get("/{location_id}", response_model=LocationRecommendationResponse)
def get_recommendation_for_location(location_id: int, db: Session = Depends(get_db)):
    try:
        return generate_location_recommendation(db, location_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
