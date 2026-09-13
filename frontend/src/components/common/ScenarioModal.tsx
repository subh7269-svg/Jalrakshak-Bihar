import React, { useState } from 'react';
import { api } from '../../services/api';
import { Sliders, CheckCircle2, AlertTriangle, RefreshCw, X, Waves, ArrowRight } from 'lucide-react';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioApplied: () => void;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({ isOpen, onClose, onScenarioApplied }) => {
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrigger = async (scenarioId: string) => {
    setLoading(true);
    setResultMessage(null);
    try {
      const res = await api.triggerScenario(scenarioId, 'Triggered from Command Center Scenario Simulator');
      setResultMessage(res.message || 'Scenario applied successfully.');
      onScenarioApplied();
    } catch (err: any) {
      setResultMessage(`Error: ${err.message || 'Failed to trigger scenario'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sliders size={20} color="#3b82f6" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Hydrological Surge Scenario Simulator
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Test the live cascade: <strong>DATA → RISK ANALYSIS → EXPLANATION → PRIORITY → RESOURCE GAP → RECOMMENDED ACTION</strong>.
            Triggering a surge updates water levels, triggers ML re-inference, adjusts priority ranks, computes boat shortages, and logs audit events in real time.
          </p>

          {resultMessage && (
            <div style={{
              background: resultMessage.startsWith('Error') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${resultMessage.startsWith('Error') ? '#ef4444' : '#10b981'}`,
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {resultMessage.startsWith('Error') ? <AlertTriangle size={18} color="#ef4444" /> : <CheckCircle2 size={18} color="#10b981" />}
              <span>{resultMessage}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Scenario 1: Kosi Extreme Surge */}
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-accent)',
              borderRadius: '8px',
              padding: '1rem',
              borderLeft: '4px solid var(--risk-critical)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Waves size={16} color="#ef4444" />
                  Scenario A: Kosi Extreme Surge & Embankment Breach
                </span>
                <span className="badge badge-critical">CRITICAL SURGE</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Simulates a monsoon cloudburst in Nepal catchment: River Kosi at Kunauli (Supaul) surges by +0.95m/3h to 54.1m (+2.1m above danger mark). NH-27 feeder link marked BLOCKED. Demonstrates #1 critical triage ranking and severe boat shortages.
              </p>
              <button 
                className="btn btn-primary btn-sm"
                disabled={loading}
                onClick={() => handleTrigger('kosi_surge')}
              >
                {loading ? <RefreshCw size={13} className="spin" /> : <ArrowRight size={13} />}
                <span>Activate Kosi Surge Scenario</span>
              </button>
            </div>

            {/* Scenario 2: Bagmati Floodwave */}
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-accent)',
              borderRadius: '8px',
              padding: '1rem',
              borderLeft: '4px solid var(--risk-high)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Waves size={16} color="#f97316" />
                  Scenario B: Bagmati Floodwave at Darbhanga
                </span>
                <span className="badge badge-high">HIGH SURGE</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Simulates Bagmati overflow at Hayaghat: gauge rises to 50.4m (+1.9m above danger), 185mm rainfall, SH-50 arterial road blocked. Shifts regional priority and tests inter-district resource mutual aid.
              </p>
              <button 
                className="btn btn-secondary btn-sm"
                disabled={loading}
                onClick={() => handleTrigger('bagmati_floodwave')}
              >
                {loading ? <RefreshCw size={13} className="spin" /> : <ArrowRight size={13} />}
                <span>Activate Bagmati Floodwave</span>
              </button>
            </div>

            {/* Scenario 3: Reset */}
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Restore Baseline Telemetry
                </span>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Resets all 7 Bihar gauge stations and road networks to baseline demo values.
                </p>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                disabled={loading}
                onClick={() => handleTrigger('reset_baseline')}
              >
                <RefreshCw size={13} />
                <span>Reset Baseline</span>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
