# AI Methodology & Model Explainability: JalRakshak Bihar

## 1. Machine Learning Objective
The machine learning objective of JalRakshak Bihar is to compute the probability of imminent inundation for a given Bihar river settlement based on physical sensor telemetry and geospatial characteristics, while generating transparent, human-auditable explanations for emergency coordinators.

---

## 2. Model Selection Rationale: Interpretable Ensemble vs. Black Box
During flood crises involving human life safety, black-box deep neural networks (e.g. multi-layer perceptrons, unconstrained recurrent networks) introduce severe operational risks:
1. **Unverifiable Confidence**: Deep models frequently produce hallucinated certainty on out-of-distribution extremes.
2. **Lack of Physics Attribution**: Government disaster managers cannot defend evacuation orders based on opaque latent embeddings.

**Selected Architecture**: `RandomForestClassifier` (120 Estimators, max depth 8, min samples leaf 4).
- **Interpretability**: Ensemble of decision trees provides exact tree split logic and reliable feature contributions.
- **Robustness**: Resistant to sensor noise, missing telemetry, and collinearity between gauge stage and rainfall.
- **Fast Execution**: Sub-millisecond inference time enables instant live recalculation during scenario simulations.

---

## 3. Feature Engineering Pipeline

The raw inputs are transformed into 11 domain-calibrated features reflecting North Bihar flood hydraulics:

| Feature Name | Description | Hydraulic Significance |
|---|---|---|
| `rainfall_24h_mm` | 24-hour catchment precipitation | Overwhelms local natural gravity drainage |
| `river_level_m` | Observed gauge water level | Hydrostatic head against earthen embankments |
| `danger_mark_m` | Statutory official Danger Level | Benchmark threshold defined by Central Water Commission |
| `river_rise_rate_3h_m` | 3-hour gauge differential | Wave velocity; identifies rapid upstream flash surges |
| `elevation_m` | Meters above sea level | Low elevation creates natural bowls (*chaurs*) prone to prolonged pooling |
| `distance_to_river_km` | Euclidean distance to channel | Proximity to breach scouring and turbulent overtopping |
| `soil_saturation_pct` | Antecedent soil moisture | High saturation limits infiltration, converting rainfall into immediate runoff |
| `historical_flood_index`| BSDMA historical flood index | Frequency of past inundation over the prior 20 monsoon seasons |
| `gauge_to_danger_ratio`| `river_level / danger_mark` | Dimensionless index (>1.0 indicates flood status) |
| `flood_head_pressure` | `(max(0, rise_rate) * 1.5) / distance` | Dynamic surge pressure per unit distance to settlement |
| `runoff_accumulation_index`| Composite runoff accumulation | `(rain/100) * (soil_sat/100) * elevation_factor` |

---

## 4. Training & Validation Pipeline

The model is trained on a synthetic dataset of 2,000 calibrated Bihar hydrological observations modeled after historical monsoon floods across the Kosi, Bagmati, Gandak, and Ganga basins.
- **Split**: 75% Training (1,500 samples), 25% Testing (500 samples), stratified by flood event outcome.
- **Hyperparameters**:
  - `n_estimators`: 120
  - `max_depth`: 8
  - `min_samples_split`: 6
  - `min_samples_leaf`: 4
  - `random_state`: 42

### Evaluation Metrics on Held-Out Test Set:
- **Accuracy**: `0.948` (94.8%)
- **Precision**: `0.9482` (94.8%)
- **Recall**: `0.9902` (99.0%)
- **F1-Score**: `0.9688` (96.9%)
- **ROC-AUC**: `0.9893`

> **Responsible AI Notice**:  
> *"Model performance on synthetic/demo data does not represent real-world deployment performance. Calibrated for demonstration of decision-support and interpretability pipelines."*

### Feature Importance Breakdown:
```json
{
  "runoff_accumulation_index": 0.2773,
  "flood_head_pressure": 0.1699,
  "river_rise_rate_3h_m": 0.1314,
  "distance_to_river_km": 0.1311,
  "rainfall_24h_mm": 0.1201,
  "elevation_m": 0.0693,
  "historical_flood_index": 0.0447,
  "soil_saturation_pct": 0.0191,
  "river_level_m": 0.0169,
  "gauge_to_danger_ratio": 0.0167,
  "danger_mark_m": 0.0035
}
```

---

## 5. Explainability & "Why Is This Area At Risk?" Formulation
For any selected location, the system extracts feature contributions by comparing current readings against safe baseline thresholds:

1. **Gauge vs Danger Level**: Computes $(H - H_{\text{danger}})$. If $>0$, flags *"River Level Exceeds Danger Mark"* and assigns primary contribution weight.
2. **Surge Velocity (Rise Rate)**: If $>0.5\text{ m}/3\text{h}$, flags *"Rapid River Rise Rate"* indicating flash flood propagation.
3. **Monsoon Precipitation**: If $>120\text{ mm}/24\text{h}$, flags *"Intense Monsoon Precipitation"*.
4. **Elevation Inundation Vulnerability**: Low elevation ($\le 42\text{m}$) flags *"Low Elevation Depression"* explaining why water cannot drain.
5. **Historical Channel Proximity**: Distance $\le 2\text{km}$ flags *"High Historical Exposure & River Proximity"*.

---

## 6. Population Exposure Estimation Methodology
To prevent misleading claims such as *"8,200 people are at risk"*, the platform calculates:

$$\text{Estimated Exposed Population} = \text{Census Population} \times \left(\frac{\text{Predicted Flood Exposure Probability}}{100}\right)$$

- Total Population: `42,000`
- Predicted Inundation Exposure: `99.5%`
- Potentially Exposed Population: `~41,790 residents`
- Explicit label: **`MODEL ESTIMATE`**
- Methodology documentation: Reflects statistical probability of flood extent overlap with residential settlement boundaries. Not an absolute count of casualties or inundated households.
