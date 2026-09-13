# End-to-End Demonstration Guide: JalRakshak Bihar

This document details the complete 12-step operational demonstration proving the primary decision-support flow:

$$\mathbf{DATA} \longrightarrow \mathbf{RISK\ ANALYSIS} \longrightarrow \mathbf{EXPLANATION} \longrightarrow \mathbf{PRIORITY} \longrightarrow \mathbf{RESOURCE\ GAP} \longrightarrow \mathbf{RECOMMENDED\ ACTION}$$

---

## Prerequisites
- **Backend Running**: `http://127.0.0.1:8002` (FastAPI)
- **Frontend Running**: `http://localhost:5173` (Vite + React)
- Open `http://localhost:5173` in your web browser.

---

## Step-by-Step Demonstration Flow

### Step 1: Ingestion of Hydrological Data
- **Observation**: At startup or when triggering scenarios, physical river gauge levels, 24-hour rainfall measurements, and rise rates enter the system via the feature pipeline.
- **Verification**: Navigate to `/data-sources`. Verify the transparent lineage catalog for IMD precipitation, CWC river gauge data, and SRTM digital elevation.

---

### Step 2: Flood Risk Calculation & Synthesis
- **Action**: Navigate to **Flood Risk Engine** (`/risk-analysis`).
- **Observation**: The 120-tree Random Forest classifier evaluates all 7 Bihar monitoring stations.
- **Verification**: Notice that **Kunauli (Kosi Embankment, Supaul)** is classified as `CRITICAL` risk (`99.5%`), while **Barauli (Gandak, Gopalganj)** is `LOW` risk (`18%`).

---

### Step 3: Command Center Identifies the Critical Hotspot
- **Action**: Navigate to **Command Center** (`/dashboard`).
- **Observation**: The top of the screen answers the 5 core questions immediately:
  1. **WHERE is the situation getting worse?** -> `Kunauli (Kosi Embankment)` (District: Supaul, Surge: `+0.65m / 3h`).
  2. **HOW severe is it?** -> `4 Zones` at Risk, ~109,500 people potentially exposed statewide.
  3. **WHY is that location high priority?** -> River level exceeds danger mark (+1.2m), rapid water surge, NH-27 cut off, local shelter deficit.
  4. **WHAT resources are needed?** -> 314 Rescue Boats required for ~12,500 target evacuees.
  5. **WHERE is there a resource shortage?** -> 308 Boat Gap in Supaul District.

---

