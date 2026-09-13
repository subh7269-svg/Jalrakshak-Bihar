from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.database.session import get_db
from app.models.location import Location
from app.models.hydrology import HydrologyData
from app.models.road_status import RoadStatus
from app.models.alert import Alert
from app.models.incident import Incident
from app.services.risk_service import assess_location_risk
from app.services.audit_service import log_audit_action
from app.routers.auth import require_role
from app.models.user import User

router = APIRouter(prefix="/simulate", tags=["Scenario Simulation"])

class ScenarioRequest(BaseModel):
    scenario_id: str  # kosi_surge, bagmati_floodwave, reset_baseline
    notes: Optional[str] = None

@router.post("/scenario")
def trigger_scenario(
    req: ScenarioRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DISTRICT_OFFICIAL"]))
):
    """
    Allows officials and evaluators to simulate dynamic hydrological surge events
    and observe the immediate end-to-end decision support cascade.
    """
    if req.scenario_id == "kosi_surge":
        supaul = db.query(Location).filter(Location.name.contains("Kunauli")).first()
        if not supaul:
            raise HTTPException(status_code=404, detail="Supaul location not found")

        old_level = supaul.hydrology.river_level_m if supaul.hydrology else 53.2
        if supaul.hydrology:
            supaul.hydrology.river_level_m = 54.10
            supaul.hydrology.rainfall_24h_mm = 215.0
            supaul.hydrology.river_rise_rate_3h_m = 0.95
            supaul.hydrology.soil_saturation_pct = 98.0
            supaul.hydrology.recorded_at = datetime.now(timezone.utc)

        # Mark road blocked
        road = db.query(RoadStatus).filter(RoadStatus.location_id == supaul.id).first()
        if road:
            road.status = "BLOCKED"
            road.notes = "SIMULATED SURGE: Embankment overtopping confirmed by aerial drone."

        # Add critical incident
        inc = Incident(
            location_id=supaul.id,
            incident_type="Major Embankment Breach Alert",
            severity="CRITICAL",
            description="Kosi Eastern Bundh Chainage 15.2m overtopping. Fast-moving current entering Kunauli settlement.",
            status="REPORTED",
            reported_by="Simulated Telemetry Trigger",
            is_simulated=True
        )
        db.add(inc)

        # Re-assess risk
        risk = assess_location_risk(db, supaul)

        # Create alert
        alert = Alert(
            location_id=supaul.id,
            title="EXTREME WATER SURGE - KOSI EMBANKMENT (SIMULATION)",
            severity="CRITICAL",
            alert_type="RAPID_RISE",
            what_happened="Hydrological surge of +0.95m/3h pushed Kosi river level to 54.10m (+2.1m above danger mark).",
            where_location="Kunauli, Supaul",
            why_it_matters="Overtopping threatens 42,000 residents; road link completely impassable.",
            recommended_step="Immediately launch maximum boat evacuation; request Indian Army/Air Force rotary airlift for marooned pockets.",
            is_simulated=True
        )
        db.add(alert)
        db.commit()

        log_audit_action(
            db=db,
            action="SIMULATION_TRIGGER",
            entity_type="Simulation",
            entity_id=supaul.id,
            entity_name="Kosi Surge Scenario",
            field_name="river_level_m",
            old_value=old_level,
            new_value=54.10,
            username=current_user.username,
            user_role=current_user.role,
            user_id=current_user.id,
            notes="Evaluator triggered 'Kosi Surge & Embankment Breach' scenario."
        )

        return {
            "scenario": "kosi_surge",
            "status": "applied",
            "message": "Kosi Extreme Surge scenario activated. Supaul river level raised to 54.1m (+2.1m above danger mark). Priority score surged.",
            "location_affected": "Kunauli (Supaul)",
            "new_risk_score": risk.risk_score_pct
        }

    elif req.scenario_id == "bagmati_floodwave":
        darbhanga = db.query(Location).filter(Location.name.contains("Hayaghat")).first()
        if not darbhanga:
            raise HTTPException(status_code=404, detail="Darbhanga location not found")

        old_level = darbhanga.hydrology.river_level_m if darbhanga.hydrology else 49.3
        if darbhanga.hydrology:
            darbhanga.hydrology.river_level_m = 50.40
            darbhanga.hydrology.rainfall_24h_mm = 185.0
            darbhanga.hydrology.river_rise_rate_3h_m = 0.72
            darbhanga.hydrology.soil_saturation_pct = 95.0
            darbhanga.hydrology.recorded_at = datetime.now(timezone.utc)

        # Mark road blocked
        road = db.query(RoadStatus).filter(RoadStatus.location_id == darbhanga.id).first()
        if road:
            road.status = "BLOCKED"
            road.notes = "SIMULATED SURGE: SH-50 bridge approach fully submerged."

        risk = assess_location_risk(db, darbhanga)
        db.commit()

        log_audit_action(
            db=db,
            action="SIMULATION_TRIGGER",
            entity_type="Simulation",
            entity_id=darbhanga.id,
            entity_name="Bagmati Floodwave Scenario",
            field_name="river_level_m",
            old_value=old_level,
            new_value=50.40,
            username=current_user.username,
            user_role=current_user.role,
            user_id=current_user.id,
            notes="Evaluator triggered 'Bagmati Floodwave at Darbhanga' scenario."
        )

        return {
            "scenario": "bagmati_floodwave",
            "status": "applied",
            "message": "Bagmati Floodwave scenario activated. Darbhanga river level raised to 50.40m (+1.9m above danger mark).",
            "location_affected": "Hayaghat (Darbhanga)",
            "new_risk_score": risk.risk_score_pct
        }

    elif req.scenario_id == "reset_baseline":
        # Re-run seed data to restore baseline state
        from app.database.seed_data import locations_data
        for item in locations_data:
            loc = db.query(Location).filter(Location.name == item["name"]).first()
            if loc and loc.hydrology:
                loc.hydrology.rainfall_24h_mm = item["rainfall"]
                loc.hydrology.river_level_m = item["river_level"]
                loc.hydrology.river_rise_rate_3h_m = item["rise_rate"]
                loc.hydrology.soil_saturation_pct = item["soil_sat"]
                assess_location_risk(db, loc)

        # Reset Supaul road to BLOCKED, Darbhanga to PARTIALLY_BLOCKED
        supaul = db.query(Location).filter(Location.name.contains("Kunauli")).first()
        if supaul:
            road = db.query(RoadStatus).filter(RoadStatus.location_id == supaul.id).first()
            if road:
                road.status = "BLOCKED"

        darbhanga = db.query(Location).filter(Location.name.contains("Hayaghat")).first()
        if darbhanga:
            road = db.query(RoadStatus).filter(RoadStatus.location_id == darbhanga.id).first()
            if road:
                road.status = "PARTIALLY_BLOCKED"

        db.commit()

        log_audit_action(
            db=db,
            action="SIMULATION_RESET",
            entity_type="Simulation",
            entity_id=None,
            entity_name="All Locations",
            field_name="all",
            old_value="Custom Scenario",
            new_value="Baseline Demo State",
            username=current_user.username,
            user_role=current_user.role,
            user_id=current_user.id,
            notes="Reset telemetry and operational values to baseline demo state."
        )

        return {
            "scenario": "reset_baseline",
            "status": "applied",
            "message": "All hydrological and operational telemetry reset to baseline demo state."
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unknown scenario ID: {req.scenario_id}")
