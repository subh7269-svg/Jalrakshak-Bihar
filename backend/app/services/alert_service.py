from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.models.alert import Alert
from app.models.location import Location
from app.schemas.alert import AlertResponse

def get_active_alerts(db: Session, acknowledged: Optional[bool] = False) -> List[AlertResponse]:
    query = db.query(Alert)
    if acknowledged is not None:
        query = query.filter(Alert.is_acknowledged == acknowledged)
    alerts = query.order_by(Alert.created_at.desc()).all()
    return [AlertResponse.from_orm(a) for a in alerts]

def create_alert(
    db: Session,
    title: str,
    severity: str,
    alert_type: str,
    what_happened: str,
    where_location: str,
    why_it_matters: str,
    recommended_step: str,
    location_id: Optional[int] = None
) -> Alert:
    alert = Alert(
        location_id=location_id,
        title=title,
        severity=severity,
        alert_type=alert_type,
        what_happened=what_happened,
        where_location=where_location,
        why_it_matters=why_it_matters,
        recommended_step=recommended_step,
        created_at=datetime.now(timezone.utc),
        is_acknowledged=False,
        is_simulated=True
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

def acknowledge_alert(db: Session, alert_id: int, username: str) -> AlertResponse:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise ValueError(f"Alert {alert_id} not found")
    alert.is_acknowledged = True
    alert.acknowledged_by = username
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return AlertResponse.from_orm(alert)
