from fastapi import APIRouter
from app.schemas.data_sources import DataSourceCatalogResponse, DataSourceItem

router = APIRouter(prefix="/data-sources", tags=["Data Provenance & Transparency"])

@router.get("", response_model=DataSourceCatalogResponse)
def get_data_sources_catalog():
    catalog = [
        DataSourceItem(
            category="Precipitation Telemetry",
            dataset_name="24-Hour Cumulative Catchment Rainfall",
            provider="India Meteorological Department (IMD) Gridded Rainfall Data / CWC Gauge Network",
            data_type="Simulated Demonstration Data",
            is_simulated=True,
            refresh_frequency="Hourly / Synoptic updates",
            last_ingested_or_updated="Live Ingestion Simulation (Current Monsoon Cycle)",
            processing_method="Spatial interpolation via inverse distance weighting across Bihar river basins; ingested into feature pipeline.",
            reliability_notes="In demo mode, rainfall is synthetically calibrated to historical North Bihar monsoon cloudburst peaks (50-250 mm/24h)."
        ),
        DataSourceItem(
            category="Hydrological River Gauge",
            dataset_name="River Stage & Gauge Levels (Kosi, Bagmati, Gandak, Ganga)",
            provider="Central Water Commission (CWC) Middle Ganga Basin Division",
            data_type="Simulated Demonstration Data",
            is_simulated=True,
            refresh_frequency="Every 3 hours",
            last_ingested_or_updated="Current Active Monitoring Window",
            processing_method="Telemetry compared against statutory Danger Mark (HFL/DL) to compute water surface velocity and rise rate (m/3h).",
            reliability_notes="Synthetic gauge values emulate high-discharge flood pulses (e.g. Kosi barrage releases, Bagmati torrential swells)."
        ),
        DataSourceItem(
            category="Demographics & Settlements",
            dataset_name="Panchayat / Ward Population Density & Base Exposure",
            provider="Census of India (Projected 2024-2026 District Baselines) & BSDMA Vulnerability Atlas",
            data_type="Simulated Public Demographic Baseline",
            is_simulated=True,
            refresh_frequency="Annual / Static baseline",
            last_ingested_or_updated="Baseline 2026 Ingestion",
            processing_method="Aggregated by district, block, and lowland settlement polygons for population exposure calculations.",
            reliability_notes="Populations are calibrated to realistic North Bihar floodplain densities (approx 800 - 1,400 persons/km²)."
        ),
        DataSourceItem(
            category="GIS & Digital Elevation",
            dataset_name="Digital Elevation Model (DEM) & River Channel Proximity",
            provider="SRTM 30m / Survey of India Topographical Sheets",
            data_type="Geospatial Derived Model",
            is_simulated=False,
            refresh_frequency="Static baseline",
            last_ingested_or_updated="System Initialization",
            processing_method="Extracted ground elevation (m ASL) and Euclidean distance (km) to active river channels.",
            reliability_notes="North Bihar plains slope gently from 68m (NW) to 32m (SE), creating drainage depressions (chaurs)."
        ),
        DataSourceItem(
            category="Field Logistics & Accessibility",
            dataset_name="Road Status & Infrastructure Inundation Reports",
            provider="Field Officers, SDRF Patrols & District Emergency Operation Centers (DEOC)",
            data_type="Official Field Operational Input / Demo Data",
            is_simulated=True,
            refresh_frequency="On-Demand / Real-time field reporting",
            last_ingested_or_updated="Continuous operational logging",
            processing_method="Authenticated submissions recorded directly to immutable audit log and factored into priority engine.",
            reliability_notes="Every modification tracks user identity, role, timestamp, prior value, and new value."
        ),
        DataSourceItem(
            category="Emergency Resources & Staging",
            dataset_name="Rescue Boats, Teams, Ambulances, Rations & Shelter Capacity",
            provider="District Magistrates, SDRF Battalions & NDRF 9th Bn Bihta",
            data_type="Official Operational Inventory / Demo Data",
            is_simulated=True,
            refresh_frequency="Real-time operational updates",
            last_ingested_or_updated="Continuous",
            processing_method="Inventory ledger tracking Total, Available, Deployed, and Shortage against planning evacuation targets.",
            reliability_notes="All quantities clearly distinguish between Available, Deployed, and calculated Planning Shortages."
        ),
        DataSourceItem(
            category="Predictive AI & Analytics",
            dataset_name="JalRakshak Flood Risk & Priority Scoring Model",
            provider="JalRakshak Bihar AI Engine (Random Forest & Multi-Factor Decision Pipeline)",
            data_type="Calculated Value / ML Prediction",
            is_simulated=True,
            refresh_frequency="Calculated on sensor telemetry updates",
            last_ingested_or_updated="Live model inference",
            processing_method="120-tree ensemble evaluating 11 hydrological and topographic features with SHAP-calibrated explainability.",
            reliability_notes="Decision support only. Predictions contain transparent confidence levels and explicitly labeled planning estimates."
        )
    ]

    policy = (
        "AUDIT & DATA INTEGRITY POLICY: Every data point displayed on JalRakshak Bihar is strictly tagged with its "
        "originating category. Synthetic demonstration data is prominently badged with 'DEMO / SIMULATED DATA'. "
        "No real-time operational authority is asserted without authenticated CWC/IMD API bindings."
    )

    return DataSourceCatalogResponse(catalog=catalog, audit_policy=policy)
