from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IncidentBase(BaseModel):
    location_id: int
    incident_type: str  # Embankment Breach, Flash Water Surge, Trapped Villagers, Bridge Washout, Medical Emergency
    severity: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    description: str

class IncidentCreate(IncidentBase):
    pass

class IncidentResponse(IncidentBase):
    id: int
    status: str
    reported_by: str
    reported_at: datetime
    resolved_at: Optional[datetime] = None
    is_simulated: bool
    location_name: Optional[str] = None
    district: Optional[str] = None

    class Config:
        from_attributes = True

class IncidentStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
