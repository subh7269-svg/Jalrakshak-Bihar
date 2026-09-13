import math
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.resource import Resource
from app.models.location import Location
from app.schemas.resource import (
    ResourceResponse,
    ResourceUpdateRequest,
    ResourcePlanningAssumption,
    ResourceRequirementItem,
    LocationResourcePlan
)
from app.services.audit_service import log_audit_action

def get_all_resources(db: Session, district: Optional[str] = None) -> List[ResourceResponse]:
    query = db.query(Resource)
    if district and district != "ALL":
        query = query.join(Location, Resource.location_id == Location.id, isouter=True).filter(
            (Location.district == district) | (Resource.station_name.contains(district))
        )
    resources = query.all()

    res_list = []
    for r in resources:
        res_list.append(ResourceResponse(
            id=r.id,
            location_id=r.location_id,
            resource_type=r.resource_type,
            station_name=r.station_name,
            total_quantity=r.total_quantity,
            available_quantity=r.available_quantity,
            deployed_quantity=r.deployed_quantity,
            unit=r.unit,
            status=r.status,
            destination=r.destination,
            last_updated_by=r.last_updated_by,
            updated_at=r.updated_at,
            is_simulated=r.is_simulated,
            location_name=r.location.name if r.location else None,
            district=r.location.district if r.location else None
        ))
    return res_list

def update_resource_inventory(
    db: Session,
    update_req: ResourceUpdateRequest,
    username: str = "official",
    user_role: str = "DISTRICT_OFFICIAL",
    user_id: Optional[int] = None
) -> ResourceResponse:
    resource = db.query(Resource).filter(Resource.id == update_req.resource_id).first()
    if not resource:
        raise ValueError(f"Resource with id {update_req.resource_id} not found")

    old_available = resource.available_quantity
    old_deployed = resource.deployed_quantity
    old_status = resource.status

    resource.available_quantity = update_req.available_quantity
    resource.deployed_quantity = update_req.deployed_quantity
    resource.total_quantity = update_req.available_quantity + update_req.deployed_quantity

    if update_req.status:
        resource.status = update_req.status
    else:
        if resource.available_quantity == 0:
            resource.status = "DEPLETED"
        elif resource.available_quantity < (resource.total_quantity * 0.25):
            resource.status = "LOW_STOCK"
        else:
            resource.status = "OPERATIONAL"

    if update_req.destination is not None:
        resource.destination = update_req.destination

    resource.last_updated_by = f"{username} ({user_role})"
    resource.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(resource)

    # Immutable audit entry
    log_audit_action(
        db=db,
        action="UPDATE_RESOURCE_INVENTORY",
        entity_type="Resource",
        entity_id=resource.id,
        entity_name=f"{resource.station_name} - {resource.resource_type}",
        field_name="available_quantity",
        old_value=f"Avail: {old_available}, Deployed: {old_deployed}",
        new_value=f"Avail: {resource.available_quantity}, Deployed: {resource.deployed_quantity}, Status: {resource.status}",
        username=username,
        user_role=user_role,
        user_id=user_id,
        notes=update_req.notes or f"Updated {resource.resource_type} inventory status to {resource.status}"
    )

    return ResourceResponse(
        id=resource.id,
        location_id=resource.location_id,
        resource_type=resource.resource_type,
        station_name=resource.station_name,
        total_quantity=resource.total_quantity,
        available_quantity=resource.available_quantity,
        deployed_quantity=resource.deployed_quantity,
        unit=resource.unit,
        status=resource.status,
        destination=resource.destination,
        last_updated_by=resource.last_updated_by,
        updated_at=resource.updated_at,
        is_simulated=resource.is_simulated,
        location_name=resource.location.name if resource.location else None,
        district=resource.location.district if resource.location else None
    )

