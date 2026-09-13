from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.models.location import Location
from app.schemas.location import LocationResponse

router = APIRouter(prefix="/locations", tags=["Locations"])

@router.get("", response_model=List[LocationResponse])
def get_locations(district: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Location).filter(Location.is_active == True)
    if district and district != "ALL":
        query = query.filter(Location.district == district)
    locations = query.all()
    return locations

@router.get("/{location_id}", response_model=LocationResponse)
def get_location(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location {location_id} not found")
    return loc
