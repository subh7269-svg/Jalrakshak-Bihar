import os
import sys
from datetime import datetime, timezone, timedelta

# Ensure backend root is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy.orm import Session
from app.database.session import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.models import (
    User,
    Location,
    HydrologyData,
    RiskAssessment,
    Resource,
    Shelter,
    RoadStatus,
    Incident,
    Alert,
    AuditLog
)
from app.services.risk_service import assess_location_risk

def seed_database(db: Session):
    # Ensure tables created
    Base.metadata.create_all(bind=engine)

    # Check if already seeded
    if db.query(User).first():
        print("Database already contains records. Skipping initial seeding.")
        return

    print("Seeding initial Bihar flood demonstration data...")

    # 1. Users with secure hashed passwords
    users = [
        User(
            username="subh0002",
            email="subh7269@gmail.com",
            hashed_password=get_password_hash("Subh7269#"),
            full_name="State Emergency Operations Coordinator",
            role="ADMIN",
            department="Bihar State Disaster Management Authority (BSDMA)",
            district="ALL"
        ),
        User(
            username="dm_supaul",
            email="dm.supaul@bihar.gov.in",
            hashed_password=get_password_hash("supaul123"),
            full_name="District Magistrate Supaul",
            role="DISTRICT_OFFICIAL",
            department="District Administration Supaul",
            district="Supaul"
        ),
        User(
            username="dm_darbhanga",
            email="dm.darbhanga@bihar.gov.in",
            hashed_password=get_password_hash("darbhanga123"),
            full_name="District Disaster Officer Darbhanga",
            role="DISTRICT_OFFICIAL",
            department="Darbhanga Emergency Cell",
            district="Darbhanga"
        ),
        User(
            username="field_officer",
            email="field.kosi@bihar.gov.in",
            hashed_password=get_password_hash("field123"),
            full_name="SDRF Team Commander Rajesh Kumar",
            role="FIELD_OFFICER",
            department="State Disaster Response Force (SDRF)",
            district="Supaul"
        ),
        User(
            username="viewer",
            email="observer@bihar.gov.in",
            hashed_password=get_password_hash("view123"),
            full_name="Public Information Observer",
            role="VIEW_ONLY",
            department="Information & Public Relations",
            district="ALL"
        )
    ]
    db.add_all(users)
    db.commit()

    # 2. Bihar Flood Monitoring Locations
    locations_data = [
        {
            "name": "Kunauli (Kosi Embankment)",
            "district": "Supaul",
            "block": "Nirmali",
            "panchayat": "Kunauli East",
            "latitude": 26.5410,
            "longitude": 86.8520,
            "elevation_m": 52.0,
            "population": 42000,
            "river_basin": "Kosi Basin",
            "baseline_vulnerability": 0.85,
            # Hydrology
            "rainfall": 165.0,
            "river_level": 53.20,
            "danger_mark": 52.00,
            "warning_mark": 51.20,
            "rise_rate": 0.65,
            "dist_river": 0.8,
            "soil_sat": 92.0
        },
        {
            "name": "Hayaghat (Bagmati Floodplain)",
            "district": "Darbhanga",
            "block": "Hayaghat",
            "panchayat": "Sirnia",
            "latitude": 26.0240,
            "longitude": 85.9030,
            "elevation_m": 39.0,
            "population": 38500,
            "river_basin": "Bagmati Basin",
            "baseline_vulnerability": 0.78,
            "rainfall": 142.0,
            "river_level": 49.30,
            "danger_mark": 48.50,
            "warning_mark": 47.80,
            "rise_rate": 0.45,
            "dist_river": 1.2,
            "soil_sat": 88.0
        },
        {
            "name": "Mahishi (Kosi Lowland)",
            "district": "Saharsa",
            "block": "Mahishi",
            "panchayat": "Nahrawar",
            "latitude": 25.9610,
            "longitude": 86.4820,
            "elevation_m": 41.0,
            "population": 34000,
            "river_basin": "Kosi Basin",
            "baseline_vulnerability": 0.72,
            "rainfall": 115.0,
            "river_level": 48.95,
            "danger_mark": 48.80,
            "warning_mark": 48.00,
            "rise_rate": 0.38,
            "dist_river": 1.8,
            "soil_sat": 84.0
        },
        {
            "name": "Aurai (Burhi Gandak Reach)",
            "district": "Muzaffarpur",
            "block": "Aurai",
            "panchayat": "Dharharwa",
            "latitude": 26.2850,
            "longitude": 85.5210,
            "elevation_m": 44.0,
            "population": 29000,
            "river_basin": "Burhi Gandak Basin",
            "baseline_vulnerability": 0.65,
            "rainfall": 92.0,
            "river_level": 52.10,
            "danger_mark": 52.50,
            "warning_mark": 51.70,
            "rise_rate": 0.22,
            "dist_river": 2.4,
            "soil_sat": 74.0
        },
        {
            "name": "Maner (Ganga-Sone Confluence)",
            "district": "Patna",
            "block": "Maner",
            "panchayat": "Haldi Chhapra",
            "latitude": 25.6520,
            "longitude": 84.8810,
            "elevation_m": 53.0,
            "population": 65000,
            "river_basin": "Ganga Basin",
            "baseline_vulnerability": 0.50,
            "rainfall": 48.0,
            "river_level": 49.80,
            "danger_mark": 50.50,
            "warning_mark": 49.50,
            "rise_rate": 0.12,
            "dist_river": 3.1,
            "soil_sat": 62.0
        },
        {
            "name": "Kahalgaon (Ganga Gorge Reach)",
            "district": "Bhagalpur",
            "block": "Kahalgaon",
            "panchayat": "Olaganj",
            "latitude": 25.2610,
            "longitude": 87.2410,
            "elevation_m": 36.0,
            "population": 51000,
            "river_basin": "Ganga Basin",
            "baseline_vulnerability": 0.45,
            "rainfall": 38.0,
            "river_level": 32.70,
            "danger_mark": 33.50,
            "warning_mark": 32.50,
            "rise_rate": 0.08,
            "dist_river": 2.0,
            "soil_sat": 55.0
        },
        {
            "name": "Barauli (Gandak Plain)",
            "district": "Gopalganj",
            "block": "Barauli",
            "panchayat": "Bahuara",
            "latitude": 26.4350,
            "longitude": 84.5820,
            "elevation_m": 62.0,
            "population": 26000,
            "river_basin": "Gandak Basin",
            "baseline_vulnerability": 0.35,
            "rainfall": 18.0,
            "river_level": 61.10,
            "danger_mark": 63.00,
            "warning_mark": 62.00,
            "rise_rate": -0.04,
            "dist_river": 5.2,
            "soil_sat": 48.0
        }
    ]

    created_locations = []
    for item in locations_data:
        loc = Location(
            name=item["name"],
            district=item["district"],
            block=item["block"],
            panchayat=item["panchayat"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            elevation_m=item["elevation_m"],
            population=item["population"],
            river_basin=item["river_basin"],
            baseline_vulnerability=item["baseline_vulnerability"],
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(loc)
        db.commit()
        db.refresh(loc)

        hydro = HydrologyData(
            location_id=loc.id,
            rainfall_24h_mm=item["rainfall"],
            river_level_m=item["river_level"],
            danger_mark_m=item["danger_mark"],
            warning_mark_m=item["warning_mark"],
            river_rise_rate_3h_m=item["rise_rate"],
            distance_to_river_km=item["dist_river"],
            soil_saturation_pct=item["soil_sat"],
            data_source_type="Simulated demonstration data (Calibrated on CWC/IMD Monsoon telemetry)",
            is_simulated=True,
            recorded_at=datetime.now(timezone.utc)
        )
        db.add(hydro)
        db.commit()
        db.refresh(hydro)

        # Run risk assessment
        assess_location_risk(db, loc)
        created_locations.append(loc)

    # 3. Emergency Resources stationed across Bihar disaster zones
    supaul_loc = created_locations[0]
    darbhanga_loc = created_locations[1]
    patna_loc = created_locations[4]

    resources = [
        # Supaul Caches
        Resource(
            location_id=supaul_loc.id,
            resource_type="Rescue boats",
            station_name="SDRF 4th Coy Post Supaul",
            total_quantity=18,
            available_quantity=6,
            deployed_quantity=12,
            unit="motorized inflatable boats",
            status="LOW_STOCK",
            destination="Kunauli Embankment Reach",
            last_updated_by="dm_supaul (DISTRICT_OFFICIAL)",
            is_simulated=True
        ),
        Resource(
            location_id=supaul_loc.id,
            resource_type="Rescue teams",
            station_name="SDRF 4th Coy Post Supaul",
            total_quantity=5,
            available_quantity=2,
            deployed_quantity=3,
            unit="deep-dive rescue squads",
            status="OPERATIONAL",
            destination="Nirmali Sector A",
            last_updated_by="dm_supaul (DISTRICT_OFFICIAL)",
            is_simulated=True
        ),
        Resource(
            location_id=supaul_loc.id,
            resource_type="Food packets",
            station_name="Supaul District Relief Warehouse",
            total_quantity=15000,
            available_quantity=4500,
            deployed_quantity=10500,
            unit="dry ration packets",
            status="LOW_STOCK",
            destination="Kunauli & Saraigarh camps",
            last_updated_by="dm_supaul (DISTRICT_OFFICIAL)",
            is_simulated=True
        ),
        Resource(
            location_id=supaul_loc.id,
            resource_type="Drinking water",
            station_name="Supaul Water Treatment Mobile Unit",
            total_quantity=25000,
            available_quantity=8000,
            deployed_quantity=17000,
            unit="sealed 5L pouches",
            status="OPERATIONAL",
            destination="Flood relief staging posts",
            last_updated_by="dm_supaul (DISTRICT_OFFICIAL)",
            is_simulated=True
        ),
        Resource(
            location_id=supaul_loc.id,
            resource_type="Medical kits",
            station_name="Supaul Civil Hospital Depot",
            total_quantity=350,
            available_quantity=80,
            deployed_quantity=270,
            unit="emergency field kits",
            status="LOW_STOCK",
            destination="Frontline rescue boats & camps",
            last_updated_by="dm_supaul (DISTRICT_OFFICIAL)",
            is_simulated=True
        ),
        Resource(
            location_id=supaul_loc.id,
            resource_type="Ambulances",
            station_name="102 Emergency Dispatch Supaul",
            total_quantity=12,
            available_quantity=4,
            deployed_quantity=8,
            unit="BLS/ALS ambulances",
            status="OPERATIONAL",
            destination="Nirmali Hospital Link",
            last_updated_by="dm_supaul (DISTRICT_OFFICIAL)",
            is_simulated=True
        ),

        # Darbhanga Caches
        Resource(
            location_id=darbhanga_loc.id,
            resource_type="Rescue boats",
            station_name="Darbhanga District Relief Cell",
            total_quantity=22,
            available_quantity=9,
            deployed_quantity=13,
            unit="motorized rescue boats",
            status="OPERATIONAL",
            destination="Hayaghat Lowlands",
            last_updated_by="dm_darbhanga (DISTRICT_OFFICIAL)",
            is_simulated=True
        ),
        Resource(
            location_id=darbhanga_loc.id,
            resource_type="Rescue teams",
            station_name="NDRF Sub-Team Hayaghat",
            total_quantity=6,
            available_quantity=3,
            deployed_quantity=3,
            unit="certified disaster response squads",
            status="OPERATIONAL",
            destination="Sirnia Ward 4",
            last_updated_by="dm_darbhanga (DISTRICT_OFFICIAL)",
            is_simulated=True
        ),
        Resource(
            location_id=darbhanga_loc.id,
            resource_type="Food packets",
            station_name="Darbhanga Central Godown",
            total_quantity=20000,
            available_quantity=12000,
            deployed_quantity=8000,
            unit="rations",
            status="OPERATIONAL",
            destination="Hayaghat High School Camp",
            last_updated_by="dm_darbhanga (DISTRICT_OFFICIAL)",
            is_simulated=True
        ),

        # Patna State Strategic Pool (NDRF 9th Bn Bihta)
        Resource(
            location_id=patna_loc.id,
            resource_type="Rescue boats",
            station_name="NDRF 9th Bn Headquarters Bihta",
            total_quantity=45,
            available_quantity=32,
            deployed_quantity=13,
            unit="assault/rescue craft",
            status="OPERATIONAL",
            destination="State Strategic Reserve",
            last_updated_by="admin (ADMIN)",
            is_simulated=True
        ),
        Resource(
            location_id=patna_loc.id,
            resource_type="Rescue teams",
            station_name="NDRF 9th Bn Headquarters Bihta",
            total_quantity=15,
            available_quantity=11,
            deployed_quantity=4,
            unit="battalion rescue teams",
            status="OPERATIONAL",
            destination="Standby for North Bihar airlift",
            last_updated_by="admin (ADMIN)",
            is_simulated=True
        )
    ]
    db.add_all(resources)
    db.commit()

    # 4. Shelters
    shelters = [
        # Supaul shelters
        Shelter(
            location_id=supaul_loc.id,
            name="Kunauli Adarsh Middle School Flood Shelter",
            district="Supaul",
            total_capacity=1500,
            current_occupancy=1380,
            available_capacity=120,
            accessibility_status="LIMITED",
            latitude=26.5490,
            longitude=86.8580,
            contact_person="Ramesh Yadav (Camp Head)",
            contact_phone="+91-94312-88101",
            is_active=True,
            is_simulated=True
        ),
        Shelter(
            location_id=supaul_loc.id,
            name="Nirmali High Ground Multi-Purpose Cyclone/Flood Center",
            district="Supaul",
            total_capacity=2200,
            current_occupancy=2100,
            available_capacity=100,
            accessibility_status="ACCESSIBLE",
            latitude=26.5350,
            longitude=86.8410,
            contact_person="Sunita Devi (BDO In-Charge)",
            contact_phone="+91-94312-88102",
            is_active=True,
            is_simulated=True
        ),
        # Darbhanga shelters
        Shelter(
            location_id=darbhanga_loc.id,
            name="Hayaghat Block Community Hall Relief Center",
            district="Darbhanga",
            total_capacity=1800,
            current_occupancy=1150,
            available_capacity=650,
            accessibility_status="ACCESSIBLE",
            latitude=26.0290,
            longitude=85.9080,
            contact_person="Manoj Choudhary",
            contact_phone="+91-94312-77201",
            is_active=True,
            is_simulated=True
        ),
        # Saharsa shelter
        Shelter(
            location_id=created_locations[2].id,
            name="Mahishi High School Relief Camp",
            district="Saharsa",
            total_capacity=1600,
            current_occupancy=1300,
            available_capacity=300,
            accessibility_status="LIMITED",
            latitude=25.9680,
            longitude=86.4890,
            contact_person="Dinesh Thakur",
            contact_phone="+91-94312-66301",
            is_active=True,
            is_simulated=True
        ),
        # Patna shelter
        Shelter(
            location_id=patna_loc.id,
            name="Maner Riverbank Flood Protection Center",
            district="Patna",
            total_capacity=3000,
            current_occupancy=450,
            available_capacity=2550,
            accessibility_status="ACCESSIBLE",
            latitude=25.6580,
            longitude=84.8870,
            contact_person="Anil Verma",
            contact_phone="+91-94312-55401",
            is_active=True,
            is_simulated=True
        )
    ]
    db.add_all(shelters)
    db.commit()

    # 5. Road Status Reports
    road_reports = [
        RoadStatus(
            location_id=supaul_loc.id,
            road_name="NH-27 Kunauli Feeder Link",
            route_segment="Km 42-46 Lowland Embankment Reach",
            status="BLOCKED",
            reported_by="field_officer (FIELD_OFFICER)",
            reporter_role="FIELD_OFFICER",
            notes="Embankment overtopping has inundated 800m of tarmac under 2.5 feet of fast-moving current. Light/heavy vehicles suspended.",
            photo_url="/assets/demo/road_submerged.jpg",
            is_simulated=True
        ),
        RoadStatus(
            location_id=darbhanga_loc.id,
            road_name="SH-50 Darbhanga-Samastipur Arterial",
            route_segment="Km 12 Bridge Approach",
            status="PARTIALLY_BLOCKED",
            reported_by="dm_darbhanga (DISTRICT_OFFICIAL)",
            reporter_role="DISTRICT_OFFICIAL",
            notes="Single-lane traffic operating with slow police escort. Guardrail submerged on western flank.",
            photo_url="/assets/demo/sh50_waterlogging.jpg",
            is_simulated=True
        ),
        RoadStatus(
            location_id=created_locations[2].id,
            road_name="Mahishi-Bangaon Road",
            route_segment="Near Culvert #4",
            status="PARTIALLY_BLOCKED",
            reported_by="field_officer (FIELD_OFFICER)",
            reporter_role="FIELD_OFFICER",
            notes="Waterlogged up to 1 foot. Small tractors and heavy 4x4 trucks passable.",
            is_simulated=True
        ),
        RoadStatus(
            location_id=patna_loc.id,
            road_name="Danapur-Maner Highway (NH-922)",
            route_segment="Complete Corridor",
            status="OPEN",
            reported_by="admin (ADMIN)",
            reporter_role="ADMIN",
            notes="Clear and dry. Emergency corridor established for heavy convoy transit.",
            is_simulated=True
        )
    ]
    db.add_all(road_reports)
    db.commit()

    # 6. Active Incidents
    incidents = [
        Incident(
            location_id=supaul_loc.id,
            incident_type="Embankment Stress / Micro-Breach Risk",
            severity="CRITICAL",
            description="Kosi Eastern Afflux Bundh chainage 14.8 km facing heavy vortex scouring. Sandbag revetment teams deployed.",
            status="IN_PROGRESS",
            reported_by="field_officer",
            is_simulated=True
        ),
        Incident(
            location_id=darbhanga_loc.id,
            incident_type="Trapped Villagers",
            severity="HIGH",
            description="Approximately 120 residents marooned on high mounds in Sirnia Tola awaiting boat evacuation.",
            status="IN_PROGRESS",
            reported_by="dm_darbhanga",
            is_simulated=True
        ),
        Incident(
            location_id=created_locations[2].id,
            incident_type="Drinking Water Contamination",
            severity="MEDIUM",
            description="Submerged handpumps in Mahishi Ward 7. Bleaching powder and chlorine tablets requisitioned.",
            status="REPORTED",
            reported_by="field_officer",
            is_simulated=True
        )
    ]
    db.add_all(incidents)
    db.commit()

    # 7. Initial Alerts
    alerts = [
        Alert(
            location_id=supaul_loc.id,
            title="KOSI EMBANKMENT CRITICAL SURGE DETECTED",
            severity="CRITICAL",
            alert_type="THRESHOLD_BREACH",
            what_happened="River Kosi gauge at Kunauli reached 53.20m, exceeding the official Danger Level (52.0m) by 1.20m with upstream rise of +0.65m/3h.",
            where_location="Kunauli, Supaul District (Kosi Basin)",
            why_it_matters="Over 42,000 residents in surrounding lowlands face acute inundation. NH-27 feeder road is blocked, restricting surface evacuation.",
            recommended_step="Deploy available SDRF motorized craft; order mandatory evacuation of low-lying tolas; trigger mutual aid request for 12 additional boats.",
            is_simulated=True
        ),
        Alert(
            location_id=darbhanga_loc.id,
            title="BAGMATI OVERFLOW & ROAD RESTRICTION",
            severity="WARNING",
            alert_type="ROAD_CUT",
            what_happened="SH-50 bridge approach reported partially blocked under 1.5 ft water; river gauge is +0.8m above danger mark.",
            where_location="Hayaghat, Darbhanga District",
            why_it_matters="Evacuation convoy throughput reduced by 60%; ~120 marooned persons require priority boat extraction.",
            recommended_step="Stage 4 SDRF boats at Sirnia Ghat; divert non-emergency traffic via SH-88.",
            is_simulated=True
        ),
        Alert(
            location_id=supaul_loc.id,
            title="SHELTER CAPACITY DEFICIT PROJECTED",
            severity="WARNING",
            alert_type="SHELTER_GAP",
            what_happened="Combined local active shelters have only 220 remaining beds against projected immediate evacuation demand of 3,800+ persons.",
            where_location="Nirmali / Kunauli Block, Supaul",
            why_it_matters="High risk of overcrowded shelters or displaced citizens stranded on rain-soaked river dykes.",
            recommended_step="Requisition Nirmali College and Railway High School as secondary transit camps; mobilize 50 waterproof relief tents.",
            is_simulated=True
        )
    ]
    db.add_all(alerts)
    db.commit()

    # 8. Initial Audit Log
    audit_logs = [
        AuditLog(
            user_id=1,
            username="admin",
            user_role="ADMIN",
            action="SYSTEM_INIT",
            entity_type="System",
            entity_id=None,
            entity_name="JalRakshak Bihar Core",
            field_name="status",
            old_value="OFFLINE",
            new_value="OPERATIONAL_ONLINE",
            notes="Initialized Bihar Flood Decision Support Command Center telemetry."
        ),
        AuditLog(
            user_id=2,
            username="dm_supaul",
            user_role="DISTRICT_OFFICIAL",
            action="UPDATE_RESOURCE_INVENTORY",
            entity_type="Resource",
            entity_id=1,
            entity_name="SDRF 4th Coy Post Supaul - Rescue boats",
            field_name="deployed_quantity",
            old_value="0",
            new_value="12",
            notes="Deployed 12 rescue boats to Kunauli Embankment sector."
        ),
        AuditLog(
            user_id=4,
            username="field_officer",
            user_role="FIELD_OFFICER",
            action="REPORT_ROAD_STATUS",
            entity_type="RoadStatus",
            entity_id=1,
            entity_name="NH-27 Kunauli Feeder Link",
            field_name="status",
            old_value="OPEN",
            new_value="BLOCKED",
            notes="Inundation confirmed on Km 42-46 by field inspection team."
        )
    ]
    db.add_all(audit_logs)
    db.commit()

    print("Seed data completed successfully!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
