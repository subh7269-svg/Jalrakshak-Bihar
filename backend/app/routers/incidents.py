from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.database.session import get_db
from app.models.incident import Incident
from app.models.location import Location
from app.schemas.incident import IncidentResponse, IncidentCreate, IncidentStatusUpdate
from app.routers.auth import require_role
from app.models.user import User
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentResponse])
def list_incidents(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Incident).join(Location, Incident.location_id == Location.id)
    if status:
        query = query.filter(Incident.status == status)
    incidents = query.order_by(Incident.reported_at.desc()).all()

    return [
        IncidentResponse(
            id=i.id,
            location_id=i.location_id,
            incident_type=i.incident_type,
            severity=i.severity,
            description=i.description,
            status=i.status,
            reported_by=i.reported_by,
            reported_at=i.reported_at,
            resolved_at=i.resolved_at,
            is_simulated=i.is_simulated,
            location_name=i.location.name if i.location else None,
            district=i.location.district if i.location else None
        )
        for i in incidents
    ]

@router.post("", response_model=IncidentResponse)
def create_incident(
    incident_data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["FIELD_OFFICER", "DISTRICT_OFFICIAL", "ADMIN"]))
):
    loc = db.query(Location).filter(Location.id == incident_data.location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location {incident_data.location_id} not found")

    new_inc = Incident(
        location_id=incident_data.location_id,
        incident_type=incident_data.incident_type,
        severity=incident_data.severity,
        description=incident_data.description,
        status="REPORTED",
        reported_by=f"{current_user.username} ({current_user.role})",
        reported_at=datetime.now(timezone.utc),
        is_simulated=True
    )
    db.add(new_inc)
    db.commit()
    db.refresh(new_inc)

    log_audit_action(
        db=db,
        action="CREATE_INCIDENT",
        entity_type="Incident",
        entity_id=new_inc.id,
        entity_name=f"{loc.name}: {new_inc.incident_type}",
        field_name="status",
        old_value=None,
        new_value="REPORTED",
        username=current_user.username,
        user_role=current_user.role,
        user_id=current_user.id,
        notes=f"New incident logged: {new_inc.description[:100]}"
    )

    return IncidentResponse(
        id=new_inc.id,
        location_id=new_inc.location_id,
        incident_type=new_inc.incident_type,
        severity=new_inc.severity,
        description=new_inc.description,
        status=new_inc.status,
        reported_by=new_inc.reported_by,
        reported_at=new_inc.reported_at,
        resolved_at=new_inc.resolved_at,
        is_simulated=new_inc.is_simulated,
        location_name=loc.name,
        district=loc.district
    )

@router.patch("/{incident_id}/status", response_model=IncidentResponse)
def update_incident_status(
    incident_id: int,
    status_update: IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["DISTRICT_OFFICIAL", "ADMIN"]))
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    old_status = inc.status
    inc.status = status_update.status
    if status_update.status == "RESOLVED":
        inc.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(inc)

    log_audit_action(
        db=db,
        action="UPDATE_INCIDENT_STATUS",
        entity_type="Incident",
        entity_id=inc.id,
        entity_name=inc.incident_type,
        field_name="status",
        old_value=old_status,
        new_value=inc.status,
        username=current_user.username,
        user_role=current_user.role,
        user_id=current_user.id,
        notes=status_update.notes
    )

    return IncidentResponse(
        id=inc.id,
        location_id=inc.location_id,
        incident_type=inc.incident_type,
        severity=inc.severity,
        description=inc.description,
        status=inc.status,
        reported_by=inc.reported_by,
        reported_at=inc.reported_at,
        resolved_at=inc.resolved_at,
        is_simulated=inc.is_simulated,
        location_name=inc.location.name if inc.location else None,
        district=inc.location.district if inc.location else None
    )
