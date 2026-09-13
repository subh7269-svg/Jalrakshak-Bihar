from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.database.session import get_db
from app.models.road_status import RoadStatus
from app.models.location import Location
from app.schemas.road_status import RoadStatusResponse, RoadStatusCreate
from app.routers.auth import require_role
from app.models.user import User
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/roads", tags=["Road Accessibility Reports"])

@router.get("", response_model=List[RoadStatusResponse])
def get_all_road_reports(district: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(RoadStatus).join(Location, RoadStatus.location_id == Location.id)
    if district and district != "ALL":
        query = query.filter(Location.district == district)
    roads = query.order_by(RoadStatus.reported_at.desc()).all()

    return [
        RoadStatusResponse(
            id=r.id,
            location_id=r.location_id,
            road_name=r.road_name,
            route_segment=r.route_segment,
            status=r.status,
            notes=r.notes,
            photo_url=r.photo_url,
            reported_by=r.reported_by,
            reporter_role=r.reporter_role,
            is_simulated=r.is_simulated,
            reported_at=r.reported_at,
            location_name=r.location.name if r.location else None,
            district=r.location.district if r.location else None
        )
        for r in roads
    ]

@router.post("/report", response_model=RoadStatusResponse)
def submit_road_report(
    report_data: RoadStatusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["FIELD_OFFICER", "DISTRICT_OFFICIAL", "ADMIN"]))
):
    loc = db.query(Location).filter(Location.id == report_data.location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location {report_data.location_id} not found")

    # Check if road report already exists for this exact road segment
    existing = db.query(RoadStatus).filter(
        RoadStatus.location_id == report_data.location_id,
        RoadStatus.road_name == report_data.road_name
    ).first()

    if existing:
        old_status = existing.status
        existing.route_segment = report_data.route_segment
        existing.status = report_data.status
        existing.notes = report_data.notes
        existing.photo_url = report_data.photo_url
        existing.reported_by = f"{current_user.username} ({current_user.role})"
        existing.reporter_role = current_user.role
        existing.reported_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        road_obj = existing

        log_audit_action(
            db=db,
            action="UPDATE_ROAD_STATUS",
            entity_type="RoadStatus",
            entity_id=existing.id,
            entity_name=existing.road_name,
            field_name="status",
            old_value=old_status,
            new_value=existing.status,
            username=current_user.username,
            user_role=current_user.role,
            user_id=current_user.id,
            notes=report_data.notes or f"Field update: road condition set to {existing.status}"
        )
    else:
        road_obj = RoadStatus(
            location_id=report_data.location_id,
            road_name=report_data.road_name,
            route_segment=report_data.route_segment,
            status=report_data.status,
            reported_by=f"{current_user.username} ({current_user.role})",
            reporter_role=current_user.role,
            notes=report_data.notes,
            photo_url=report_data.photo_url,
            is_simulated=True,
            reported_at=datetime.now(timezone.utc)
        )
        db.add(road_obj)
        db.commit()
        db.refresh(road_obj)

        log_audit_action(
            db=db,
            action="CREATE_ROAD_STATUS",
            entity_type="RoadStatus",
            entity_id=road_obj.id,
            entity_name=road_obj.road_name,
            field_name="status",
            old_value=None,
            new_value=road_obj.status,
            username=current_user.username,
            user_role=current_user.role,
            user_id=current_user.id,
            notes=report_data.notes or f"Initial road status logged: {road_obj.status}"
        )

    return RoadStatusResponse(
        id=road_obj.id,
        location_id=road_obj.location_id,
        road_name=road_obj.road_name,
        route_segment=road_obj.route_segment,
        status=road_obj.status,
        notes=road_obj.notes,
        photo_url=road_obj.photo_url,
        reported_by=road_obj.reported_by,
        reporter_role=road_obj.reporter_role,
        is_simulated=road_obj.is_simulated,
        reported_at=road_obj.reported_at,
        location_name=loc.name,
        district=loc.district
    )
