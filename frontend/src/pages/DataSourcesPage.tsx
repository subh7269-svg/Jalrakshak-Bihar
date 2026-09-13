import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DataSourceCatalogResponse, DataSourceItem } from '../types';
import { 
  DatabaseZap, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Cpu, 
  FileSpreadsheet, 
  Scale, 
  Radio
} from 'lucide-react';

export const DataSourcesPage: React.FC = () => {
  const [data, setData] = useState<DataSourceCatalogResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getDataSources()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="content-body">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <DatabaseZap size={22} color="#3b82f6" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Data Provenance, Lineage & Transparency Directory
            </h2>
            <span className="badge badge-demo">GOVERNMENT AUDIT COMPLIANT</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Explicit categorization of all datasets: Real/Public datasets, Official operational inputs, Calculated formulas, and Simulated demo telemetry.
          </p>
        </div>
      </div>

      {/* Core Principle Alert */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid var(--border-accent)',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        borderLeft: '4px solid #06b6d4'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <ShieldCheck size={18} color="#06b6d4" />
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Mandatory Product Principle: Never Invent Real-World Facts
          </span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {data?.audit_policy || 'Every value belongs strictly to one of: (1) Real/public dataset, (2) User/official-entered operational data, (3) Calculated value, (4) ML prediction, or (5) Simulated/demo data. All demo data is explicitly labeled.'}
        </p>
      </div>

      {/* Dataset Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {data?.catalog.map((item, idx) => (
          <div key={idx} className="card-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', fontWeight: 700 }}>
                  {item.category}
                </span>
                <span className={`badge ${item.is_simulated ? 'badge-demo' : 'badge-low'}`}>
                  {item.is_simulated ? 'SIMULATED DEMO' : 'VERIFIED PUBLIC'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                {item.dataset_name}
              </h3>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Provider / Agency: <strong style={{ color: 'var(--text-main)' }}>{item.provider}</strong>
              </div>

              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '0.75rem',
                lineHeight: 1.4
              }}>
                <div style={{ fontWeight: 600, color: '#93c5fd', marginBottom: '0.2rem' }}>Processing & Integration:</div>
                {item.processing_method}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              <div><strong>Cadence:</strong> {item.refresh_frequency}</div>
              <div style={{ marginTop: '0.15rem' }}><strong>Reliability Note:</strong> {item.reliability_notes}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
