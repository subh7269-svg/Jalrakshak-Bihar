from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    district = Column(String(50), index=True, nullable=False)
    block = Column(String(50), nullable=False)
    panchayat = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=False)
    population = Column(Integer, nullable=False)
    river_basin = Column(String(50), nullable=False)  # Kosi, Bagmati, Gandak, Ganga, Burhi Gandak, Kamala Balan
    baseline_vulnerability = Column(Float, default=0.5)  # 0.0 to 1.0 based on historical flood index & socio-economic vulnerability
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    hydrology = relationship("HydrologyData", back_populates="location", uselist=False)
    risk_assessment = relationship("RiskAssessment", back_populates="location", uselist=False)
    resources = relationship("Resource", back_populates="location")
    shelters = relationship("Shelter", back_populates="location")
    road_statuses = relationship("RoadStatus", back_populates="location")
    incidents = relationship("Incident", back_populates="location")
    alerts = relationship("Alert", back_populates="location")
