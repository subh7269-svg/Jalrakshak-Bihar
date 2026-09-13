# Data Dictionary: JalRakshak Bihar

## 1. Data Provenance & Category Standard
To uphold the core principle **"Never Invent Real-World Facts"**, every field in the database belongs to one of the following five origin classes:

| Class | Tag | Description | Example |
|---|---|---|---|
| **Class 1** | `REAL_PUBLIC` | Verifiable open government / scientific dataset | SRTM Digital Elevation (m ASL) |
| **Class 2** | `OFFICIAL_INPUT` | Authenticated user/official-entered operational data | Reported road blockage, deployed boats |
| **Class 3** | `CALCULATED` | Transparent mathematical derivation | `exposed_pop = pop * prob`, `shortage = req - avail` |
| **Class 4** | `ML_PREDICTION` | Probabilistic inference from trained ML model | Inundation risk probability (0-100%) |
| **Class 5** | `SIMULATED_DEMO` | Calibrated synthetic telemetry for crisis scenario demonstration | Monsoon gauge surge telemetry |

---

## 2. Table Specifications

### `locations` (Bihar Flood Monitoring Stations)
Represents geographic settlements, blocks, and river basin junctions.

| Column | Type | Nullable | Description | Category |
|---|---|---|---|---|
| `id` | INTEGER | No | Primary key | System |
| `name` | VARCHAR(100) | No | Settlement / station name (e.g. "Kunauli") | Verified Bihar Geography |
| `district` | VARCHAR(50) | No | Administrative district (e.g. "Supaul") | Verified Bihar Geography |
| `block` | VARCHAR(50) | No | Sub-district administrative block | Verified Bihar Geography |
| `panchayat` | VARCHAR(100) | Yes | Local Gram Panchayat | Verified Bihar Geography |
| `latitude` | FLOAT | No | WGS84 decimal latitude | GIS Telemetry |
| `longitude` | FLOAT | No | WGS84 decimal longitude | GIS Telemetry |
| `elevation_m` | FLOAT | No | Elevation above sea level (meters) | Class 1 (SRTM DEM) |
| `population` | INTEGER | No | Projected residential settlement population | Class 5 (Calibrated Demographic) |
| `river_basin` | VARCHAR(50) | No | River catchment (Kosi, Bagmati, Ganga, Gandak) | Verified Hydrology |
| `baseline_vulnerability` | FLOAT | No | Historical flood index & social vulnerability (0.0 - 1.0) | Class 3 / 5 |
| `is_active` | BOOLEAN | No | Active telemetry status flag | System |

---

### `hydrology_data` (Physical Sensor Telemetry)
Hydrological river stage and meteorological observations.

| Column | Type | Nullable | Description | Category |
|---|---|---|---|---|
| `id` | INTEGER | No | Primary key | System |
| `location_id` | INTEGER | No | Foreign key referencing `locations.id` (Unique) | System |
| `rainfall_24h_mm` | FLOAT | No | Cumulative 24-hour precipitation (mm) | Class 5 (Simulated IMD Catchment) |
| `river_level_m` | FLOAT | No | Current river gauge level (meters) | Class 5 (Simulated CWC Gauge) |
| `danger_mark_m` | FLOAT | No | Statutory official Danger Mark (meters) | Class 1 / 5 (CWC HFL Benchmark) |
| `warning_mark_m` | FLOAT | No | Warning mark indicating initial overflow alert | Class 1 / 5 (CWC Benchmark) |
| `river_rise_rate_3h_m` | FLOAT | No | Water surface velocity over past 3 hours (+/- meters) | Class 3 (Calculated Gauge Differential) |
| `distance_to_river_km` | FLOAT | No | Distance to primary active river channel (km) | Class 1 (GIS Euclidean Distance) |
| `soil_saturation_pct` | FLOAT | No | Antecedent moisture condition / saturation percentage | Class 3 / 5 |
| `data_source_type` | VARCHAR(100) | No | Explicit provenance label | Metadata |
| `is_simulated` | BOOLEAN | No | Boolean flag indicating synthetic demonstration status | Metadata |

---

### `risk_assessments` (AI Engine Output & Explainability)
Output of the Scikit-Learn Random Forest inference engine.

| Column | Type | Nullable | Description | Category |
|---|---|---|---|---|
| `id` | INTEGER | No | Primary key | System |
| `location_id` | INTEGER | No | Foreign key referencing `locations.id` (Unique) | System |
| `risk_score_pct` | FLOAT | No | Flood risk probability (0.0% to 100.0%) | Class 4 (ML Prediction) |
| `risk_level` | VARCHAR(20) | No | Category: `LOW`, `MODERATE`, `HIGH`, `CRITICAL` | Class 3 (Thresholded) |
| `predicted_exposure_pct` | FLOAT | No | Statistical exposure probability envelope | Class 4 (ML Prediction) |
| `estimated_exposed_population` | INTEGER | No | Estimated population potentially exposed | Class 3 (`pop * prob / 100`) |
| `contributing_factors_json` | TEXT | No | JSON array of feature contributions and weights | Class 4 (Tree Attribution) |
| `explanation_summary` | TEXT | Yes | Plain-language executive narrative | Class 3 / 4 |
| `calculation_method` | VARCHAR(100) | No | Architecture and pipeline version string | Metadata |

