import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ResourceItem, 
  LocationItem, 
  LocationResourcePlan, 
  ResourcePlanningAssumption 
} from '../types';
import { 
  Boxes, 
  Calculator, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Save, 
  ShieldAlert, 
  Sliders, 
  Radio, 
  Users,
  Building2
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const { selectedDistrict, role } = useAuth();

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(1);
  const [plan, setPlan] = useState<LocationResourcePlan | null>(null);
  const [assumptions, setAssumptions] = useState<ResourcePlanningAssumption>({
    boat_capacity_persons: 20,
    expected_trips_per_boat: 2,
    evacuation_ratio_pct: 30.0,
    food_packets_per_person_per_day: 2,
    water_litres_per_person_per_day: 3.0,
    medical_kits_per_100_persons: 1,
    planning_horizon_days: 3,
  });

  // Edit Modal State
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [editAvail, setEditAvail] = useState<number>(0);
  const [editDep, setEditDep] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>('OPERATIONAL');
  const [editDest, setEditDest] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const isOfficial = role === 'ADMIN' || role === 'DISTRICT_OFFICIAL';

  const fetchData = async () => {
    try {
      const [resList, locList] = await Promise.all([
        api.getResources(selectedDistrict),
        api.getLocations(selectedDistrict),
      ]);
      setResources(resList || []);
      setLocations(locList || []);
      if (locList && locList.length > 0 && !selectedLocationId) {
        setSelectedLocationId(locList[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlan = async () => {
    if (!selectedLocationId) return;
    try {
      const planRes = await api.getResourceRequirements(selectedLocationId, assumptions);
      setPlan(planRes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDistrict]);

  useEffect(() => {
    fetchPlan();
  }, [selectedLocationId, assumptions]);

  const handleOpenEdit = (r: ResourceItem) => {
    setEditingResource(r);
    setEditAvail(r.available_quantity);
    setEditDep(r.deployed_quantity);
    setEditStatus(r.status);
    setEditDest(r.destination || '');
    setEditNotes('');
  };

  const handleSaveEdit = async () => {
    if (!editingResource) return;
    try {
      await api.updateResource({
        resource_id: editingResource.id,
        available_quantity: editAvail,
        deployed_quantity: editDep,
        status: editStatus,
        destination: editDest,
        notes: editNotes || `Official stock update by ${role}`,
      });
      setUpdateMsg(`Successfully updated inventory for ${editingResource.resource_type}. Audit log recorded.`);
      setEditingResource(null);
      await fetchData();
      await fetchPlan();
      setTimeout(() => setUpdateMsg(null), 4000);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  return (
    <div className="content-body">
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Boxes size={22} color="#3b82f6" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Emergency Resource Management & Planning Engine
            </h2>
            <span className="badge badge-demo">LOGISTICAL LEDGER</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Tracking available vs deployed relief stockpiles and deriving transparent evacuation planning requirements.
          </p>
        </div>

        {!isOfficial && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '0.35rem 0.65rem', borderRadius: '4px' }}>
            Read-only mode (Switch to ADMIN or DISTRICT_OFFICIAL to modify stock)
          </div>
        )}
      </div>

      {updateMsg && (
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
          <span>{updateMsg}</span>
        </div>
      )}

      {/* TOP SECTION: Transparent Resource Requirement Calculator */}
      <div className="card-panel" style={{ borderLeft: '4px solid #3b82f6' }}>
        <div className="card-header">
          <div className="card-title">
            <Calculator size={18} color="#60a5fa" />
            <span>Resource Requirement Engine (Configurable Planning Estimate)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target Location:</span>
            <select 
              className="input-control" 
              style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(parseInt(e.target.value))}
            >
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.district} District)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assumption Sliders */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '0.85rem 1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sliders size={14} color="#06b6d4" />
            <span>Official Planning Assumptions (Inspect & Modify Values)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.75rem' }}>
            <div>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Boat Capacity: <strong>{assumptions.boat_capacity_persons} persons / boat</strong>
              </label>
              <input 
                type="range" min="10" max="40" step="5"
                value={assumptions.boat_capacity_persons}
                onChange={(e) => setAssumptions({ ...assumptions, boat_capacity_persons: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Expected Trips: <strong>{assumptions.expected_trips_per_boat} trips / boat</strong>
              </label>
              <input 
                type="range" min="1" max="5" step="1"
                value={assumptions.expected_trips_per_boat}
                onChange={(e) => setAssumptions({ ...assumptions, expected_trips_per_boat: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Evacuation % of Exposed: <strong>{assumptions.evacuation_ratio_pct}%</strong>
              </label>
              <input 
                type="range" min="10" max="60" step="5"
                value={assumptions.evacuation_ratio_pct}
                onChange={(e) => setAssumptions({ ...assumptions, evacuation_ratio_pct: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Planning Horizon: <strong>{assumptions.planning_horizon_days} days rations</strong>
              </label>
              <input 
                type="range" min="1" max="7" step="1"
                value={assumptions.planning_horizon_days}
                onChange={(e) => setAssumptions({ ...assumptions, planning_horizon_days: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Calculated Planning Requirements Table */}
        {plan && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>
                Target Settlement: <strong>{plan.location_name}</strong> • Potentially Exposed: <strong>~{plan.estimated_exposed_population.toLocaleString()}</strong> • Evac Target: <strong>~{plan.estimated_evacuation_target.toLocaleString()} evacuees</strong>
              </span>
              <span className="badge badge-demo">PLANNING ESTIMATE</span>
            </div>

            <div className="table-container">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Resource Type</th>
                    <th>Required (Planning)</th>
                    <th>Available</th>
                    <th>Deployed</th>
                    <th>Shortage (Deficit)</th>
                    <th>Calculation Basis</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.requirements.map((req, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{req.resource_type}</td>
                      <td className="mono-cell" style={{ fontWeight: 700, color: '#60a5fa' }}>
                        {req.planning_estimate_required.toLocaleString()} {req.unit}
                      </td>
                      <td className="mono-cell" style={{ color: '#34d399' }}>
                        {req.available_quantity.toLocaleString()}
                      </td>
                      <td className="mono-cell">{req.deployed_quantity.toLocaleString()}</td>
                      <td className="mono-cell" style={{ fontWeight: 700, color: req.shortage_quantity > 0 ? '#f87171' : '#34d399' }}>
                        {req.shortage_quantity > 0 ? `-${req.shortage_quantity.toLocaleString()} ${req.unit}` : '0 (Covered)'}
                      </td>
                      <td style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{req.calculation_basis}</td>
                      <td>
                        <span className={`badge ${req.status === 'SEVERE_DEFICIT' ? 'badge-critical' : req.status === 'DEFICIT' ? 'badge-high' : 'badge-low'}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="decision-support-box" style={{ marginTop: '0.6rem' }}>
              {plan.planning_disclaimer}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: Inventory Master Table with Edit Capability */}
      <div className="card-panel">
        <div className="card-header">
          <div className="card-title">
            <Boxes size={18} color="#3b82f6" />
            <span>Stationed Emergency Inventory Ledger ({resources.length} Items)</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Real-time stock across SDRF / NDRF / DEOC depots
          </span>
        </div>

        <div className="table-container">
          <table className="op-table">
            <thead>
              <tr>
                <th>Resource Type</th>
                <th>Depot / Staging Base</th>
                <th>District</th>
                <th>Available</th>
                <th>Deployed</th>
                <th>Total</th>
                <th>Status</th>
                <th>Destination</th>
                <th>Last Updated</th>
                {isOfficial && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {resources.map((res) => (
                <tr key={res.id}>
                  <td style={{ fontWeight: 600 }}>{res.resource_type}</td>
                  <td>{res.station_name}</td>
                  <td>{res.district || 'Statewide Pool'}</td>
                  <td className="mono-cell" style={{ color: '#34d399', fontWeight: 700 }}>
                    {res.available_quantity.toLocaleString()} {res.unit}
                  </td>
                  <td className="mono-cell" style={{ color: '#fdba74' }}>
                    {res.deployed_quantity.toLocaleString()}
                  </td>
                  <td className="mono-cell" style={{ fontWeight: 600 }}>
                    {res.total_quantity.toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${res.status === 'OPERATIONAL' ? 'badge-low' : res.status === 'LOW_STOCK' ? 'badge-high' : 'badge-critical'}`}>
                      {res.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {res.destination || 'Unassigned'}
                  </td>
                  <td style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {res.last_updated_by}
                  </td>
                  {isOfficial && (
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(res)}
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

      {/* Edit Resource Modal */}
      {editingResource && (
        <div className="modal-overlay" onClick={() => setEditingResource(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                Update Stock: {editingResource.resource_type}
              </h3>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Base: <strong>{editingResource.station_name}</strong> • Unit: <strong>{editingResource.unit}</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                    Available Quantity
                  </label>
                  <input 
                    type="number" className="input-control" min="0"
                    value={editAvail} 
                    onChange={(e) => setEditAvail(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                    Currently Deployed Quantity
                  </label>
                  <input 
                    type="number" className="input-control" min="0"
                    value={editDep} 
                    onChange={(e) => setEditDep(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Operational Status
                </label>
                <select 
                  className="input-control"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="OPERATIONAL">OPERATIONAL</option>
                  <option value="LOW_STOCK">LOW_STOCK</option>
                  <option value="DEPLETED">DEPLETED</option>
                  <option value="MOBILIZING">MOBILIZING</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Deployment Destination / Task Force Sector
                </label>
                <input 
                  type="text" className="input-control"
                  placeholder="e.g. Kunauli Embankment Sector A"
                  value={editDest} 
                  onChange={(e) => setEditDest(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Audit Reason / Dispatch Note
                </label>
                <input 
                  type="text" className="input-control"
                  placeholder="e.g. Requisitioned 4 boats for Ward 3 evacuation"
                  value={editNotes} 
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingResource(null)}>
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
