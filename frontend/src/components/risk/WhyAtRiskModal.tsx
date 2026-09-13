import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { WhyAtRiskData, LocationRecommendationResponse } from '../../types';
import { 
  X, 
  BrainCircuit, 
  Gauge, 
  CloudRain, 
  TrendingUp, 
  Mountain, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface WhyAtRiskModalProps {
  locationId: number | null;
  onClose: () => void;
  onViewResources?: (locationId: number) => void;
}

export const WhyAtRiskModal: React.FC<WhyAtRiskModalProps> = ({ locationId, onClose, onViewResources }) => {
  const [data, setData] = useState<WhyAtRiskData | null>(null);
  const [recs, setRecs] = useState<LocationRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getWhyAtRisk(locationId),
      api.getRecommendation(locationId)
    ])
      .then(([whyRes, recRes]) => {
        setData(whyRes);
        setRecs(recRes);
      })
      .catch((err) => {
        console.error('Failed to load why-at-risk data:', err);
        setError(err.message || 'Unable to load risk breakdown');
      })
      .finally(() => setLoading(false));
  }, [locationId]);

  if (!locationId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BrainCircuit size={22} color="#3b82f6" />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {data ? `${data.location_name} (${data.district} District)` : 'Risk Explainability Panel'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                <span className="badge badge-demo">SIMULATED DEMONSTRATION DATA</span>
                {data && (
                  <span className={`badge badge-${data.risk_level.toLowerCase()}`}>
                    {data.risk_level} RISK ({data.risk_score_pct}%)
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {loading && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Evaluating ML hydrological pipeline & explainability telemetry...
            </div>
          )}

          {error && (
            <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          {data && !loading && (
            <div>
              {/* Top Banner: Transparent Population Exposure */}
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-accent)',
                borderRadius: '8px',
                padding: '1.15rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} color="#60a5fa" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Population Exposure Analysis
                    </span>
                  </div>
                  <span className="badge badge-demo" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', borderColor: '#3b82f6' }}>
                    MODEL ESTIMATE
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: '1rem', margin: '0.75rem 0' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Settlement Population</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {data.population_exposure.total_population.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Predicted Inundation Exposure</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f87171' }}>
                      {data.population_exposure.predicted_exposure_pct}%
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #3b82f6' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Potentially Exposed Estimate</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                      ~{data.population_exposure.estimated_exposed_population.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  Methodology: {data.population_exposure.calculation_formula}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  {data.population_exposure.methodology_note}
                </div>
              </div>

              {/* Section 2: Actual Raw Hydrological Inputs */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Gauge size={16} color="#06b6d4" />
                  Actual Physical & Sensor Inputs (Observed Telemetry)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>River Level / Danger Mark</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {data.raw_inputs.river_level_m.toFixed(1)} m{' '}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        (DL {data.raw_inputs.danger_mark_m.toFixed(1)} m)
                      </span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>River Rise Rate (Surge)</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: data.raw_inputs.river_rise_rate_3h_m > 0.3 ? '#f87171' : 'var(--text-main)' }}>
                      {data.raw_inputs.river_rise_rate_3h_m > 0 ? `+${data.raw_inputs.river_rise_rate_3h_m.toFixed(2)}` : data.raw_inputs.river_rise_rate_3h_m.toFixed(2)} m / 3h
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Precipitation (24h)</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {data.raw_inputs.rainfall_24h_mm.toFixed(1)} mm
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ground Elevation</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {data.raw_inputs.elevation_m.toFixed(1)} m ASL
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Distance to Channel</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {data.raw_inputs.distance_to_river_km.toFixed(1)} km
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Soil Saturation</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {data.raw_inputs.soil_saturation_pct.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: "Why is this area at risk?" Contributing Factors */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp size={16} color="#f59e0b" />
                  Why is this area at risk? (Key Model Contributing Factors)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.factors.map((f, i) => (
                    <div key={i} style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: f.impact.includes('CRITICAL') ? '#ef4444' : f.impact.includes('HIGH') ? '#f97316' : '#10b981',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {f.factor_name}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '1.75rem' }}>
                          {f.description}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '120px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                          {f.feature_value}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          Weight: {f.weight_pct}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Grounded Recommendations */}
              {recs && recs.planning_recommendations.length > 0 && (
                <div style={{
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <Lightbulb size={18} color="#60a5fa" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Evidence-Grounded Planning Recommendations
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {recs.planning_recommendations.map((r, idx) => (
                      <div key={idx} style={{
                        background: 'var(--bg-card)',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        borderLeft: `3px solid ${r.urgency === 'IMMEDIATE' ? '#ef4444' : r.urgency === 'HIGH' ? '#f97316' : '#3b82f6'}`
                      }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.action}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Rationale: {r.rationale}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Disclaimer */}
              <div className="decision-support-box">
                <div style={{ fontWeight: 600, marginBottom: '0.2rem', color: '#93c5fd' }}>
                  Official Decision Support Notice
                </div>
                {data.disclaimer} Final operational decisions remain with authorized disaster-management personnel.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {onViewResources && data && (
            <button 
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onViewResources(data.location_id);
              }}
            >
              Check Resource Gaps for this Location
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
