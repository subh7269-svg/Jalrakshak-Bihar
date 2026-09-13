from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.schemas.shelter import ShelterResponse, ShelterUpdateRequest, ShelterGapAnalysis
from app.services.shelter_service import (
    get_all_shelters,
    update_shelter_occupancy,
    calculate_district_shelter_gap
)
from app.routers.auth import require_role
from app.models.user import User

router = APIRouter(prefix="/shelters", tags=["Shelter Management"])

@router.get("", response_model=List[ShelterResponse])
def list_shelters(district: Optional[str] = None, db: Session = Depends(get_db)):
    return get_all_shelters(db, district=district)

@router.post("/update", response_model=ShelterResponse)
def update_shelter(
    update_req: ShelterUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DISTRICT_OFFICIAL"]))
):
    try:
        return update_shelter_occupancy(
            db=db,
            shelter_id=update_req.shelter_id,
            new_occupancy=update_req.current_occupancy,
            accessibility_status=update_req.accessibility_status,
            username=current_user.username,
            user_role=current_user.role,
            user_id=current_user.id,
            notes=update_req.notes
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/gap-analysis", response_model=ShelterGapAnalysis)
def get_district_gap(
    district: str = Query("Supaul"),
    evacuation_demand: int = Query(3500),
    db: Session = Depends(get_db)
):
    return calculate_district_shelter_gap(db, district=district, estimated_evacuation_demand=evacuation_demand)