def calculate_location_resource_requirements(
    db: Session,
    location_id: int,
    assumptions: Optional[ResourcePlanningAssumption] = None
) -> LocationResourcePlan:
    """
    Transparent Resource Requirement Engine.
    Follows required formula:
    Evac Target = exposed_population * (evacuation_ratio_pct / 100)
    Capacity per boat = boat_capacity * expected_trips
    Required boats = ceil(Evac Target / Capacity per boat)
    Shortage = max(0, Required boats - Available boats)
    """
    if assumptions is None:
        assumptions = ResourcePlanningAssumption()

    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise ValueError(f"Location {location_id} not found")

    assessment = loc.risk_assessment
    exposed_pop = assessment.estimated_exposed_population if assessment else int(loc.population * 0.5)
    risk_level = assessment.risk_level if assessment else "MODERATE"

    # 1. Evacuation Target calculation
    evac_ratio = assumptions.evacuation_ratio_pct / 100.0
    evac_target = int(math.ceil(exposed_pop * evac_ratio))

    # Retrieve stationed or nearby district resources
    nearby_resources = db.query(Resource).filter(
        (Resource.location_id == location_id) | (Resource.station_name.contains(loc.district))
    ).all()

    resource_map: Dict[str, Dict[str, int]] = {}
    for r in nearby_resources:
        if r.resource_type not in resource_map:
            resource_map[r.resource_type] = {"available": 0, "deployed": 0}
        resource_map[r.resource_type]["available"] += r.available_quantity
        resource_map[r.resource_type]["deployed"] += r.deployed_quantity

    def get_stock(res_name: str) -> tuple:
        data = resource_map.get(res_name, {"available": 0, "deployed": 0})
        return data["available"], data["deployed"]

    # --- Calculation 1: Rescue Boats ---
    # Capacity per boat = boat_capacity * trips
    boat_cap_per_unit = assumptions.boat_capacity_persons * assumptions.expected_trips_per_boat
    req_boats = math.ceil(evac_target / boat_cap_per_unit) if boat_cap_per_unit > 0 else 0
    avail_boats, dep_boats = get_stock("Rescue boats")
    shortage_boats = max(0, req_boats - avail_boats)

    boat_basis = (
        f"Evacuees: {evac_target:,} ÷ (Capacity {assumptions.boat_capacity_persons} × "
        f"{assumptions.expected_trips_per_boat} trips = {boat_cap_per_unit}/boat) = {req_boats} boats"
    )

    # --- Calculation 2: Rescue Teams (NDRF / SDRF) ---
    # 1 team per 5 active rescue boats or per 300 evacuees
    req_teams = max(1, math.ceil(req_boats / 4)) if evac_target > 0 else 0
    avail_teams, dep_teams = get_stock("Rescue teams")
    shortage_teams = max(0, req_teams - avail_teams)
    team_basis = f"1 trained rescue squad per 4 boats (or per 300 evacuees) = {req_teams} teams"

    # --- Calculation 3: Food Packets ---
    # evacuees * food_packets_per_day * horizon_days
    req_food = evac_target * assumptions.food_packets_per_person_per_day * assumptions.planning_horizon_days
    avail_food, dep_food = get_stock("Food packets")
    shortage_food = max(0, req_food - avail_food)
    food_basis = (
        f"{evac_target:,} evacuees × {assumptions.food_packets_per_person_per_day} pkts/day × "
        f"{assumptions.planning_horizon_days} days = {req_food:,} packets"
    )

    # --- Calculation 4: Drinking Water ---
    req_water = int(evac_target * assumptions.water_litres_per_person_per_day * assumptions.planning_horizon_days)
    avail_water, dep_water = get_stock("Drinking water")
    shortage_water = max(0, req_water - avail_water)
    water_basis = (
        f"{evac_target:,} evacuees × {assumptions.water_litres_per_person_per_day:.1f} L/day × "
        f"{assumptions.planning_horizon_days} days = {req_water:,} Litres"
    )

    # --- Calculation 5: Medical Kits ---
    req_med_kits = math.ceil(evac_target * (assumptions.medical_kits_per_100_persons / 100.0))
    avail_med, dep_med = get_stock("Medical kits")
    shortage_med = max(0, req_med_kits - avail_med)
    med_basis = f"{assumptions.medical_kits_per_100_persons} kit(s) per 100 evacuated persons = {req_med_kits} kits"

    # --- Calculation 6: Ambulances ---
    req_ambulances = max(1, math.ceil(evac_target / 400)) if evac_target > 0 else 0
    avail_amb, dep_amb = get_stock("Ambulances")
    shortage_amb = max(0, req_ambulances - avail_amb)
    amb_basis = f"1 advanced life support ambulance per 400 evacuees = {req_ambulances} units"

    requirements = [
        ResourceRequirementItem(
            resource_type="Rescue boats",
            unit="boats",
            planning_estimate_required=req_boats,
            available_quantity=avail_boats,
            deployed_quantity=dep_boats,
            shortage_quantity=shortage_boats,
            calculation_basis=boat_basis,
            status="SEVERE_DEFICIT" if shortage_boats >= 5 else ("DEFICIT" if shortage_boats > 0 else "ADEQUATE")
        ),
        ResourceRequirementItem(
            resource_type="Rescue teams",
            unit="teams",
            planning_estimate_required=req_teams,
            available_quantity=avail_teams,
            deployed_quantity=dep_teams,
            shortage_quantity=shortage_teams,
            calculation_basis=team_basis,
            status="DEFICIT" if shortage_teams > 0 else "ADEQUATE"
        ),
        ResourceRequirementItem(
            resource_type="Food packets",
            unit="packets",
            planning_estimate_required=req_food,
            available_quantity=avail_food,
            deployed_quantity=dep_food,
            shortage_quantity=shortage_food,
            calculation_basis=food_basis,
            status="DEFICIT" if shortage_food > 0 else "ADEQUATE"
        ),
        ResourceRequirementItem(
            resource_type="Drinking water",
            unit="litres",
            planning_estimate_required=req_water,
            available_quantity=avail_water,
            deployed_quantity=dep_water,
            shortage_quantity=shortage_water,
            calculation_basis=water_basis,
            status="DEFICIT" if shortage_water > 0 else "ADEQUATE"
        ),
        ResourceRequirementItem(
            resource_type="Medical kits",
            unit="kits",
            planning_estimate_required=req_med_kits,
            available_quantity=avail_med,
            deployed_quantity=dep_med,
            shortage_quantity=shortage_med,
            calculation_basis=med_basis,
            status="DEFICIT" if shortage_med > 0 else "ADEQUATE"
        ),
        ResourceRequirementItem(
            resource_type="Ambulances",
            unit="vehicles",
            planning_estimate_required=req_ambulances,
            available_quantity=avail_amb,
            deployed_quantity=dep_amb,
            shortage_quantity=shortage_amb,
            calculation_basis=amb_basis,
            status="DEFICIT" if shortage_amb > 0 else "ADEQUATE"
        )
    ]

    return LocationResourcePlan(
        location_id=loc.id,
        location_name=loc.name,
        district=loc.district,
        risk_level=risk_level,
        estimated_exposed_population=exposed_pop,
        estimated_evacuation_target=evac_target,
        assumptions_applied=assumptions,
        requirements=requirements,
        planning_disclaimer=(
            "PLANNING ESTIMATE ONLY: Calculations provide an indicative logistical envelope for emergency staging. "
            "They are not automated operational orders. Resource coordinators may modify operational assumptions above."
        )
    )
