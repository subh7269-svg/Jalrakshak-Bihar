import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone

# Ensure backend root is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from app.ml.feature_pipeline import FEATURE_NAMES
except ImportError:
    from feature_pipeline import FEATURE_NAMES
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

def generate_bihar_synthetic_dataset(n_samples: int = 1500, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates realistic synthetic hydrological data calibrated to Bihar river plains.
    Attributes modeled after monsoon flash floods, upstream barrage discharges, and embankment stresses.
    """
    np.random.seed(random_seed)

    # 1. Base hydrological parameters
    rainfall = np.random.exponential(scale=65.0, size=n_samples) + np.random.uniform(0, 120, size=n_samples)
    rainfall = np.clip(rainfall, 0.0, 320.0)  # mm/24h

    danger_mark = np.random.choice([48.5, 52.0, 71.5, 34.0, 42.8], size=n_samples)
    
    # River level variation around danger mark (-3m to +2.5m)
    river_level_offset = np.random.normal(loc=-0.5, scale=1.4, size=n_samples)
    river_level = danger_mark + river_level_offset

    # River rise rate: -0.3m/3h to +1.2m/3h
    river_rise_rate = np.random.normal(loc=0.15, scale=0.35, size=n_samples)
    river_rise_rate = np.clip(river_rise_rate, -0.6, 1.8)

    # Elevation: North Bihar plains range 32m to 68m
    elevation = np.random.uniform(32.0, 68.0, size=n_samples)

    # Distance to major river (km): 0.2km to 15km
    distance_to_river = np.random.exponential(scale=3.5, size=n_samples) + 0.2
    distance_to_river = np.clip(distance_to_river, 0.2, 18.0)

    # Soil saturation (pct): 40% to 98%
    soil_saturation = np.random.uniform(45.0, 96.0, size=n_samples)

    # Historical flood vulnerability index: 0.15 to 0.95
    hist_index = np.random.beta(a=2.0, b=2.0, size=n_samples)

    # Derived physics indicators
    gauge_to_danger = river_level / danger_mark
    flood_head_pressure = (np.maximum(0.0, river_rise_rate) * 1.5) / distance_to_river
    elevation_factor = np.maximum(1.0, (70.0 - np.minimum(65.0, elevation)) / 10.0)
    runoff_acc = (rainfall / 100.0) * (soil_saturation / 100.0) * elevation_factor

    # Deterministic ground truth probability proxy based on flood physics
    log_odds = (
        (gauge_to_danger - 0.98) * 6.5 +
        (river_rise_rate - 0.20) * 3.8 +
        (rainfall / 120.0) * 2.5 +
        (hist_index - 0.5) * 2.2 +
        flood_head_pressure * 1.8 +
        runoff_acc * 1.2 -
        (elevation - 40.0) * 0.08 -
        (distance_to_river - 2.0) * 0.35
    )
    # Add minor physical stochasticity
    prob = 1.0 / (1.0 + np.exp(-log_odds + np.random.normal(0, 0.25, size=n_samples)))
    target = (prob >= 0.50).astype(int)

    df = pd.DataFrame({
        "rainfall_24h_mm": rainfall,
        "river_level_m": river_level,
        "danger_mark_m": danger_mark,
        "river_rise_rate_3h_m": river_rise_rate,
        "elevation_m": elevation,
        "distance_to_river_km": distance_to_river,
        "soil_saturation_pct": soil_saturation,
        "historical_flood_index": hist_index,
        "gauge_to_danger_ratio": gauge_to_danger,
        "flood_head_pressure": flood_head_pressure,
        "runoff_accumulation_index": runoff_acc,
        "flood_event": target
    })

    return df

def train_and_save_model(output_dir: str = None) -> dict:
    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(__file__))

    os.makedirs(output_dir, exist_ok=True)

    df = generate_bihar_synthetic_dataset(n_samples=2000, random_seed=42)
    X = df[FEATURE_NAMES]
    y = df["flood_event"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    model = RandomForestClassifier(
        n_estimators=120,
        max_depth=8,
        min_samples_split=6,
        min_samples_leaf=4,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    roc_auc = float(roc_auc_score(y_test, y_prob))

    # Feature importances
    feature_importances = {
        feat: round(float(imp), 4)
        for feat, imp in zip(FEATURE_NAMES, model.feature_importances_)
    }

    metrics = {
        "model_architecture": "RandomForestClassifier",
        "n_estimators": 120,
        "max_depth": 8,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "feature_importances": feature_importances,
        "data_notice": (
            "Model performance on synthetic/demo data does not represent real-world deployment performance. "
            "Calibrated for demonstration of decision-support and interpretability pipelines."
        )
    }

    model_path = os.path.join(output_dir, "flood_risk_model.joblib")
    metrics_path = os.path.join(output_dir, "model_metrics.json")

    joblib.dump(model, model_path)
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    return metrics

if __name__ == "__main__":
    metrics = train_and_save_model()
    print("Model trained successfully!")
    print(json.dumps(metrics, indent=2))
