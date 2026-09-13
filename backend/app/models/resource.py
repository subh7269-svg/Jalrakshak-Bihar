from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)  # Associated staging district/location
    resource_type = Column(String(100), nullable=False)  # Rescue boats, Rescue teams, Ambulances, Medical kits, Food packets, Drinking water, Temporary shelters, Medical personnel
    station_name = Column(String(100), nullable=False)  # e.g., "SDRF Post Supaul", "NDRF 9 Bn Bihta", "District Relief Depot"
    total_quantity = Column(Integer, nullable=False, default=0)
    available_quantity = Column(Integer, nullable=False, default=0)
    deployed_quantity = Column(Integer, nullable=False, default=0)
    unit = Column(String(30), nullable=False, default="units")  # units, packets, litres, personnel
    status = Column(String(50), default="OPERATIONAL")  # OPERATIONAL, LOW_STOCK, DEPLETED, MOBILIZING
    destination = Column(String(100), nullable=True)  # Where deployed
    last_updated_by = Column(String(100), default="System")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_simulated = Column(Boolean, default=True)

    location = relationship("Location", back_populates="resources")
