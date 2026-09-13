import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LocationItem, WhyAtRiskData } from '../types';
import { 
  BrainCircuit, 
  RotateCcw, 
  Eye, 
  TrendingUp, 
  Gauge, 
  Mountain, 
  CloudRain, 
  Users, 
  CheckCircle2, 
  ShieldAlert,
  Radio,
  SlidersHorizontal
} from 'lucide-react';

export const RiskAnalysisPage: React.FC = () => {
  const { selectedDistrict } = useAuth();
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selectedLocId, setSelectedLocId] = useState<number | null>(null);
  const [whyData, setWhyData] = useState<WhyAtRiskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcNotice, setRecalcNotice] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      const res = await api.getLocations(selectedDistrict);
      setLocations(res || []);
      if (res && res.length > 0 && !selectedLocId) {
        setSelectedLocId(res[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [selectedDistrict]);

  useEffect(() => {
    if (!selectedLocId) return;
    setLoading(true);
    api.getWhyAtRisk(selectedLocId)
      .then(res => setWhyData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedLocId]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setRecalcNotice(null);
    try {
      const res = await api.recalculateRisk();
      setRecalcNotice(res.message || 'Risk assessments re-evaluated by RandomForest engine.');
      await fetchLocations();
      if (selectedLocId) {
        const updatedWhy = await api.getWhyAtRisk(selectedLocId);
        setWhyData(updatedWhy);
      }
    } catch (err: any) {
      setRecalcNotice(`Error: ${err.message}`);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="content-body">
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BrainCircuit size={22} color="#3b82f6" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Explainable AI Flood Risk Engine
            </h2>
            <span className="badge badge-demo">RANDOM FOREST 120 TREES</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Transparent hydrological feature attribution, physics-grounded inputs, and demographic vulnerability models.
          </p>
        </div>

        <button 
          className="btn btn-secondary btn-sm"
          disabled={recalculating}
          onClick={handleRecalculate}
          title="Run full ML feature pipeline & re-evaluate probabilities"
        >
          <RotateCcw size={14} className={recalculating ? 'spin' : ''} />
          <span>{recalculating ? 'Running Inference...' : 'Re-Run ML Inference'}</span>
        </button>
      </div>

      {recalcNotice && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid #3b82f6',
          borderRadius: '6px',
          padding: '0.65rem 1rem',
          fontSize: '0.82rem',
          color: '#93c5fd',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} color="#60a5fa" />
          <span>{recalcNotice}</span>
        </div>
      )}

      {/* Main Grid: Location Selector List & Why-At-Risk Deep Dive */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.65fr', gap: '1.25rem' }}>
        {/* Left: Location Ranking & Risk Probability List */}
        <div className="card-panel" style={{ margin: 0 }}>
          <div className="card-header">
            <div className="card-title" style={{ fontSize: '0.92rem' }}>
              <span>Bihar Monitoring Stations ({locations.length})</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Select to inspect</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '680px', overflowY: 'auto' }}>
            {locations.map((loc) => {
              const riskPct = loc.risk_assessment?.risk_score_pct || 0;
              const riskLvl = loc.risk_assessment?.risk_level || 'LOW';
              const isSelected = loc.id === selectedLocId;

              return (
                <div 
                  key={loc.id}
                  onClick={() => setSelectedLocId(loc.id)}
                  style={{
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-elevated)',
                    border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                    borderRadius: '6px',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    borderLeft: `4px solid ${riskLvl === 'CRITICAL' ? '#ef4444' : riskLvl === 'HIGH' ? '#f97316' : riskLvl === 'MODERATE' ? '#eab308' : '#10b981'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {loc.name}
                    </span>
                    <span className={`badge badge-${riskLvl.toLowerCase()}`}>
                      {riskPct.toFixed(1)}% {riskLvl}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {loc.district} District • {loc.river_basin} • {loc.elevation_m}m ASL
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    Pop: {loc.population.toLocaleString()} • Gauge: {loc.hydrology?.river_level_m}m (DL {loc.hydrology?.danger_mark_m}m)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: "Why is this area at risk?" Inspector Panel */}
        <div className="card-panel" style={{ margin: 0 }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading model explainability telemetry...
            </div>
          ) : whyData ? (
            <div>
              {/* Location Title & Risk Classification */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {whyData.location_name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    District: <strong>{whyData.district}</strong> • Model: {whyData.model_name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-${whyData.risk_level.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                    {whyData.risk_level} RISK: {whyData.risk_score_pct}%
                  </span>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                    CALCULATED ML PREDICTION
                  </div>
                </div>
              </div>

              {/* Transparent Population Exposure Box */}
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-accent)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={16} color="#60a5fa" />
                    Population Exposure Breakdown
                  </span>
                  <span className="badge badge-demo">MODEL ESTIMATE</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Census Base Pop</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {whyData.population_exposure.total_population.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Exposure Prob.</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f87171' }}>
                      {whyData.population_exposure.predicted_exposure_pct}%
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '0.6rem 0.8rem', borderRadius: '6px', borderLeft: '3px solid #3b82f6' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Potentially Exposed</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                      ~{whyData.population_exposure.estimated_exposed_population.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  Formula: {whyData.population_exposure.calculation_formula}
                </div>
              </div>

              {/* Observed Telemetry Table */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Gauge size={15} color="#06b6d4" />
                  Actual Physical Telemetry (Raw Sensor Readings)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.55rem 0.75rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>River Level</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {whyData.raw_inputs.river_level_m.toFixed(1)} m
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Danger: {whyData.raw_inputs.danger_mark_m.toFixed(1)}m</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.55rem 0.75rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>3h Rise Rate</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: whyData.raw_inputs.river_rise_rate_3h_m > 0.3 ? '#f87171' : 'var(--text-main)' }}>
                      +{whyData.raw_inputs.river_rise_rate_3h_m.toFixed(2)} m
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Surge velocity</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.55rem 0.75rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>24h Rainfall</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {whyData.raw_inputs.rainfall_24h_mm.toFixed(1)} mm
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Precipitation</div>
                  </div>
                </div>
              </div>

              {/* Explanatory Contributing Factors */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp size={15} color="#eab308" />
                  Why is this area at risk? (Model Contributing Factors)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {whyData.factors.map((f, i) => (
                    <div key={i} style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                          {i + 1}. {f.factor_name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {f.description}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '100px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                          {f.feature_value}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          Weight: {f.weight_pct}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision Support Disclaimer */}
              <div className="decision-support-box" style={{ marginTop: '0.75rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.2rem', color: '#93c5fd' }}>
                  Responsible AI Decision Support Notice
                </div>
                {whyData.disclaimer}
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a location on the left to inspect explainable risk telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
