from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), unique=True, nullable=False)
    risk_score_pct = Column(Float, nullable=False)  # 0.0 to 100.0%
    risk_level = Column(String(20), nullable=False)  # LOW, MODERATE, HIGH, CRITICAL
    predicted_exposure_pct = Column(Float, nullable=False)  # 0.0 to 100.0%
    estimated_exposed_population = Column(Integer, nullable=False)  # population * predicted_exposure_pct / 100
    contributing_factors_json = Column(Text, nullable=False)  # JSON string of factors and weights
    explanation_summary = Column(Text, nullable=True)  # Plain language narrative
    calculation_method = Column(String(100), default="Random Forest + Hydrological Feature Pipeline")
    is_simulated = Column(Boolean, default=True)
    assessed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    location = relationship("Location", back_populates="risk_assessment")
