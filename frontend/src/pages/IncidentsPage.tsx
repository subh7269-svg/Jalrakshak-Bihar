import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IncidentItem, LocationItem } from '../types';
import { 
  AlertOctagon, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Save, 
  ShieldAlert, 
  Radio,
  FileText
} from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const { selectedDistrict, role } = useAuth();
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [selectedLocId, setSelectedLocId] = useState<number>(1);
  const [incType, setIncType] = useState('Embankment Stress / Micro-Breach Risk');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [desc, setDesc] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const canReport = role === 'FIELD_OFFICER' || role === 'DISTRICT_OFFICIAL' || role === 'ADMIN';
  const canUpdate = role === 'DISTRICT_OFFICIAL' || role === 'ADMIN';

  const fetchData = async () => {
    try {
      const [incList, locList] = await Promise.all([
        api.getIncidents(),
        api.getLocations(selectedDistrict),
      ]);
      setIncidents(incList || []);
      setLocations(locList || []);
      if (locList && locList.length > 0 && !selectedLocId) {
        setSelectedLocId(locList[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDistrict]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;

    try {
      await api.createIncident({
        location_id: selectedLocId,
        incident_type: incType,
        severity: severity,
        description: desc,
      });
      setNotice(`Incident logged successfully. Audit log recorded.`);
      setShowForm(false);
      setDesc('');
      await fetchData();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      alert(`Failed to log incident: ${err.message}`);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.updateIncidentStatus(id, newStatus, `Status updated to ${newStatus} by ${role}`);
      setNotice(`Incident status updated to ${newStatus}.`);
      await fetchData();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  return (
    <div className="content-body">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertOctagon size={22} color="#ef4444" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Emergency Incident Log
            </h2>
            <span className="badge badge-demo">FIELD INCIDENT LOGS</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Tracking embankment stresses, breaches, marooned settlements, and critical rescue emergencies.
          </p>
        </div>

        {canReport && (
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm(!showForm)}
          >
            <PlusCircle size={14} />
            <span>{showForm ? 'Cancel' : 'Log New Incident'}</span>
          </button>
        )}
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

      {/* New Incident Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card-panel" style={{ borderLeft: '4px solid #ef4444', marginBottom: '1.5rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
            <FileText size={17} color="#f87171" />
            <span>Dispatch New Field Incident Alert</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Location / Block
              </label>
              <select className="input-control" value={selectedLocId} onChange={(e) => setSelectedLocId(parseInt(e.target.value))}>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.district} District)</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Incident Category
              </label>
              <select className="input-control" value={incType} onChange={(e) => setIncType(e.target.value)}>
                <option value="Embankment Stress / Micro-Breach Risk">Embankment Stress / Micro-Breach Risk</option>
                <option value="Flash Water Surge">Flash Water Surge</option>
                <option value="Trapped Villagers">Trapped Villagers</option>
                <option value="Bridge Washout">Bridge Washout</option>
                <option value="Drinking Water Contamination">Drinking Water Contamination</option>
                <option value="Medical Emergency">Medical Emergency</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Severity Level
              </label>
              <select className="input-control" value={severity} onChange={(e) => setSeverity(e.target.value as any)}>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Operational Description & On-Ground Situation
            </label>
            <textarea 
              className="input-control" rows={3}
              placeholder="Detail the exact incident coordinates, number of affected citizens, and required rescue staging..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={14} /> Commit Incident & Log Audit
            </button>
          </div>
        </form>
      )}

      {/* Incidents Table */}
      <div className="card-panel">
        <div className="table-container">
          <table className="op-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Location & District</th>
                <th>Severity</th>
                <th>Operational Description</th>
                <th>Status</th>
                <th>Reported By</th>
                <th>Reported At</th>
                {canUpdate && <th>Update Status</th>}
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id}>
                  <td style={{ fontWeight: 700 }}>{inc.incident_type}</td>
                  <td>
                    <div>{inc.location_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{inc.district} District</div>
                  </td>
                  <td>
                    <span className={`badge badge-${inc.severity.toLowerCase()}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '320px' }}>
                    {inc.description}
                  </td>
                  <td>
                    <span className={`badge ${inc.status === 'RESOLVED' ? 'badge-low' : inc.status === 'IN_PROGRESS' ? 'badge-high' : 'badge-critical'}`}>
                      {inc.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>{inc.reported_by}</td>
                  <td className="mono-cell" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {new Date(inc.reported_at).toLocaleString()}
                  </td>
                  {canUpdate && (
                    <td>
                      <select 
                        className="input-control" 
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.74rem' }}
                        value={inc.status}
                        onChange={(e) => handleStatusChange(inc.id, e.target.value)}
                      >
                        <option value="REPORTED">REPORTED</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
