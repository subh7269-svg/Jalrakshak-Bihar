from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.models.shelter import Shelter
from app.models.location import Location
from app.schemas.shelter import ShelterResponse, ShelterGapAnalysis
from app.services.audit_service import log_audit_action

def get_all_shelters(db: Session, district: Optional[str] = None) -> List[ShelterResponse]:
    query = db.query(Shelter).filter(Shelter.is_active == True)
    if district and district != "ALL":
        query = query.filter(Shelter.district == district)
    
    shelters = query.all()
    results = []
    for s in shelters:
        avail = max(0, s.total_capacity - s.current_occupancy)
        occ_pct = round((s.current_occupancy / s.total_capacity * 100.0) if s.total_capacity > 0 else 0.0, 1)
        results.append(ShelterResponse(
            id=s.id,
            location_id=s.location_id,
            name=s.name,
            district=s.district,
            total_capacity=s.total_capacity,
            current_occupancy=s.current_occupancy,
            available_capacity=avail,
            accessibility_status=s.accessibility_status,
            latitude=s.latitude,
            longitude=s.longitude,
            contact_person=s.contact_person,
            contact_phone=s.contact_phone,
            is_active=s.is_active,
            updated_at=s.updated_at,
            is_simulated=s.is_simulated,
            location_name=s.location.name if s.location else None,
            occupancy_pct=occ_pct
        ))
    return results

def update_shelter_occupancy(
    db: Session,
    shelter_id: int,
    new_occupancy: int,
    accessibility_status: Optional[str] = None,
    username: str = "official",
    user_role: str = "DISTRICT_OFFICIAL",
    user_id: Optional[int] = None,
    notes: Optional[str] = None
) -> ShelterResponse:
    shelter = db.query(Shelter).filter(Shelter.id == shelter_id).first()
    if not shelter:
        raise ValueError(f"Shelter with id {shelter_id} not found")

    old_occupancy = shelter.current_occupancy
    old_accessibility = shelter.accessibility_status

    shelter.current_occupancy = min(shelter.total_capacity, max(0, new_occupancy))
    shelter.available_capacity = max(0, shelter.total_capacity - shelter.current_occupancy)
    if accessibility_status:
        shelter.accessibility_status = accessibility_status

    db.commit()
    db.refresh(shelter)

    # Log occupancy audit
    log_audit_action(
        db=db,
        action="UPDATE_SHELTER_OCCUPANCY",
        entity_type="Shelter",
        entity_id=shelter.id,
        entity_name=shelter.name,
        field_name="current_occupancy",
        old_value=old_occupancy,
        new_value=shelter.current_occupancy,
        username=username,
        user_role=user_role,
        user_id=user_id,
        notes=notes or f"Updated shelter occupancy to {shelter.current_occupancy}/{shelter.total_capacity}"
    )

    if accessibility_status and accessibility_status != old_accessibility:
        log_audit_action(
            db=db,
            action="UPDATE_SHELTER_ACCESSIBILITY",
            entity_type="Shelter",
            entity_id=shelter.id,
            entity_name=shelter.name,
            field_name="accessibility_status",
            old_value=old_accessibility,
            new_value=accessibility_status,
            username=username,
            user_role=user_role,
            user_id=user_id,
            notes=notes
        )

    occ_pct = round((shelter.current_occupancy / shelter.total_capacity * 100.0) if shelter.total_capacity > 0 else 0.0, 1)
    return ShelterResponse(
        id=shelter.id,
        location_id=shelter.location_id,
        name=shelter.name,
        district=shelter.district,
        total_capacity=shelter.total_capacity,
        current_occupancy=shelter.current_occupancy,
        available_capacity=shelter.available_capacity,
        accessibility_status=shelter.accessibility_status,
        latitude=shelter.latitude,
        longitude=shelter.longitude,
        contact_person=shelter.contact_person,
        contact_phone=shelter.contact_phone,
        is_active=shelter.is_active,
        updated_at=shelter.updated_at,
        is_simulated=shelter.is_simulated,
        location_name=shelter.location.name if shelter.location else None,
        occupancy_pct=occ_pct
    )

def calculate_district_shelter_gap(db: Session, district: str, estimated_evacuation_demand: int) -> ShelterGapAnalysis:
    shelters = db.query(Shelter).filter(Shelter.district == district, Shelter.is_active == True).all()
    total_cap = sum(s.total_capacity for s in shelters)
    cur_occ = sum(s.current_occupancy for s in shelters)
    avail_cap = max(0, total_cap - cur_occ)

    gap = max(0, estimated_evacuation_demand - avail_cap)
    if gap > 0:
        status = "DEFICIT"
        warning = f"Critical shelter capacity gap of {gap:,} persons in district {district}. Immediate makeshift camps or inter-district transit required."
    elif avail_cap < (estimated_evacuation_demand * 1.25):
        status = "TIGHT"
        warning = f"Shelter capacity tight in {district}. Available headroom is only {avail_cap - estimated_evacuation_demand:,} spaces."
    else:
        status = "SURPLUS"
        warning = None

    return ShelterGapAnalysis(
        district=district,
        total_shelters=len(shelters),
        total_capacity=total_cap,
        current_occupancy=cur_occ,
        total_available_capacity=avail_cap,
        estimated_evacuation_demand=estimated_evacuation_demand,
        capacity_gap=gap,
        status=status,
        warning_message=warning
    )
