from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime, timezone
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False, default="VIEW_ONLY")  # ADMIN, DISTRICT_OFFICIAL, FIELD_OFFICER, VIEW_ONLY
    department = Column(String(100), nullable=True)
    district = Column(String(50), nullable=True)  # e.g., "Patna", "Darbhanga", "Supaul", etc. or "ALL"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
