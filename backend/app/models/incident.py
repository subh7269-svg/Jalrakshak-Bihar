from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    incident_type = Column(String(80), nullable=False)  # Embankment Breach, Flash Water Surge, Trapped Villagers, Bridge Washout, Medical Emergency
    severity = Column(String(20), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    status = Column(String(30), default="REPORTED")  # REPORTED, IN_PROGRESS, RESOLVED
    reported_by = Column(String(100), nullable=False)
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
    is_simulated = Column(Boolean, default=True)

    location = relationship("Location", back_populates="incidents")
