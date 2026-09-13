import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  LocationPriorityRank, 
  AlertItem, 
  LocationItem, 
  ResourceItem, 
  ShelterItem 
} from '../types';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Waves, 
  TrendingUp, 
  Boxes, 
  Home, 
  Compass, 
  ArrowUpRight, 
  Users, 
  Radio, 
  CheckCircle2, 
  RotateCcw,
  Eye,
  Building2,
  PhoneCall,
  Search,
  Filter,
  FileText,
  Send,
  Check,
  ChevronDown,
  ChevronUp,
  Activity,
  Sliders,
  Sparkles
} from 'lucide-react';
import { WhyAtRiskModal } from '../components/risk/WhyAtRiskModal';
import { QuickDispatchModal } from '../components/dashboard/QuickDispatchModal';
import { SitRepModal } from '../components/dashboard/SitRepModal';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { selectedDistrict } = useAuth();
  const { showToast, playTacticalSound } = useToast();
  const navigate = useNavigate();

  const [ranking, setRanking] = useState<LocationPriorityRank[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Set<number>>(new Set());
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [shelters, setShelters] = useState<ShelterItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactivity State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTag, setActiveFilterTag] = useState<'ALL' | 'CRITICAL' | 'ROAD_CUT' | 'SHELTER_GAP' | 'RAPID_SURGE'>('ALL');
  const [expandedLocationId, setExpandedLocationId] = useState<number | null>(1); // Supaul expanded by default
  const [selectedLocForWhy, setSelectedLocForWhy] = useState<number | null>(null);

  // Modals
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [targetLocForDispatch, setTargetLocForDispatch] = useState<LocationPriorityRank | null>(null);
  const [sitRepModalOpen, setSitRepModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rankRes, alertRes, locRes, resRes, shelterRes] = await Promise.all([
        api.getPriorityRanking(selectedDistrict),
        api.getAlerts(false),
        api.getLocations(selectedDistrict),
        api.getResources(selectedDistrict),
        api.getShelters(selectedDistrict),
      ]);
      setRanking(rankRes.ranking || []);
      setAlerts(alertRes || []);
      setLocations(locRes || []);
      setResources(resRes || []);
      setShelters(shelterRes || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      showToast({
        type: 'error',
        title: 'Telemetry Fetch Error',
        message: 'Unable to synchronize real-time hydrological data from server.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDistrict]);

  // Derived metrics
  const topLocation = ranking.length > 0 ? ranking[0] : null;
  const criticalCount = locations.filter(l => l.risk_assessment?.risk_level === 'CRITICAL').length;
  const highCount = locations.filter(l => l.risk_assessment?.risk_level === 'HIGH').length;
  const totalExposedPopulation = locations.reduce((sum, l) => sum + (l.risk_assessment?.estimated_exposed_population || 0), 0);

  // Boat resources
  const boatResources = resources.filter(r => r.resource_type.toLowerCase().includes('boat'));
  const totalAvailBoats = boatResources.reduce((sum, r) => sum + r.available_quantity, 0);
  const totalDeployedBoats = boatResources.reduce((sum, r) => sum + r.deployed_quantity, 0);

  // Filtered Ranking Rows
  const filteredRanking = useMemo(() => {
    return ranking.filter((row) => {
      // Search query filter
      const matchesSearch = 
        row.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.district.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Filter tag
      if (activeFilterTag === 'CRITICAL') {
        return row.flood_risk_pct >= 80;
      }
      if (activeFilterTag === 'ROAD_CUT') {
        return row.road_accessibility_status === 'BLOCKED' || row.road_accessibility_status === 'PARTIALLY_BLOCKED';
      }
      if (activeFilterTag === 'SHELTER_GAP') {
        return row.shelter_capacity_gap > 0;
      }
      if (activeFilterTag === 'RAPID_SURGE') {
        return row.river_rise_rate_3h_m >= 0.3;
      }
      return true;
    });
  }, [ranking, searchQuery, activeFilterTag]);

  // Interactive Quick Actions
  const handleAcknowledgeAlert = (alertId: number, alertTitle: string) => {
    setAcknowledgedAlertIds((prev) => new Set([...prev, alertId]));
    playTacticalSound('success');
    showToast({
      type: 'info',
      title: 'Alert Acknowledged',
      message: `Operational acknowledgment logged for: "${alertTitle}"`,
    });
  };

  const handleToggleRoad = async (row: LocationPriorityRank, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: 'OPEN' | 'BLOCKED' = row.road_accessibility_status === 'BLOCKED' ? 'OPEN' : 'BLOCKED';
    try {
      await api.submitRoadReport({
        location_id: row.location_id,
        road_name: `NH-57 / State Highway Access to ${row.location_name}`,
        route_segment: `${row.district} North Embankment Road`,
        status: newStatus,
        notes: `Immediate field assessment toggled by ${selectedDistrict} incident commander`,
      });

      // Optimistically update local ranking row
      setRanking((prev) =>
        prev.map((r) =>
          r.location_id === row.location_id
            ? { ...r, road_accessibility_status: newStatus }
            : r
        )
      );

      playTacticalSound('click');
      showToast({
        type: newStatus === 'BLOCKED' ? 'warning' : 'success',
        title: `Road Status Updated: ${newStatus}`,
        message: `${row.location_name} access updated. Multi-factor priority score will recalculate.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Road Status Update Failed',
        message: err.message || 'Could not commit status update to database.',
      });
    }
  };

  const handleOpenDispatch = (loc?: LocationPriorityRank) => {
    setTargetLocForDispatch(loc || topLocation);
    setDispatchModalOpen(true);
    playTacticalSound('click');
  };

  return (
    <div className="content-body">
      {/* Top Banner: Emergency Status, Quick Actions & Provenance */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(244, 63, 94, 0.16) 0%, rgba(30, 48, 88, 0.5) 100%)',
        border: '1px solid rgba(244, 63, 94, 0.35)',
        borderRadius: '14px',
        padding: '1rem 1.4rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 8px 24px rgba(244, 63, 94, 0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span className="radar-beacon">
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#f43f5e',
              display: 'inline-block',
              boxShadow: '0 0 12px #f43f5e'
            }} />
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                STATE COMMAND CENTER: MONSOON SURGE MONITORING ACTIVE
              </span>
              <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>LEVEL-3 ALERT</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
              Real-time multi-factor triage synthesizing Kosi, Bagmati, and Gandak river gauges with population exposure.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons on Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setSitRepModalOpen(true)}
            style={{ borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
            title="Generate formatted Situation Report for BSDMA Leadership"
          >
            <FileText size={14} />
            <span>Generate SitRep</span>
          </button>

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenDispatch()}
            title="Dispatch emergency rescue boat fleet directly"
          >
            <Send size={14} />
            <span>Quick Boat Tasking</span>
          </button>
        </div>
      </div>

      {/* CORE UX: The 5 Questions Triage Cards (Clickable & Interactive) */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Operational Triage Synthesis (The 5 Fundamental Questions)
            </h2>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Click any card below to filter the priority board or take instant operational action.
            </p>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            Interactive Cards
          </span>
        </div>

        <div className="triage-grid-5">
          {/* Question 1: WHERE is the situation getting worse? */}
          <div 
            className={`triage-card critical-border ${activeFilterTag === 'CRITICAL' ? 'active-filter' : ''}`}
            onClick={() => {
              setActiveFilterTag(activeFilterTag === 'CRITICAL' ? 'ALL' : 'CRITICAL');
              if (topLocation) setExpandedLocationId(topLocation.location_id);
              playTacticalSound('click');
            }}
            title="Click to filter to critical hotspots"
          >
            <div className="triage-question">1. WHERE is it worse?</div>
            <div className="triage-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Compass size={14} color="#f43f5e" />
                <span>Critical Hotspot</span>
              </span>
              <span className="badge badge-critical" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>RANK #1</span>
            </div>
            <div className="triage-value" style={{ fontSize: '1.3rem', color: '#fca5a5' }}>
              {topLocation ? topLocation.location_name : 'Scanning...'}
            </div>
            <div className="triage-subtext">
              District: <strong style={{ color: '#ffffff' }}>{topLocation?.district || 'N/A'}</strong> • Surge: <strong style={{ color: '#f43f5e' }}>{topLocation ? `+${topLocation.river_rise_rate_3h_m}m/3h` : '0'}</strong>
            </div>
          </div>

          {/* Question 2: HOW severe is it? */}
          <div 
            className="triage-card high-border"
            onClick={() => {
              setActiveFilterTag(activeFilterTag === 'CRITICAL' ? 'ALL' : 'CRITICAL');
              playTacticalSound('click');
            }}
            title="Click to toggle critical/high filter"
          >
            <div className="triage-question">2. HOW severe is it?</div>
            <div className="triage-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldAlert size={14} color="#fb923c" />
                <span>Hazard Magnitude</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Statewide</span>
            </div>
            <div className="triage-value">
              {criticalCount + highCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Zones</span>
            </div>
            <div className="triage-subtext">
              <span style={{ color: '#fca5a5', fontWeight: 700 }}>{criticalCount} Critical</span> •{' '}
              <span style={{ color: '#fdba74', fontWeight: 700 }}>{highCount} High</span> •{' '}
              ~{totalExposedPopulation.toLocaleString()} Exposed
            </div>
          </div>

          {/* Question 3: WHY is that location high priority? */}
          <div 
            className="triage-card warning-border"
            onClick={() => {
              if (topLocation) setSelectedLocForWhy(topLocation.location_id);
              playTacticalSound('click');
            }}
            title="Click to view full 'Why is this area at risk?' explainability breakdown"
          >
            <div className="triage-question">3. WHY is it top priority?</div>
            <div className="triage-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <TrendingUp size={14} color="#facc15" />
                <span>Priority Drivers</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                Explain <Eye size={12} />
              </span>
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem', lineHeight: 1.3 }}>
              {topLocation ? topLocation.key_drivers.slice(0, 2).join(' • ') : 'Calculating...'}
            </div>
            <div className="triage-subtext">
              Priority Score: <strong style={{ color: '#facc15' }}>{topLocation?.priority_score || 0} / 100</strong> (Rank #1)
            </div>
          </div>

          {/* Question 4: WHAT resources are needed? */}
          <div 
            className="triage-card info-border"
            onClick={() => handleOpenDispatch()}
            title="Click to open boat dispatch tasking"
          >
            <div className="triage-question">4. WHAT resources needed?</div>
            <div className="triage-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Boxes size={14} color="#06b6d4" />
                <span>Boats Needed</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                Task Fleet <Send size={11} />
              </span>
            </div>
            <div className="triage-value" style={{ color: '#38bdf8' }}>
              {topLocation ? Math.ceil(topLocation.estimated_exposed_population * 0.3 / 40) : 0}{' '}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Boats Req.</span>
            </div>
            <div className="triage-subtext">
              Target Evacuation: ~{topLocation ? Math.ceil(topLocation.estimated_exposed_population * 0.3).toLocaleString() : 0} persons
            </div>
          </div>

          {/* Question 5: WHERE is there a resource shortage? */}
          <div 
            className={`triage-card shortage-border ${activeFilterTag === 'SHELTER_GAP' ? 'active-filter' : ''}`}
            onClick={() => {
              setActiveFilterTag(activeFilterTag === 'SHELTER_GAP' ? 'ALL' : 'SHELTER_GAP');
              playTacticalSound('click');
            }}
            title="Click to filter by locations with deficits"
          >
            <div className="triage-question">5. WHERE is the shortage?</div>
            <div className="triage-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertTriangle size={14} color="#ef4444" />
                <span>Deficits & Gaps</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: '#fca5a5' }}>Deficit</span>
            </div>
            <div className="triage-value" style={{ color: '#f87171' }}>
              {topLocation ? Math.max(0, Math.ceil(topLocation.estimated_exposed_population * 0.3 / 40) - totalAvailBoats) : 0}{' '}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Boat Gap</span>
            </div>
            <div className="triage-subtext">
              In <strong style={{ color: '#ffffff' }}>{topLocation?.district}</strong> • Avail: {totalAvailBoats} • Deployed: {totalDeployedBoats}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Priority Triage Board & Real-Time Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.75fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Left: Triage Table with Real-time Filters & Expandable Rows */}
        <div className="glass-panel" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldAlert size={20} color="#38bdf8" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                Location Priority Board
              </h3>
              <span className="badge badge-demo" style={{ fontSize: '0.65rem' }}>
                {filteredRanking.length} Sectors
              </span>
            </div>

            {/* Quick Link to Priority Weight Tuning */}
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/priority')}
              style={{ gap: '0.35rem' }}
            >
              <span>Weight Config</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          {/* Interactive Search Box & Filter Chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.1rem' }}>
            <div className="search-box-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="input-control"
                placeholder="Search sector by name, district (e.g. Kunauli, Supaul, Kosi)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Interactive Filter Chips */}
            <div className="filter-chip-row">
              <div 
                className={`filter-chip ${activeFilterTag === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveFilterTag('ALL')}
              >
                All Sectors ({ranking.length})
              </div>
              <div 
                className={`filter-chip ${activeFilterTag === 'CRITICAL' ? 'active' : ''}`}
                onClick={() => setActiveFilterTag('CRITICAL')}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e' }} />
                Critical Hotspots
              </div>
              <div 
                className={`filter-chip ${activeFilterTag === 'ROAD_CUT' ? 'active' : ''}`}
                onClick={() => setActiveFilterTag('ROAD_CUT')}
              >
                <Compass size={12} />
                Road Blocked
              </div>
              <div 
                className={`filter-chip ${activeFilterTag === 'SHELTER_GAP' ? 'active' : ''}`}
                onClick={() => setActiveFilterTag('SHELTER_GAP')}
              >
                <Home size={12} />
                Shelter Deficits
              </div>
              <div 
                className={`filter-chip ${activeFilterTag === 'RAPID_SURGE' ? 'active' : ''}`}
                onClick={() => setActiveFilterTag('RAPID_SURGE')}
              >
                <Waves size={12} />
                River Surge &gt; 0.3m
              </div>
            </div>
          </div>

          {/* Serious Operational Table with Interactive Row Expansion */}
          <div className="table-container">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Location & District</th>
                  <th>Flood Risk</th>
                  <th>Road Status</th>
                  <th>Shelter Gap</th>
                  <th>Priority</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRanking.map((row) => {
                  const isExpanded = expandedLocationId === row.location_id;
                  const isTop = row.rank === 1;

                  return (
                    <React.Fragment key={row.location_id}>
                      <tr 
                        className={`cursor-pointer ${isExpanded ? 'row-expanded' : ''}`}
                        onClick={() => setExpandedLocationId(isExpanded ? null : row.location_id)}
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
                            fontSize: '0.78rem',
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.location_name}</div>
                            {isExpanded ? <ChevronUp size={14} color="#38bdf8" /> : <ChevronDown size={14} color="var(--text-dim)" />}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {row.district} District • ~{row.estimated_exposed_population.toLocaleString()} exposed
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${row.flood_risk_pct >= 80 ? 'critical' : row.flood_risk_pct >= 60 ? 'high' : 'moderate'}`}>
                            {row.flood_risk_pct.toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={(e) => handleToggleRoad(row, e)}
                            className={`badge badge-${row.road_accessibility_status.toLowerCase()} cursor-pointer hover:opacity-80`}
                            title="Click to toggle road status (Passable / Blocked)"
                            style={{ cursor: 'pointer', border: 'none' }}
                          >
                            {row.road_accessibility_status}
                          </button>
                        </td>
                        <td className="mono-cell">
                          {row.shelter_capacity_gap > 0 ? (
                            <span style={{ color: '#f87171', fontWeight: 700 }}>-{row.shelter_capacity_gap.toLocaleString()} beds</span>
                          ) : (
                            <span style={{ color: '#34d399' }}>Adequate</span>
                          )}
                        </td>
                        <td className="mono-cell" style={{ fontWeight: 800, fontSize: '0.98rem', color: isTop ? '#f43f5e' : '#38bdf8' }}>
                          {row.priority_score.toFixed(1)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLocForWhy(row.location_id);
                            }}
                            title="Open 'Why is this area at risk?' explainability breakdown"
                            style={{ fontSize: '0.74rem', padding: '0.3rem 0.6rem' }}
                          >
                            <Eye size={12} />
                            <span>Why?</span>
                          </button>
                        </td>
                      </tr>

                      {/* Interactive Expandable Tactical Drawer */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <div className="expand-drawer">
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1rem' }}>
                                {/* River Surge Gauge */}
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Hydrological Surge Rate
                                  </div>
                                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                                    +{row.river_rise_rate_3h_m} m / 3h
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                                    Rapid rise above danger threshold
                                  </div>
                                </div>

                                {/* Key Contributing Drivers */}
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Top Priority Factors
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '4px', lineHeight: 1.4, fontWeight: 600 }}>
                                    {row.key_drivers.join(' • ')}
                                  </div>
                                </div>

                                {/* Quick Action Launcher */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', justifyContent: 'center' }}>
                                  <button
                                    onClick={() => handleOpenDispatch(row)}
                                    className="btn btn-primary btn-sm"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                  >
                                    <Send size={13} />
                                    <span>Task Rescue Boats to {row.location_name}</span>
                                  </button>
                                  <button
                                    onClick={(e) => handleToggleRoad(row, e)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                  >
                                    <Compass size={13} />
                                    <span>Toggle Road: {row.road_accessibility_status === 'BLOCKED' ? 'Mark OPEN' : 'Mark BLOCKED'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Active Critical Alerts with 1-Click Acknowledge */}
        <div className="glass-panel" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={20} color="#f43f5e" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                Real-Time Alerts ({alerts.length})
              </h3>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/alerts')}
            >
              Broadcasts <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {alerts.slice(0, 4).map((alert) => {
              const isAck = acknowledgedAlertIds.has(alert.id);
              const isCrit = alert.severity === 'CRITICAL';

              return (
                <div 
                  key={alert.id}
                  style={{
                    background: isAck ? 'rgba(255, 255, 255, 0.02)' : isCrit ? 'rgba(244, 63, 94, 0.08)' : 'rgba(251, 146, 60, 0.08)',
                    border: `1px solid ${isAck ? 'var(--border-subtle)' : isCrit ? 'rgba(244, 63, 94, 0.35)' : 'rgba(251, 146, 60, 0.35)'}`,
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    transition: 'all 0.2s ease',
                    opacity: isAck ? 0.55 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span className={`badge badge-${alert.severity.toLowerCase()}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                        {alert.severity}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isAck ? 'var(--text-muted)' : 'var(--text-main)' }}>
                        {alert.title}
                      </span>
                    </div>
                    {isAck ? (
                      <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Check size={12} /> Logged
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id, alert.title)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                        title="Mark alert as acknowledged by command center"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    {alert.what_happened}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                    <span>Location: {alert.where_location}</span>
                    <span>{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tactical GIS Map Quick Preview Link */}
          <div style={{
            marginTop: '1.25rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Tactical GIS Geospatial Layers
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Inspect Kosi/Bagmati river flood zones, NDRF depots & shelters
              </div>
            </div>
            <button
              className="btn btn-accent btn-sm"
              onClick={() => navigate('/map')}
            >
              Open Map <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Why At Risk Explainability Modal */}
      <WhyAtRiskModal 
        locationId={selectedLocForWhy} 
        onClose={() => setSelectedLocForWhy(null)} 
      />

      {/* Quick Boat Tasking Modal */}
      <QuickDispatchModal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        targetLocation={targetLocForDispatch}
        boatResources={boatResources}
        onDispatched={fetchData}
      />

      {/* SitRep Situation Report Modal */}
      <SitRepModal
        isOpen={sitRepModalOpen}
        onClose={() => setSitRepModalOpen(false)}
        ranking={ranking}
        resources={resources}
        shelters={shelters}
        alerts={alerts}
        district={selectedDistrict}
      />
    </div>
  );
};
