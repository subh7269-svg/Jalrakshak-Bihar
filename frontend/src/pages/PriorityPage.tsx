import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LocationPriorityRank, PriorityWeights } from '../types';
import { 
  ListOrdered, 
  Sliders, 
  HelpCircle, 
  ShieldAlert, 
  AlertTriangle, 
  Compass, 
  Home, 
  TrendingUp, 
  Eye, 
  RotateCcw,
  CheckCircle2,
  Info,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { WhyAtRiskModal } from '../components/risk/WhyAtRiskModal';

export const PriorityPage: React.FC = () => {
  const { selectedDistrict } = useAuth();
  const { showToast, playTacticalSound } = useToast();

  const [ranking, setRanking] = useState<LocationPriorityRank[]>([]);
  const [weights, setWeights] = useState<PriorityWeights>({
    weight_flood_risk: 0.30,
    weight_population_exposure: 0.25,
    weight_road_blockage: 0.15,
    weight_shelter_gap: 0.15,
    weight_river_rise_rate: 0.15,
  });
  const [activePreset, setActivePreset] = useState<string>('balanced');
  const [showWeightsPanel, setShowWeightsPanel] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedLocId, setSelectedLocId] = useState<number | null>(null);
  const [selectedRankForDetail, setSelectedRankForDetail] = useState<LocationPriorityRank | null>(null);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const res = await api.getPriorityRanking(selectedDistrict, weights);
      setRanking(res.ranking || []);
      if (res.ranking && res.ranking.length > 0 && !selectedRankForDetail) {
        setSelectedRankForDetail(res.ranking[0]);
      } else if (res.ranking && selectedRankForDetail) {
        const updated = res.ranking.find(r => r.location_id === selectedRankForDetail.location_id);
        if (updated) setSelectedRankForDetail(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [selectedDistrict, weights]);

  const applyPreset = (name: string, presetWeights: PriorityWeights, label: string) => {
    setActivePreset(name);
    setWeights(presetWeights);
    playTacticalSound('click');
    showToast({
      type: 'info',
      title: `Weight Preset Applied: ${label}`,
      message: 'Priority scores & rank ordering recalculated in real time.',
    });
  };

  const resetWeights = () => {
    applyPreset('balanced', {
      weight_flood_risk: 0.30,
      weight_population_exposure: 0.25,
      weight_road_blockage: 0.15,
      weight_shelter_gap: 0.15,
      weight_river_rise_rate: 0.15,
    }, 'Standard Balanced');
  };

  return (
    <div className="content-body">
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.5rem', borderRadius: '10px', color: '#38bdf8' }}>
              <ListOrdered size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  Emergency Priority Ranking Engine
                </h2>
                <span className="badge badge-demo">MULTI-FACTOR TRIAGE</span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Evidence-based mathematical ranking determining which affected Bihar locations require frontline response first.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setShowWeightsPanel(!showWeightsPanel)}
            style={{ borderColor: showWeightsPanel ? '#38bdf8' : undefined, color: showWeightsPanel ? '#38bdf8' : undefined }}
          >
            <Sliders size={14} />
            <span>{showWeightsPanel ? 'Hide Tuning Console' : 'Open Weight Tuning Console'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Weights Tuning Console with Presets */}
      {showWeightsPanel && (
        <div className="glass-panel" style={{ padding: '1.4rem', marginBottom: '1.75rem', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Strategic Weight Presets:
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`filter-chip ${activePreset === 'balanced' ? 'active' : ''}`}
                onClick={() => applyPreset('balanced', {
                  weight_flood_risk: 0.30,
                  weight_population_exposure: 0.25,
                  weight_road_blockage: 0.15,
                  weight_shelter_gap: 0.15,
                  weight_river_rise_rate: 0.15,
                }, 'Standard Balanced')}
              >
                ⚖️ Standard Balanced
              </button>
              <button
                type="button"
                className={`filter-chip ${activePreset === 'pop' ? 'active' : ''}`}
                onClick={() => applyPreset('pop', {
                  weight_flood_risk: 0.20,
                  weight_population_exposure: 0.45,
                  weight_road_blockage: 0.10,
                  weight_shelter_gap: 0.15,
                  weight_river_rise_rate: 0.10,
                }, 'Population First')}
              >
                👥 High Population Evacuation
              </button>
              <button
                type="button"
                className={`filter-chip ${activePreset === 'road' ? 'active' : ''}`}
                onClick={() => applyPreset('road', {
                  weight_flood_risk: 0.20,
                  weight_population_exposure: 0.15,
                  weight_road_blockage: 0.40,
                  weight_shelter_gap: 0.10,
                  weight_river_rise_rate: 0.15,
                }, 'Access Cutoff')}
              >
                🛑 Isolated / Road Cut Priority
              </button>
              <button
                type="button"
                className={`filter-chip ${activePreset === 'surge' ? 'active' : ''}`}
                onClick={() => applyPreset('surge', {
                  weight_flood_risk: 0.20,
                  weight_population_exposure: 0.15,
                  weight_road_blockage: 0.10,
                  weight_shelter_gap: 0.15,
                  weight_river_rise_rate: 0.40,
                }, 'Rapid Surge')}
              >
                🌊 Rapid Flash Surge Focus
              </button>
              <button className="btn btn-secondary btn-sm" onClick={resetWeights} style={{ padding: '0.35rem 0.65rem' }}>
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          </div>

          {/* Interactive Range Sliders */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Flood Risk Severity</span>
                <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {(weights.weight_flood_risk * 100).toFixed(0)}%
                </span>
              </div>
              <input 
                type="range" min="0.05" max="0.60" step="0.05" 
                value={weights.weight_flood_risk} 
                onChange={(e) => {
                  setActivePreset('custom');
                  setWeights({ ...weights, weight_flood_risk: parseFloat(e.target.value) });
                }}
                className="tactical-slider"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Population Exposure</span>
                <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {(weights.weight_population_exposure * 100).toFixed(0)}%
                </span>
              </div>
              <input 
                type="range" min="0.05" max="0.50" step="0.05" 
                value={weights.weight_population_exposure} 
                onChange={(e) => {
                  setActivePreset('custom');
                  setWeights({ ...weights, weight_population_exposure: parseFloat(e.target.value) });
                }}
                className="tactical-slider"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Road Access Blockage</span>
                <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {(weights.weight_road_blockage * 100).toFixed(0)}%
                </span>
              </div>
              <input 
                type="range" min="0.05" max="0.50" step="0.05" 
                value={weights.weight_road_blockage} 
                onChange={(e) => {
                  setActivePreset('custom');
                  setWeights({ ...weights, weight_road_blockage: parseFloat(e.target.value) });
                }}
                className="tactical-slider"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Shelter Deficit Gap</span>
                <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {(weights.weight_shelter_gap * 100).toFixed(0)}%
                </span>
              </div>
              <input 
                type="range" min="0.05" max="0.40" step="0.05" 
                value={weights.weight_shelter_gap} 
                onChange={(e) => {
                  setActivePreset('custom');
                  setWeights({ ...weights, weight_shelter_gap: parseFloat(e.target.value) });
                }}
                className="tactical-slider"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>River Rise Velocity</span>
                <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {(weights.weight_river_rise_rate * 100).toFixed(0)}%
                </span>
              </div>
              <input 
                type="range" min="0.05" max="0.50" step="0.05" 
                value={weights.weight_river_rise_rate} 
                onChange={(e) => {
                  setActivePreset('custom');
                  setWeights({ ...weights, weight_river_rise_rate: parseFloat(e.target.value) });
                }}
                className="tactical-slider"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Priority Ranking Board & "Why is this location #X?" Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '1.5rem' }}>
        {/* Left: Ranked Table */}
        <div className="glass-panel" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Priority Ordered Sectors ({ranking.length})
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Click any sector to inspect its mathematical contribution
            </span>
          </div>

          <div className="table-container">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Location</th>
                  <th>Priority Score</th>
                  <th>Flood Risk</th>
                  <th>Road</th>
                  <th>Shelter Gap</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row) => {
                  const isSelected = selectedRankForDetail?.location_id === row.location_id;
                  const isTop = row.rank === 1;

                  return (
                    <tr 
                      key={row.location_id}
                      onClick={() => {
                        setSelectedRankForDetail(row);
                        playTacticalSound('click');
                      }}
                      style={{ 
                        cursor: 'pointer', 
                        background: isSelected ? 'rgba(56, 189, 248, 0.12)' : undefined 
                      }}
                    >
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          background: isTop 
                            ? 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)' 
                            : row.rank === 2 
                            ? 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)' 
                            : 'rgba(255, 255, 255, 0.08)',
                          color: 'white',
                          boxShadow: isTop ? '0 0 10px rgba(244, 63, 94, 0.6)' : undefined
                        }}>
                          #{row.rank}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.location_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.district} District</div>
                      </td>
                      <td className="mono-cell" style={{ fontWeight: 800, fontSize: '1rem', color: isTop ? '#f43f5e' : '#38bdf8' }}>
                        {row.priority_score.toFixed(1)}
                      </td>
                      <td>
                        <span className={`badge badge-${row.flood_risk_pct >= 80 ? 'critical' : row.flood_risk_pct >= 60 ? 'high' : 'moderate'}`}>
                          {row.flood_risk_pct.toFixed(0)}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${row.road_accessibility_status.toLowerCase()}`}>
                          {row.road_accessibility_status}
                        </span>
                      </td>
                      <td className="mono-cell">
                        {row.shelter_capacity_gap > 0 ? (
                          <span style={{ color: '#f87171', fontWeight: 700 }}>-{row.shelter_capacity_gap.toLocaleString()}</span>
                        ) : (
                          <span style={{ color: '#34d399' }}>Adequate</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLocId(row.location_id);
                          }}
                          style={{ padding: '0.25rem 0.55rem' }}
                          title="Open full explainability breakdown"
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: "Why is this location #X?" Panel */}
        <div className="glass-panel" style={{ padding: '1.35rem', height: 'fit-content' }}>
          {selectedRankForDetail ? (
            <div>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                <span className={`badge badge-${selectedRankForDetail.priority_category.toLowerCase()}`} style={{ marginBottom: '0.4rem' }}>
                  RANK #{selectedRankForDetail.rank} • {selectedRankForDetail.priority_category} PRIORITY
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  {selectedRankForDetail.location_name}
                </h3>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {selectedRankForDetail.district} District • Multi-Factor Priority Score: <strong style={{ color: '#38bdf8' }}>{selectedRankForDetail.priority_score.toFixed(1)} / 100</strong>
                </div>
              </div>

              {/* Justification Box */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '0.9rem 1.1rem',
                marginBottom: '1.2rem',
                borderLeft: `4px solid ${selectedRankForDetail.rank === 1 ? '#f43f5e' : '#38bdf8'}`
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {selectedRankForDetail.rank === 1 ? 'Why is this location ranked #1?' : `Why is this location ranked #${selectedRankForDetail.rank}?`}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                  {selectedRankForDetail.why_ranked_here}
                </p>
              </div>

              {/* Mathematical Factor Contributions with Animated Meters */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.65rem' }}>
                  Transparent Factor Contribution Breakdown:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {selectedRankForDetail.factor_breakdown.map((f, i) => {
                    const maxScore = 40;
                    const pct = Math.min(100, Math.round((f.contribution / maxScore) * 100));

                    return (
                      <div key={i} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0.7rem 0.9rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.78rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{f.factor_name}</span>
                          <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                            +{f.contribution.toFixed(1)} pts
                          </span>
                        </div>

                        {/* Visual Meter */}
                        <div className="meter-track" style={{ marginBottom: '0.4rem' }}>
                          <div 
                            className="meter-fill" 
                            style={{ 
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)' 
                            }} 
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span>{f.reason}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>Raw: {f.raw_value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button 
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setSelectedLocId(selectedRankForDetail.location_id)}
                >
                  <Eye size={13} /> Open Explainability Breakdown
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a location on the left to inspect its ranking formula.
            </div>
          )}
        </div>
      </div>

      {/* Why At Risk Modal */}
      <WhyAtRiskModal 
        locationId={selectedLocId} 
        onClose={() => setSelectedLocId(null)} 
      />
    </div>
  );
};
