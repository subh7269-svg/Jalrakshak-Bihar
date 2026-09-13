import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShelterItem, ShelterGapAnalysis } from '../types';
import { 
  Home, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Save, 
  ShieldAlert, 
  Radio,
  Building2,
  PhoneCall
} from 'lucide-react';

export const SheltersPage: React.FC = () => {
  const { selectedDistrict, role } = useAuth();
  const [shelters, setShelters] = useState<ShelterItem[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<ShelterGapAnalysis | null>(null);
  const [evacDemand, setEvacDemand] = useState<number>(3800);
  const [editingShelter, setEditingShelter] = useState<ShelterItem | null>(null);
  const [editOcc, setEditOcc] = useState<number>(0);
  const [editAccess, setEditAccess] = useState<string>('ACCESSIBLE');
  const [editNotes, setEditNotes] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);

  const isOfficial = role === 'ADMIN' || role === 'DISTRICT_OFFICIAL';
  const targetDistrict = selectedDistrict === 'ALL' ? 'Supaul' : selectedDistrict;

  const fetchShelters = async () => {
    try {
      const [shList, gap] = await Promise.all([
        api.getShelters(selectedDistrict),
        api.getShelterGapAnalysis(targetDistrict, evacDemand),
      ]);
      setShelters(shList || []);
      setGapAnalysis(gap);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, [selectedDistrict, evacDemand]);

  const handleOpenEdit = (s: ShelterItem) => {
    setEditingShelter(s);
    setEditOcc(s.current_occupancy);
    setEditAccess(s.accessibility_status);
    setEditNotes('');
  };

  const handleSaveEdit = async () => {
    if (!editingShelter) return;
    try {
      await api.updateShelter({
        shelter_id: editingShelter.id,
        current_occupancy: editOcc,
        accessibility_status: editAccess,
        notes: editNotes || `Shelter occupancy updated by ${role}`,
      });
      setNotice(`Updated occupancy for ${editingShelter.name}. Audit log recorded.`);
      setEditingShelter(null);
      await fetchShelters();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const totalCap = shelters.reduce((sum, s) => sum + s.total_capacity, 0);
  const totalOcc = shelters.reduce((sum, s) => sum + s.current_occupancy, 0);
  const totalAvail = Math.max(0, totalCap - totalOcc);

  return (
    <div className="content-body">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Home size={22} color="#3b82f6" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Shelter Operations & Evacuation Capacity Management
            </h2>
            <span className="badge badge-demo">FIELD CAPACITY OPS</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Live shelter occupancy tracking and projected evacuation capacity gap detection.
          </p>
        </div>

        {!isOfficial && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '0.35rem 0.65rem', borderRadius: '4px' }}>
            Read-only mode (Switch to ADMIN or DISTRICT_OFFICIAL to modify occupancy)
          </div>
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

      {/* Top Cards: Capacity & Gap Synthesis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="triage-card info-border">
          <div className="triage-label">
            <Home size={14} color="#06b6d4" /> Total Capacity
          </div>
          <div className="triage-value">{totalCap.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>beds</span></div>
          <div className="triage-subtext">Across {shelters.length} active registered relief centers</div>
        </div>

        <div className="triage-card warning-border">
          <div className="triage-label">
            <Users size={14} color="#eab308" /> Current Occupancy
          </div>
          <div className="triage-value">{totalOcc.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({((totalOcc / (totalCap || 1)) * 100).toFixed(0)}%)</span></div>
          <div className="triage-subtext">Displaced citizens currently registered in camps</div>
        </div>

        <div className="triage-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="triage-label">
            <CheckCircle2 size={14} color="#10b981" /> Available Headroom
          </div>
          <div className="triage-value" style={{ color: '#34d399' }}>{totalAvail.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>spaces</span></div>
          <div className="triage-subtext">Formula: Total Capacity - Current Occupancy</div>
        </div>

        <div className="triage-card critical-border">
          <div className="triage-label">
            <AlertTriangle size={14} color="#ef4444" /> Shelter Capacity Gap
          </div>
          <div className="triage-value" style={{ color: gapAnalysis && gapAnalysis.capacity_gap > 0 ? '#f87171' : '#34d399' }}>
            {gapAnalysis ? gapAnalysis.capacity_gap.toLocaleString() : 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>deficit</span>
          </div>
          <div className="triage-subtext">
            In <strong>{targetDistrict}</strong> for ~{evacDemand.toLocaleString()} projected evacuees
          </div>
        </div>
      </div>

      {/* District Gap Analysis Inspector */}
      {gapAnalysis && gapAnalysis.capacity_gap > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <AlertTriangle size={18} color="#ef4444" />
              SHELTER CAPACITY GAP DETECTED IN {targetDistrict.toUpperCase()} DISTRICT
            </div>
            <p style={{ fontSize: '0.8rem', color: '#fecaca' }}>
              {gapAnalysis.warning_message}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simulate Evac Demand:</span>
            <input 
              type="number" className="input-control" style={{ width: '110px' }}
              value={evacDemand}
              onChange={(e) => setEvacDemand(parseInt(e.target.value) || 0)}
              step="500" min="500" max="25000"
            />
          </div>
        </div>
      )}

      {/* Shelter Table */}
      <div className="card-panel">
        <div className="card-header">
          <div className="card-title">
            <Home size={18} color="#3b82f6" />
            <span>Shelter Facility Register ({shelters.length} Facilities)</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Official capacity and on-ground accessibility status
          </span>
        </div>

        <div className="table-container">
          <table className="op-table">
            <thead>
              <tr>
                <th>Shelter Facility Name</th>
                <th>District</th>
                <th>Total Cap</th>
                <th>Occupancy</th>
                <th>Available Headroom</th>
                <th>Status</th>
                <th>Accessibility</th>
                <th>In-Charge / Phone</th>
                {isOfficial && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {shelters.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.location_name}</div>
                  </td>
                  <td>{s.district}</td>
                  <td className="mono-cell">{s.total_capacity.toLocaleString()}</td>
                  <td className="mono-cell" style={{ fontWeight: 600, color: s.occupancy_pct >= 90 ? '#f87171' : 'var(--text-main)' }}>
                    {s.current_occupancy.toLocaleString()} ({s.occupancy_pct}%)
                  </td>
                  <td className="mono-cell" style={{ fontWeight: 700, color: s.available_capacity === 0 ? '#f87171' : '#34d399' }}>
                    {s.available_capacity.toLocaleString()} beds
                  </td>
                  <td>
                    <span className={`badge ${s.available_capacity === 0 ? 'badge-critical' : s.occupancy_pct >= 80 ? 'badge-high' : 'badge-low'}`}>
                      {s.available_capacity === 0 ? 'FULL' : s.occupancy_pct >= 80 ? 'TIGHT' : 'OPEN'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${s.accessibility_status === 'ACCESSIBLE' ? 'badge-open' : s.accessibility_status === 'LIMITED' ? 'badge-partial' : 'badge-blocked'}`}>
                      {s.accessibility_status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {s.contact_person || 'DEOC Team'}<br />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{s.contact_phone}</span>
                  </td>
                  {isOfficial && (
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(s)}
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingShelter && (
        <div className="modal-overlay" onClick={() => setEditingShelter(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                Update Shelter: {editingShelter.name}
              </h3>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Total Licensed Capacity: <strong>{editingShelter.total_capacity.toLocaleString()} persons</strong>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Current Occupancy (Persons Registered)
                </label>
                <input 
                  type="number" className="input-control" min="0" max={editingShelter.total_capacity}
                  value={editOcc} 
                  onChange={(e) => setEditOcc(parseInt(e.target.value) || 0)}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Resulting available capacity: {Math.max(0, editingShelter.total_capacity - editOcc)} beds
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Ground Accessibility Status
                </label>
                <select 
                  className="input-control"
                  value={editAccess}
                  onChange={(e) => setEditAccess(e.target.value)}
                >
                  <option value="ACCESSIBLE">ACCESSIBLE (Vehicular convoys can reach)</option>
                  <option value="LIMITED">LIMITED (Tractors / High-clearance vehicles only)</option>
                  <option value="CUT_OFF">CUT_OFF (Surrounded by water / Boat only)</option>
                </select>
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Audit Note / Verification Reason
                </label>
                <input 
                  type="text" className="input-control"
                  placeholder="e.g. Admitted 120 new evacuees from Kunauli Ward 2"
                  value={editNotes} 
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingShelter(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                <Save size={14} /> Commit Update & Log Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
