import numpy as np
import pandas as pd
from typing import Dict, Any, List

FEATURE_NAMES = [
    "rainfall_24h_mm",
    "river_level_m",
    "danger_mark_m",
    "river_rise_rate_3h_m",
    "elevation_m",
    "distance_to_river_km",
    "soil_saturation_pct",
    "historical_flood_index",
    # Engineered features
    "gauge_to_danger_ratio",
    "flood_head_pressure",
    "runoff_accumulation_index"
]

def engineer_features(data: Dict[str, float]) -> pd.DataFrame:
    """
    Transforms raw hydrological and GIS parameters into engineered features
    aligned with Bihar river basin dynamics (Kosi, Bagmati, Gandak, Ganga).
    """
    rainfall = float(data.get("rainfall_24h_mm", 0.0))
    river_level = float(data.get("river_level_m", 0.0))
    danger_mark = float(data.get("danger_mark_m", 50.0))
    rise_rate = float(data.get("river_rise_rate_3h_m", 0.0))
    elevation = float(data.get("elevation_m", 45.0))
    dist_river = max(0.1, float(data.get("distance_to_river_km", 2.0)))
    soil_sat = float(data.get("soil_saturation_pct", 60.0))
    hist_index = float(data.get("historical_flood_index", 0.5))

    # 1. Gauge to danger ratio (> 1.0 means river is flowing above danger level)
    gauge_to_danger = river_level / danger_mark if danger_mark > 0 else 1.0

    # 2. Flood head pressure: composite of river rise rate and proximity
    flood_head_pressure = (max(0.0, rise_rate) * 1.5) / dist_river

    # 3. Runoff accumulation index: heavy rainfall on saturated soil in low elevation bowl
    # Lower elevation in North Bihar (30-55m) creates drainage congestion
    elevation_factor = max(1.0, (70.0 - min(65.0, elevation)) / 10.0)
    runoff_acc = (rainfall / 100.0) * (soil_sat / 100.0) * elevation_factor

    row = {
        "rainfall_24h_mm": rainfall,
        "river_level_m": river_level,
        "danger_mark_m": danger_mark,
        "river_rise_rate_3h_m": rise_rate,
        "elevation_m": elevation,
        "distance_to_river_km": dist_river,
        "soil_saturation_pct": soil_sat,
        "historical_flood_index": hist_index,
        "gauge_to_danger_ratio": gauge_to_danger,
        "flood_head_pressure": flood_head_pressure,
        "runoff_accumulation_index": runoff_acc
    }

    return pd.DataFrame([row])
