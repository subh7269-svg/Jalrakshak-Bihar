import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple

# Ensure backend root is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from app.ml.feature_pipeline import engineer_features, FEATURE_NAMES
except ImportError:
    from feature_pipeline import engineer_features, FEATURE_NAMES

class FloodRiskInferenceEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FloodRiskInferenceEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        ml_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(ml_dir, "flood_risk_model.joblib")
        self.metrics_path = os.path.join(ml_dir, "model_metrics.json")
        self.model = None
        self.metrics = {}

        self._load_or_train()
        self._initialized = True

    def _load_or_train(self):
        if not os.path.exists(self.model_path):
            from app.ml.train_model import train_and_save_model
            self.metrics = train_and_save_model()
            self.model = joblib.load(self.model_path)
        else:
            self.model = joblib.load(self.model_path)
            if os.path.exists(self.metrics_path):
                with open(self.metrics_path, "r") as f:
                    self.metrics = json.load(f)

    def predict(self, raw_data: Dict[str, float]) -> Dict[str, Any]:
        """
        Runs inference and derives explainability metrics for a given location's parameters.
        """
        df_feat = engineer_features(raw_data)
        X = df_feat[FEATURE_NAMES]

        # Predict probability
        prob = float(self.model.predict_proba(X)[0, 1])
        prob_pct = round(prob * 100.0, 1)

        # Categorize
        if prob_pct >= 80.0:
            category = "CRITICAL"
        elif prob_pct >= 60.0:
            category = "HIGH"
        elif prob_pct >= 30.0:
            category = "MODERATE"
        else:
            category = "LOW"

        # Calculate feature contributions
        contributions = self._compute_feature_contributions(raw_data, df_feat.iloc[0])

        return {
            "risk_score_pct": prob_pct,
            "risk_level": category,
            "predicted_exposure_pct": prob_pct,
            "contributing_factors": contributions,
            "calculation_method": "RandomForestClassifier (120 Estimators, Bihar Hydrological Pipeline)",
            "is_simulated": True
        }

    def _compute_feature_contributions(self, raw: Dict[str, float], engineered: pd.Series) -> List[Dict[str, Any]]:
        """
        Honest feature contribution calculation comparing current readings
        against safe baseline thresholds for Bihar river plains.
        """
        factors = []
        importances = self.metrics.get("feature_importances", {})

        river_level = float(raw.get("river_level_m", 0.0))
        danger_mark = float(raw.get("danger_mark_m", 50.0))
        rise_rate = float(raw.get("river_rise_rate_3h_m", 0.0))
        rainfall = float(raw.get("rainfall_24h_mm", 0.0))
        elevation = float(raw.get("elevation_m", 45.0))
        distance = float(raw.get("distance_to_river_km", 2.0))
        hist_index = float(raw.get("historical_flood_index", 0.5))

        # Factor 1: River Level vs Danger Mark
        gauge_ratio = river_level / danger_mark if danger_mark > 0 else 1.0
        if gauge_ratio >= 1.05:
            factors.append({
                "factor_name": "River Level Exceeds Danger Mark",
                "impact": "CRITICAL_INCREASE",
                "weight_pct": 32.0,
                "description": f"River gauge is flowing at {river_level:.1f}m, which is {(river_level - danger_mark):+.2f}m above the official Danger Level ({danger_mark:.1f}m).",
                "feature_value": f"{river_level:.1f} m (Danger: {danger_mark:.1f} m)"
            })
        elif gauge_ratio >= 0.95:
            factors.append({
                "factor_name": "River Level Nearing Danger Mark",
                "impact": "HIGH_INCREASE",
                "weight_pct": 24.0,
                "description": f"River gauge is at {river_level:.1f}m, approaching the critical warning threshold ({danger_mark:.1f}m).",
                "feature_value": f"{river_level:.1f} m"
            })
        else:
            factors.append({
                "factor_name": "River Level Within Safe Buffer",
                "impact": "BUFFER",
                "weight_pct": 10.0,
                "description": f"River gauge is currently {danger_mark - river_level:.1f}m below the danger mark.",
                "feature_value": f"{river_level:.1f} m"
            })

        # Factor 2: River Rise Rate (Hydraulic surge)
        if rise_rate >= 0.5:
            factors.append({
                "factor_name": "Rapid River Rise Rate",
                "impact": "HIGH_INCREASE",
                "weight_pct": 26.0,
                "description": f"Upstream inflow is surging at +{rise_rate:.2f}m per 3 hours, indicating rapid wave propagation.",
                "feature_value": f"+{rise_rate:.2f} m / 3 hrs"
            })
        elif rise_rate > 0.1:
            factors.append({
                "factor_name": "Steady Water Level Increase",
                "impact": "MODERATE_INCREASE",
                "weight_pct": 15.0,
                "description": f"Water level is rising at +{rise_rate:.2f}m per 3 hours.",
                "feature_value": f"+{rise_rate:.2f} m / 3 hrs"
            })
        else:
            factors.append({
                "factor_name": "Stable / Receding River Velocity",
                "impact": "BUFFER",
                "weight_pct": 8.0,
                "description": f"Water level velocity is stable or receding ({rise_rate:+.2f}m / 3 hrs).",
                "feature_value": f"{rise_rate:+.2f} m / 3 hrs"
            })

        # Factor 3: 24h Rainfall Intensity
        if rainfall >= 120.0:
            factors.append({
                "factor_name": "Intense Monsoon Precipitation",
                "impact": "HIGH_INCREASE",
                "weight_pct": 20.0,
                "description": f"Heavy catchment rainfall recorded ({rainfall:.1f} mm in 24 hrs), overwhelming local natural drainage.",
                "feature_value": f"{rainfall:.1f} mm / 24 hrs"
            })
        elif rainfall >= 50.0:
            factors.append({
                "factor_name": "Elevated Catchment Rainfall",
                "impact": "MODERATE_INCREASE",
                "weight_pct": 14.0,
                "description": f"Moderate to heavy precipitation ({rainfall:.1f} mm in 24 hrs) causing waterlogging.",
                "feature_value": f"{rainfall:.1f} mm / 24 hrs"
            })
        else:
            factors.append({
                "factor_name": "Light or Normal Rainfall",
                "impact": "BUFFER",
                "weight_pct": 5.0,
                "description": f"Rainfall is relatively light ({rainfall:.1f} mm in 24 hrs).",
                "feature_value": f"{rainfall:.1f} mm / 24 hrs"
            })

        # Factor 4: Lowland Elevation Vulnerability
        if elevation <= 42.0:
            factors.append({
                "factor_name": "Low Elevation Depression",
                "impact": "HIGH_INCREASE",
                "weight_pct": 12.0,
                "description": f"Low elevation ({elevation:.1f} m ASL) creates a natural basin prone to prolonged inundation and slow drainage.",
                "feature_value": f"{elevation:.1f} m ASL"
            })
        else:
            factors.append({
                "factor_name": "Slight Natural Elevation Buffer",
                "impact": "BUFFER",
                "weight_pct": 6.0,
                "description": f"Ground elevation ({elevation:.1f} m ASL) provides partial relief from shallow backwaters.",
                "feature_value": f"{elevation:.1f} m ASL"
            })

        # Factor 5: Historical Exposure & River Proximity
        if distance <= 2.0 or hist_index >= 0.7:
            factors.append({
                "factor_name": "High Historical Exposure & River Proximity",
                "impact": "HIGH_INCREASE",
                "weight_pct": 10.0,
                "description": f"Location is {distance:.1f} km from active river channel with historical flood recurrence index {hist_index:.2f}.",
                "feature_value": f"{distance:.1f} km from channel (Index {hist_index:.2f})"
            })

        return factors

risk_engine = FloodRiskInferenceEngine()
