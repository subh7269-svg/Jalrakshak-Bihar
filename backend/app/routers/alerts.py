from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.schemas.alert import AlertResponse, AlertAcknowledgeRequest
from app.services.alert_service import get_active_alerts, acknowledge_alert
from app.routers.auth import require_role
from app.models.user import User

router = APIRouter(prefix="/alerts", tags=["Emergency Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(acknowledged: Optional[bool] = None, db: Session = Depends(get_db)):
    return get_active_alerts(db, acknowledged=acknowledged)

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def ack_alert(
    alert_id: int,
    req: AlertAcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DISTRICT_OFFICIAL"]))
):
    try:
        return acknowledge_alert(db, alert_id, current_user.username)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
