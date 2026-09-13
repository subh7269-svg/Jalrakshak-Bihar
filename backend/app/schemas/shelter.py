from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ShelterBase(BaseModel):
    location_id: int
    name: str
    district: str
    total_capacity: int
    current_occupancy: int
    accessibility_status: str = "ACCESSIBLE"
    latitude: float
    longitude: float
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None

class ShelterResponse(ShelterBase):
    id: int
    available_capacity: int
    is_active: bool
    updated_at: datetime
    is_simulated: bool
    location_name: Optional[str] = None
    occupancy_pct: float

    class Config:
        from_attributes = True

class ShelterUpdateRequest(BaseModel):
    shelter_id: int
    current_occupancy: int = Field(ge=0)
    accessibility_status: Optional[str] = None
    notes: Optional[str] = None

class ShelterGapAnalysis(BaseModel):
    district: str
    total_shelters: int
    total_capacity: int
    current_occupancy: int
    total_available_capacity: int
    estimated_evacuation_demand: int
    capacity_gap: int  # max(0, estimated_evacuation_demand - total_available_capacity)
    status: str  # SURPLUS, TIGHT, DEFICIT
    warning_message: Optional[str] = None
