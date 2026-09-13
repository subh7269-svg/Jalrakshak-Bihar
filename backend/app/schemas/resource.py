from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ResourceBase(BaseModel):
    location_id: Optional[int] = None
    resource_type: str
    station_name: str
    total_quantity: int
    available_quantity: int
    deployed_quantity: int
    unit: str = "units"
    status: str = "OPERATIONAL"
    destination: Optional[str] = None

class ResourceResponse(ResourceBase):
    id: int
    last_updated_by: str
    updated_at: datetime
    is_simulated: bool
    location_name: Optional[str] = None
    district: Optional[str] = None

    class Config:
        from_attributes = True

class ResourceUpdateRequest(BaseModel):
    resource_id: int
    available_quantity: int = Field(ge=0)
    deployed_quantity: int = Field(ge=0)
    status: Optional[str] = None
    destination: Optional[str] = None
    notes: Optional[str] = None

class ResourcePlanningAssumption(BaseModel):
    boat_capacity_persons: int = Field(default=20, ge=1, le=100)
    expected_trips_per_boat: int = Field(default=2, ge=1, le=10)
    evacuation_ratio_pct: float = Field(default=30.0, ge=1.0, le=100.0)  # % of exposed population requiring boat evacuation
    food_packets_per_person_per_day: int = Field(default=2, ge=1, le=5)
    water_litres_per_person_per_day: float = Field(default=3.0, ge=1.0, le=10.0)
    medical_kits_per_100_persons: int = Field(default=1, ge=1, le=10)
    planning_horizon_days: int = Field(default=3, ge=1, le=14)

class ResourceRequirementItem(BaseModel):
    resource_type: str
    unit: str
    planning_estimate_required: int
    available_quantity: int
    deployed_quantity: int
    shortage_quantity: int
    calculation_basis: str
    status: str  # ADEQUATE, DEFICIT, SEVERE_DEFICIT

class LocationResourcePlan(BaseModel):
    location_id: int
    location_name: str
    district: str
    risk_level: str
    estimated_exposed_population: int
    estimated_evacuation_target: int
    assumptions_applied: ResourcePlanningAssumption
    requirements: List[ResourceRequirementItem]
    planning_disclaimer: str
