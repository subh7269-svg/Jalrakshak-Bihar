from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class RoadStatus(Base):
    __tablename__ = "road_statuses"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    road_name = Column(String(120), nullable=False)  # e.g., "NH-27 Bridge Link", "SH-50 Darbhanga-Samastipur"
    route_segment = Column(String(150), nullable=False)  # e.g., "Km 42-48 Lowland Reach"
    status = Column(String(50), nullable=False, default="OPEN")  # OPEN, PARTIALLY_BLOCKED, BLOCKED, UNKNOWN
    reported_by = Column(String(100), nullable=False)
    reporter_role = Column(String(50), default="FIELD_OFFICER")
    notes = Column(Text, nullable=True)
    photo_url = Column(String(255), nullable=True)
    is_simulated = Column(Boolean, default=True)
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    location = relationship("Location", back_populates="road_statuses")
