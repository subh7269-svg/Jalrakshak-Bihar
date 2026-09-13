from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertBase(BaseModel):
    location_id: Optional[int] = None
    title: str
    severity: str  # INFO, WARNING, CRITICAL
    alert_type: str
    what_happened: str
    where_location: str
    why_it_matters: str
    recommended_step: str

class AlertResponse(AlertBase):
    id: int
    created_at: datetime
    is_acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    is_simulated: bool

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    notes: Optional[str] = None
