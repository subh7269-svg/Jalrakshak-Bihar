import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  User, 
  FileSpreadsheet
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({
        entity_type: entityFilter || undefined,
        action: actionFilter || undefined,
        username: userFilter || undefined,
        limit: 150,
      });
      setLogs(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter, userFilter]);

  return (
    <div className="content-body">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={22} color="#3b82f6" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Government Operational Audit Trail
            </h2>
            <span className="badge badge-demo">IMMUTABLE RECON LEDGER</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Full chronological chain of custody: tracks who changed resource quantities, road closures, and shelter occupancies.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Showing <strong>{logs.length}</strong> logged entries
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Filter size={15} />
          <span>Entity:</span>
          <select 
            className="input-control" 
            style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
            value={entityFilter} 
            onChange={(e) => setEntityFilter(e.target.value)}
          >
            <option value="">All Entities</option>
            <option value="Resource">Resource Inventory</option>
            <option value="Shelter">Shelter Facility</option>
            <option value="RoadStatus">Road Infrastructure</option>
            <option value="Incident">Field Incidents</option>
            <option value="Simulation">Simulation Events</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Action:</span>
          <select 
            className="input-control" 
            style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
            value={actionFilter} 
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="UPDATE_RESOURCE_INVENTORY">UPDATE_RESOURCE_INVENTORY</option>
            <option value="UPDATE_SHELTER_OCCUPANCY">UPDATE_SHELTER_OCCUPANCY</option>
            <option value="REPORT_ROAD_STATUS">REPORT_ROAD_STATUS</option>
            <option value="UPDATE_ROAD_STATUS">UPDATE_ROAD_STATUS</option>
            <option value="CREATE_INCIDENT">CREATE_INCIDENT</option>
            <option value="SIMULATION_TRIGGER">SIMULATION_TRIGGER</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>User:</span>
          <input 
            type="text" className="input-control"
            placeholder="Search by username..."
            style={{ width: '160px', padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-panel">
        <div className="table-container">
          <table className="op-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User & Role</th>
                <th>Action</th>
                <th>Target Entity</th>
                <th>Field Changed</th>
                <th>Previous Value</th>
                <th>New Value</th>
                <th>Verification Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="mono-cell" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.username}</div>
                      <span className="badge badge-demo" style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                        {log.user_role}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        background: 'var(--bg-elevated)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: '#93c5fd'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.entity_name || log.entity_type}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Type: {log.entity_type}</div>
                    </td>
                    <td className="mono-cell" style={{ color: 'var(--text-muted)' }}>
                      {log.field_name}
                    </td>
                    <td className="mono-cell" style={{ color: '#f87171', maxWidth: '140px', wordBreak: 'break-all' }}>
                      {log.old_value || 'NULL'}
                    </td>
                    <td className="mono-cell" style={{ color: '#34d399', fontWeight: 600, maxWidth: '160px', wordBreak: 'break-all' }}>
                      {log.new_value}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '220px' }}>
                      {log.notes || 'Routine operation'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
