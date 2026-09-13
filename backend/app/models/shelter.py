from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    name = Column(String(150), nullable=False)
    district = Column(String(50), nullable=False)
    total_capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, nullable=False, default=0)
    available_capacity = Column(Integer, nullable=False)  # total_capacity - current_occupancy
    accessibility_status = Column(String(50), default="ACCESSIBLE")  # ACCESSIBLE, LIMITED, CUT_OFF
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_person = Column(String(100), nullable=True)
    contact_phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_simulated = Column(Boolean, default=True)

    location = relationship("Location", back_populates="shelters")
