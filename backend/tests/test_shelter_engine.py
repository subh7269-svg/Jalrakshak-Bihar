import pytest
from app.services.shelter_service import (
    get_all_shelters,
    update_shelter_occupancy,
    calculate_district_shelter_gap
)
from app.models.shelter import Shelter

def test_shelter_capacity_and_occupancy_update(db_session):
    shelter = db_session.query(Shelter).first()
    assert shelter is not None

    orig_total = shelter.total_capacity
    new_occ = 500
    updated = update_shelter_occupancy(
        db_session,
        shelter_id=shelter.id,
        new_occupancy=new_occ,
        username="dm_test",
        user_role="DISTRICT_OFFICIAL"
    )
    assert updated.current_occupancy == 500
    assert updated.available_capacity == orig_total - 500
    assert updated.occupancy_pct == round((500 / orig_total) * 100.0, 1)

def test_shelter_gap_analysis(db_session):
    gap_result = calculate_district_shelter_gap(db_session, district="Supaul", estimated_evacuation_demand=10000)
    assert gap_result.district == "Supaul"
    assert gap_result.estimated_evacuation_demand == 10000
    # Available capacity is total - occ
    assert gap_result.capacity_gap == max(0, 10000 - gap_result.total_available_capacity)
    assert gap_result.status == "DEFICIT"
    assert gap_result.warning_message is not None