### Step 4: Click the Location to Inspect "Why Is This Area At Risk?"
- **Action**: In the dashboard triage table, find **Kunauli** (Rank #1) and click **"Why At Risk?"**.
- **Verification**: The explainability modal opens and displays:
  - **Risk Score**: `CRITICAL (99.5%)`
  - **Underlying Raw Telemetry**: River level `53.2m` (Danger: `52.0m`), Rise rate `+0.65m / 3h`, Rainfall `165mm / 24h`, Ground elevation `52m ASL`.
  - **Explainable Factors**: Ranked list of 5 primary contributing factors with normalized weights.
  - **Population Exposure**: `Total population: 42,000` × `Predicted exposure: 99.5%` = `~41,790 exposed` with the prominent **`MODEL ESTIMATE`** badge and methodology note.
  - **Grounded Action Recommendations**: Immediate boat deployment and shelter diversion advice.

---

### Step 5: Verify Shelter & Accessibility Status for the Hotspot
- **Action**: In the modal, observe that local active shelters (Kunauli Adarsh School, Nirmali High Ground Center) have only `220` available beds remaining against 3,800+ evacuation demand.
- **Action**: Notice the accessibility indicator flags the main access artery as `BLOCKED`.

---

### Step 6: Emergency Priority Engine Derives Multi-Factor Score
- **Action**: Navigate to **Priority Ranking** (`/priority`).
- **Observation**: Kunauli is ranked `#1` with Priority Score `97.0 / 100`.
- **Verification**: Inspect the panel on the right:
  - **Explanation**: Reads *"Ranked #1 (CRITICAL PRIORITY) due to combined convergence of: Critical flood risk, High population exposure, Key road route confirmed BLOCKED..."*
  - Review the exact factor contributions: `Flood Risk (+29.8 pts)`, `Population Exposure (+25.0 pts)`, `Road Blockage (+15.0 pts)`, `Shelter Gap (+15.0 pts)`, `River Rise (+15.0 pts)`.

---

### Step 7: Compare REQUIRED Resources vs. AVAILABLE Resources
- **Action**: Navigate to **Resources & Gaps** (`/resources`).
- **Observation**: Select **Kunauli (Supaul)** as the target location.
- **Verification**: Inspect the **Planning Assumptions**:
  - `Boat capacity: 20 persons / boat`
  - `Expected trips: 2 trips / boat`
  - `Required boat capacity: 20 × 2 = 40 people / boat`
  - `Evacuation Target: 41,790 × 30% = 12,537 evacuees`
  - `Planning Estimate Required: ceil(12,537 / 40) = 314 boats`
  - `Available Boats: 6`
  - `Calculated Shortage: 308 boats`

---

### Step 8: Identify Resource Shortages & Adjust Assumptions
- **Action**: Drag the **Boat Capacity** slider to `25 persons` and **Expected Trips** to `3 trips` (capacity becomes `75 people / boat`).
- **Observation**: The table instantly recalculates: Required boats drops to `168 boats`, and shortage recalculates to `162 boats`.
- **Verification**: Notice the explicit **"PLANNING ESTIMATE ONLY"** disclaimer confirming decision-support status.

---

### Step 9: Action Recommendations
- **Action**: Review the generated recommendations:
  - Mobilize 6 available SDRF boats immediately to Kunauli Embankment.
  - Trigger mutual-aid request to state strategic reserve (NDRF 9th Bn Bihta) for boat reinforcement.
  - Pre-position chlorine tablets, ORS, and snake-venom antiserum.

---

### Step 10: Official Updates (Road Status, Resources, Shelter Occupancy)

#### A. Update Road Status
- **Action**: Navigate to **Road Accessibility** (`/roads`).
- **Action**: Click **"Submit Field Road Report"**. Select `Hayaghat (Darbhanga)`, enter Road Name: `SH-50 Bridge Link`, Route Segment: `Km 14`, Status: `BLOCKED`, Notes: `Water 3ft deep across carriageway`. Click **"Submit Report"**.

#### B. Update Resource Inventory
- **Action**: Navigate to **Resources & Gaps** (`/resources`).
- **Action**: Find `SDRF 4th Coy Post Supaul - Rescue boats`. Click **"Edit"**.
- **Action**: Update Available Quantity to `12`, Deployed to `6`, Status: `OPERATIONAL`. Enter dispatch note: `Requisitioned 6 boats for Ward 3 evacuation`. Click **"Commit Update & Log Audit"**.

#### C. Update Shelter Occupancy
- **Action**: Navigate to **Shelter Ops** (`/shelters`).
- **Action**: Find `Kunauli Adarsh Middle School Flood Shelter`. Click **"Edit"**.
- **Action**: Set Current Occupancy to `1500` (100% full). Enter note: `Admitted final evacuee wave`. Click **"Commit Update & Log Audit"**.

---

### Step 11: Priority Ranking Updates Dynamically
- **Action**: Navigate back to **Priority Ranking** (`/priority`).
- **Observation**: Observe how Hayaghat (Darbhanga) priority score increased due to the newly confirmed road blockage penalty.

---

### Step 12: Audit Log Records the Change
- **Action**: Navigate to **Audit Trail** (`/audit-log`).
- **Observation**: Review the chronological entries:
  - Identifies **Who** made the change (e.g. `dm_supaul (DISTRICT_OFFICIAL)`).
  - Identifies **What** entity was changed (`Resource: Rescue boats`, `RoadStatus: SH-50`, `Shelter: Kunauli Middle School`).
  - Records **Previous Value** vs. **New Value** (e.g. `Avail: 6 -> Avail: 12`).
  - Records the exact UTC **Timestamp** and justification notes.

---

## Interactive Scenario Simulator
At any point during the demonstration:
1. Click **"Scenario Simulator"** in the top navigation bar.
2. Click **"Activate Kosi Surge Scenario"**.
3. Observe the entire system cascade: Kosi water level rises to `54.1m` (+2.1m above danger mark), risk increases to `99.5%`, priority score surges to `97.0`, and a critical surge alert triggers.
4. Click **"Restore Baseline Demo State"** to return all telemetry to baseline conditions.
