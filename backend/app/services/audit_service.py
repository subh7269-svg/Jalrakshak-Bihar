from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, Any
from app.models.audit_log import AuditLog

def log_audit_action(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[int],
    entity_name: Optional[str],
    field_name: str,
    old_value: Any,
    new_value: Any,
    username: str = "system",
    user_role: str = "OFFICIAL",
    user_id: Optional[int] = None,
    notes: Optional[str] = None
) -> AuditLog:
    """
    Creates an immutable audit record for state transitions, operational resource edits,
    road accessibility reports, and shelter modifications.
    """
    audit_entry = AuditLog(
        user_id=user_id,
        username=username,
        user_role=user_role,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        field_name=field_name,
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(new_value) if new_value is not None else "",
        timestamp=datetime.now(timezone.utc),
        notes=notes
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
