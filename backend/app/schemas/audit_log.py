from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: str
    user_role: str
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    entity_name: Optional[str] = None
    field_name: str
    old_value: Optional[str] = None
    new_value: str
    timestamp: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True
