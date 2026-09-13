from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.schemas.resource import (
    ResourceResponse,
    ResourceUpdateRequest,
    ResourcePlanningAssumption,
    LocationResourcePlan
)
from app.services.resource_service import (
    get_all_resources,
    update_resource_inventory,
    calculate_location_resource_requirements
)
from app.routers.auth import require_role
from app.models.user import User

router = APIRouter(prefix="/resources", tags=["Emergency Resource Management"])

@router.get("", response_model=List[ResourceResponse])
def list_resources(district: Optional[str] = None, db: Session = Depends(get_db)):
    return get_all_resources(db, district=district)

@router.post("/update", response_model=ResourceResponse)
def update_resource(
    update_req: ResourceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DISTRICT_OFFICIAL"]))
):
    try:
        return update_resource_inventory(
            db=db,
            update_req=update_req,
            username=current_user.username,
            user_role=current_user.role,
            user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/requirements/{location_id}", response_model=LocationResourcePlan)
def get_resource_requirements(
    location_id: int,
    assumptions: Optional[ResourcePlanningAssumption] = None,
    db: Session = Depends(get_db)
):
    try:
        return calculate_location_resource_requirements(db, location_id, assumptions=assumptions)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
