from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime, timezone
from app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(100), nullable=False, default="system")
    user_role = Column(String(50), nullable=False, default="OFFICIAL")
    action = Column(String(80), nullable=False)  # UPDATE_RESOURCE, UPDATE_SHELTER, REPORT_ROAD_STATUS, CREATE_INCIDENT, RESOLVE_INCIDENT, SIMULATION_TRIGGER
    entity_type = Column(String(50), nullable=False)  # Resource, Shelter, RoadStatus, Incident
    entity_id = Column(Integer, nullable=True)
    entity_name = Column(String(150), nullable=True)
    field_name = Column(String(80), nullable=False)  # e.g., "available_quantity", "status", "current_occupancy"
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    notes = Column(Text, nullable=True)
