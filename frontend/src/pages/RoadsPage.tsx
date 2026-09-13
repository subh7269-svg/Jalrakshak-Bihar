import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RoadStatusItem, LocationItem } from '../types';
import { 
  Compass, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Radio, 
  Save, 
  User, 
  ShieldAlert,
  FileText
} from 'lucide-react';

export const RoadsPage: React.FC = () => {
  const { selectedDistrict, role } = useAuth();
  const [roads, setRoads] = useState<RoadStatusItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  // Report Form State
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedLocId, setSelectedLocId] = useState<number>(1);
  const [roadName, setRoadName] = useState('');
  const [routeSegment, setRouteSegment] = useState('');
  const [statusVal, setStatusVal] = useState<'OPEN' | 'PARTIALLY_BLOCKED' | 'BLOCKED' | 'UNKNOWN'>('BLOCKED');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const canReport = role === 'FIELD_OFFICER' || role === 'DISTRICT_OFFICIAL' || role === 'ADMIN';

  const fetchData = async () => {
    try {
      const [roadList, locList] = await Promise.all([
        api.getRoadStatuses(selectedDistrict),
        api.getLocations(selectedDistrict),
      ]);
      setRoads(roadList || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadName.trim() || !routeSegment.trim()) {
      alert('Please provide Road Name and Route Segment.');
      return;
    }

    try {
      await api.submitRoadReport({
        location_id: selectedLocId,
        road_name: roadName,
        route_segment: routeSegment,
        status: statusVal,
        notes: notes,
        photo_url: photoUrl || undefined,
      });

      setNotice(`Field road report submitted for ${roadName} (${statusVal}). Priority engine updated immediately.`);
      setShowReportForm(false);
      setRoadName('');
      setRouteSegment('');
      setNotes('');
      await fetchData();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      alert(`Report submission failed: ${err.message}`);
    }
  };

  return (
    <div className="content-body">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Compass size={22} color="#3b82f6" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Road Infrastructure & Accessibility Reporting Portal
            </h2>
            <span className="badge badge-demo">FIELD RECON TELEMETRY</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Field officer verification of transit arteries and embankment bridges feeding AI prioritization penalties.
          </p>
        </div>

        {canReport ? (
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowReportForm(!showReportForm)}
          >
            <PlusCircle size={14} />
            <span>{showReportForm ? 'Cancel Report' : 'Submit Field Road Report'}</span>
          </button>
        ) : (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '0.35rem 0.65rem', borderRadius: '4px' }}>
            Read-only mode (Requires FIELD_OFFICER, DISTRICT_OFFICIAL, or ADMIN)
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

      {/* Field Report Submission Form */}
      {showReportForm && (
        <form onSubmit={handleSubmit} className="card-panel" style={{ borderLeft: '4px solid #3b82f6', marginBottom: '1.5rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
            <FileText size={17} color="#60a5fa" />
            <span>New Operational Road Status Field Dispatch</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Affected Settlement / Block
              </label>
              <select 
                className="input-control"
                value={selectedLocId}
                onChange={(e) => setSelectedLocId(parseInt(e.target.value))}
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.district} District)</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Road Name / Highway Designation
              </label>
              <input 
                type="text" className="input-control"
                placeholder="e.g. NH-27 Kunauli Feeder Link"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Specific Route Segment / Chainage
              </label>
              <input 
                type="text" className="input-control"
                placeholder="e.g. Km 42-46 Lowland Embankment Reach"
                value={routeSegment}
                onChange={(e) => setRouteSegment(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Field Condition Status
              </label>
              <select 
                className="input-control"
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value as any)}
              >
                <option value="OPEN">OPEN (Normal transit possible)</option>
                <option value="PARTIALLY_BLOCKED">PARTIALLY BLOCKED (Slow escort / Waterlogged)</option>
                <option value="BLOCKED">BLOCKED (Fully inundated / Culvert washed out)</option>
                <option value="UNKNOWN">UNKNOWN (Pending drone / boat reconnaissance)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Field Inspection Findings & Water Depth Notes
            </label>
            <textarea 
              className="input-control" rows={2}
              placeholder="e.g. 2.5 feet of fast-moving current overtopping western culvert. Light and heavy vehicles suspended."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowReportForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={14} /> Submit Report & Update Priority Engine
            </button>
          </div>
        </form>
      )}

      {/* Road Reports Table */}
      <div className="card-panel">
        <div className="card-header">
          <div className="card-title">
            <Compass size={18} color="#3b82f6" />
            <span>Active Road Accessibility Reports ({roads.length} Logged Arteries)</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Directly impacts isolation scoring in priority ranking
          </span>
        </div>

        <div className="table-container">
          <table className="op-table">
            <thead>
              <tr>
                <th>Road Designation</th>
                <th>Route Segment</th>
                <th>Location & District</th>
                <th>Accessibility Status</th>
                <th>Reported By</th>
                <th>Timestamp</th>
                <th>Field Notes</th>
                <th>Data Source</th>
              </tr>
            </thead>
            <tbody>
              {roads.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>{r.road_name}</td>
                  <td>{r.route_segment}</td>
                  <td>
                    <div>{r.location_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.district} District</div>
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'BLOCKED' ? 'badge-blocked' : r.status === 'PARTIALLY_BLOCKED' ? 'badge-partial' : 'badge-open'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>{r.reported_by}</td>
                  <td className="mono-cell" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(r.reported_at).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
                    {r.notes || 'Routine observation'}
                  </td>
                  <td>
                    <span className="badge badge-demo">Simulated field report</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
