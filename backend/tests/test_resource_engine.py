import pytest
import math
from app.services.resource_service import (
    calculate_location_resource_requirements,
    update_resource_inventory
)
from app.schemas.resource import ResourcePlanningAssumption, ResourceUpdateRequest
from app.models.location import Location
from app.models.resource import Resource

def test_resource_planning_formula(db_session):
    supaul = db_session.query(Location).filter(Location.name.contains("Kunauli")).first()
    assert supaul is not None

    assumptions = ResourcePlanningAssumption(
        boat_capacity_persons=20,
        expected_trips_per_boat=2,
        evacuation_ratio_pct=25.0
    )

    plan = calculate_location_resource_requirements(db_session, supaul.id, assumptions)
    assert plan.location_id == supaul.id

    # Verify boat math:
    # capacity per unit = 20 * 2 = 40
    # expected evac target = exposed_pop * 0.25
    boat_item = next(item for item in plan.requirements if item.resource_type == "Rescue boats")
    expected_boats = math.ceil(plan.estimated_evacuation_target / 40)
    assert boat_item.planning_estimate_required == expected_boats
    assert boat_item.shortage_quantity == max(0, expected_boats - boat_item.available_quantity)

def test_resource_inventory_update_and_audit(db_session):
    res = db_session.query(Resource).first()
    assert res is not None

    req = ResourceUpdateRequest(
        resource_id=res.id,
        available_quantity=25,
        deployed_quantity=5,
        status="OPERATIONAL"
    )
    updated = update_resource_inventory(db_session, req, username="test_dm", user_role="DISTRICT_OFFICIAL")
    assert updated.available_quantity == 25
    assert updated.deployed_quantity == 5
    assert updated.total_quantity == 30
