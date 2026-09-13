from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class HydrologyData(Base):
    __tablename__ = "hydrology_data"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), unique=True, nullable=False)
    rainfall_24h_mm = Column(Float, nullable=False)
    river_level_m = Column(Float, nullable=False)
    danger_mark_m = Column(Float, nullable=False)
    warning_mark_m = Column(Float, nullable=False)
    river_rise_rate_3h_m = Column(Float, nullable=False)  # Change in river level over past 3 hours
    distance_to_river_km = Column(Float, nullable=False)
    soil_saturation_pct = Column(Float, default=65.0)  # 0 to 100%
    data_source_type = Column(String(100), default="Simulated demonstration data")
    is_simulated = Column(Boolean, default=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    location = relationship("Location", back_populates="hydrology")
