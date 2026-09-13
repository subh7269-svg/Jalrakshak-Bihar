from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    title = Column(String(150), nullable=False)
    severity = Column(String(20), nullable=False)  # INFO, WARNING, CRITICAL
    alert_type = Column(String(50), nullable=False)  # THRESHOLD_BREACH, RAPID_RISE, RESOURCE_SHORTAGE, SHELTER_GAP, ROAD_CUT, INCIDENT
    what_happened = Column(Text, nullable=False)
    where_location = Column(String(100), nullable=False)
    why_it_matters = Column(Text, nullable=False)
    recommended_step = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    is_simulated = Column(Boolean, default=True)

    location = relationship("Location", back_populates="alerts")
