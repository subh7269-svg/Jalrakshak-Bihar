import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AlertItem } from '../types';
import { 
  BellRing, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Radio, 
  ShieldAlert, 
  ArrowRight,
  Filter
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { role } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isOfficial = role === 'ADMIN' || role === 'DISTRICT_OFFICIAL';

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts(showAcknowledged ? undefined : false);
      setAlerts(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [showAcknowledged]);

  const handleAcknowledge = async (alertId: number) => {
    try {
      await api.acknowledgeAlert(alertId, `Acknowledged by ${role}`);
      setNotice(`Alert acknowledged.`);
      await fetchAlerts();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(`Failed to acknowledge alert: ${err.message}`);
    }
  };

  return (
    <div className="content-body">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BellRing size={22} color="#ef4444" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Emergency Operations Alert Center
            </h2>
            <span className="badge badge-demo">REAL-TIME THRESHOLD ALERTS</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Automated alerts triggered on gauge threshold breaches, rapid water surges, resource deficits, and road cuts.
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-main)' }}>
          <input 
            type="checkbox" 
            checked={showAcknowledged} 
            onChange={(e) => setShowAcknowledged(e.target.checked)} 
          />
          <span>Show Acknowledged Alerts</span>
        </label>
      </div>

      {notice && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          borderRadius: '6px',
          padding: '0.65rem 1rem',
          fontSize: '0.82rem',
          color: '#6ee7b7',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>{notice}</span>
        </div>
      )}

      {/* Alert Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {alerts.length === 0 ? (
          <div className="card-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No active unacknowledged alerts found.
          </div>
        ) : (
          alerts.map((a) => (
            <div 
              key={a.id} 
              className="card-panel" 
              style={{
                margin: 0,
                borderLeft: `5px solid ${a.severity === 'CRITICAL' ? '#ef4444' : a.severity === 'WARNING' ? '#f59e0b' : '#3b82f6'}`,
                background: a.is_acknowledged ? 'var(--bg-app)' : 'var(--bg-card)'
              }}
            >
              {/* Top Meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className={`badge badge-${a.severity.toLowerCase()}`}>
                      {a.severity}
                    </span>
                    <span className="badge badge-demo" style={{ fontSize: '0.68rem' }}>
                      {a.alert_type}
                    </span>
                    {a.is_acknowledged && (
                      <span className="badge badge-low">
                        ACKNOWLEDGED BY {a.acknowledged_by}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {a.title}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
                    <Clock size={12} />
                    <span>{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Where: {a.where_location}
                  </div>
                </div>
              </div>

              {/* 5-Field Breakdown as specified */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem 0.9rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.2rem' }}>
                    What Happened?
                  </div>
                  <div style={{ color: 'var(--text-main)' }}>{a.what_happened}</div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem 0.9rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Why Does It Matter?
                  </div>
                  <div style={{ color: 'var(--text-main)' }}>{a.why_it_matters}</div>
                </div>
              </div>

              {/* Recommended Step */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#93c5fd', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>
                    Recommended Next Operational Step
                  </span>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                    {a.recommended_step}
                  </div>
                </div>

                {!a.is_acknowledged && isOfficial && (
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ flexShrink: 0 }}
                    onClick={() => handleAcknowledge(a.id)}
                  >
                    <CheckCircle2 size={13} /> Acknowledge Alert
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