---

### `resources` (Emergency Inventory & Staging)
Field assets staged across Bihar SDRF, NDRF, and DEOC relief depots.

| Column | Type | Nullable | Description | Category |
|---|---|---|---|---|
| `id` | INTEGER | No | Primary key | System |
| `location_id` | INTEGER | Yes | Associated station/district link | System |
| `resource_type` | VARCHAR(100) | No | Rescue boats, Rescue teams, Ambulances, etc. | Class 2 / 5 |
| `station_name` | VARCHAR(100) | No | Depot / Base (e.g. "SDRF 4th Coy Post Supaul") | Class 2 / 5 |
| `total_quantity` | INTEGER | No | Total physical units stationed | Class 2 / 5 |
| `available_quantity` | INTEGER | No | Units currently available for dispatch | Class 2 (Official Input) |
| `deployed_quantity` | INTEGER | No | Units actively committed to field rescue | Class 2 (Official Input) |
| `unit` | VARCHAR(30) | No | Measurement unit (boats, teams, packets, litres) | Metadata |
| `status` | VARCHAR(50) | No | `OPERATIONAL`, `LOW_STOCK`, `DEPLETED`, `MOBILIZING` | Class 3 (Calculated) |
| `destination` | VARCHAR(100) | Yes | Field sector where deployed | Class 2 (Official Input) |
| `last_updated_by` | VARCHAR(100) | No | Officer username and role | Class 2 |

---

### `shelters` (Relief Shelters & Community Camps)
Registered high-ground evacuation shelters.

| Column | Type | Nullable | Description | Category |
|---|---|---|---|---|
| `id` | INTEGER | No | Primary key | System |
| `location_id` | INTEGER | No | Foreign key referencing `locations.id` | System |
| `name` | VARCHAR(150) | No | Facility name (School, Community Center, Hall) | Class 5 (Demonstration Shelter) |
| `district` | VARCHAR(50) | No | Administrative district | Class 5 |
| `total_capacity` | INTEGER | No | Maximum licensed accommodation capacity (persons) | Class 2 / 5 |
| `current_occupancy` | INTEGER | No | Count of registered evacuees currently sheltered | Class 2 (Official Input) |
| `available_capacity` | INTEGER | No | Remaining spaces (`total_capacity - current_occupancy`) | Class 3 (Calculated) |
| `accessibility_status` | VARCHAR(50) | No | `ACCESSIBLE`, `LIMITED`, `CUT_OFF` | Class 2 (Field Recon Input) |

---

### `road_statuses` (Field Accessibility & Route Blockages)
Ground road network reports directly influencing AI priority isolation scores.

| Column | Type | Nullable | Description | Category |
|---|---|---|---|---|
| `id` | INTEGER | No | Primary key | System |
| `location_id` | INTEGER | No | Foreign key referencing `locations.id` | System |
| `road_name` | VARCHAR(120) | No | Highway / corridor name (e.g. "NH-27 Kunauli Feeder Link") | Class 2 (Official Field Report) |
| `route_segment` | VARCHAR(150) | No | Chainage or reach description | Class 2 |
| `status` | VARCHAR(50) | No | `OPEN`, `PARTIALLY_BLOCKED`, `BLOCKED`, `UNKNOWN` | Class 2 (Field Recon Input) |
| `reported_by` | VARCHAR(100) | No | Field officer username and role | Class 2 |
| `notes` | TEXT | Yes | Water depth, current velocity, vehicle restrictions | Class 2 |

---

### `audit_logs` (Government Oversight & Chain of Custody)
Immutable audit ledger recording all state mutations.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | INTEGER | No | Auto-incrementing primary key |
| `user_id` | INTEGER | Yes | Authenticated user ID |
| `username` | VARCHAR(100) | No | Username of user performing the action |
| `user_role` | VARCHAR(50) | No | Role of user (`ADMIN`, `DISTRICT_OFFICIAL`, `FIELD_OFFICER`) |
| `action` | VARCHAR(80) | No | Action code (e.g. `UPDATE_RESOURCE_INVENTORY`, `REPORT_ROAD_STATUS`) |
| `entity_type` | VARCHAR(50) | No | Target entity (`Resource`, `Shelter`, `RoadStatus`, `Incident`) |
| `entity_id` | INTEGER | Yes | Primary key of target entity |
| `entity_name` | VARCHAR(150) | Yes | Human-readable name of target entity |
| `field_name` | VARCHAR(80) | No | Specific attribute modified (e.g. `available_quantity`, `status`) |
| `old_value` | TEXT | Yes | Value prior to modification |
| `new_value` | TEXT | No | Committed value following modification |
| `timestamp` | DATETIME | No | UTC timestamp of event |
| `notes` | TEXT | Yes | Reason, dispatch note, or justification |
