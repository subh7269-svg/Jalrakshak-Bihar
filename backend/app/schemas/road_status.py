from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RoadStatusBase(BaseModel):
    location_id: int
    road_name: str
    route_segment: str
    status: str  # OPEN, PARTIALLY_BLOCKED, BLOCKED, UNKNOWN
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class RoadStatusCreate(RoadStatusBase):
    pass

class RoadStatusResponse(RoadStatusBase):
    id: int
    reported_by: str
    reporter_role: str
    is_simulated: bool
    reported_at: datetime
    location_name: Optional[str] = None
    district: Optional[str] = None

    class Config:
        from_attributes = True
