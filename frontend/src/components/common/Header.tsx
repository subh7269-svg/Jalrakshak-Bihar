import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
   ShieldAlert, 
   Sliders, 
   Radio, 
   Building2, 
   UserCheck, 
   Volume2, 
   VolumeX, 
   Sparkles, 
   RefreshCw,
   CheckCircle2,
   ChevronDown
 } from 'lucide-react';

interface HeaderProps {
  onOpenSimulation: () => void;
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSimulation, onRefreshData }) => {
  const { user, role, switchRoleQuick, selectedDistrict, setSelectedDistrict } = useAuth();
  const { showToast, soundEnabled, toggleSound } = useToast();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const districts = ['ALL', 'Supaul', 'Darbhanga', 'Saharsa', 'Muzaffarpur', 'Patna', 'Bhagalpur', 'Gopalganj'];

  const handleDistrictChange = (newDistrict: string) => {
    setSelectedDistrict(newDistrict);
    showToast({
      type: 'info',
      title: 'District Filter Applied',
      message: newDistrict === 'ALL' ? 'Showing statewide telemetry for all Bihar river basins.' : `Filtered triage and resources for ${newDistrict} District.`
    });
  };

  const handleRoleSwitch = (newRole: 'ADMIN' | 'DISTRICT_OFFICIAL' | 'FIELD_OFFICER' | 'VIEW_ONLY') => {
    switchRoleQuick(newRole);
    setRoleMenuOpen(false);
    showToast({
      type: 'success',
      title: `Role Switched to ${newRole}`,
      message: `Active session updated with ${newRole} capabilities.`
    });
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    if (onRefreshData) onRefreshData();
    setTimeout(() => {
      setRefreshing(false);
      showToast({
        type: 'success',
        title: 'Telemetry Synced',
        message: 'Hydrological gauge readings & ML inference state refreshed.'
      });
    }, 600);
  };

  return (
    <header className="app-header">
      {/* Brand & Live Telemetry Beacon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
          color: 'white',
          padding: '0.65rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <ShieldAlert size={26} />
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 10px #10b981'
          }} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 800, 
              letterSpacing: '-0.03em', 
              background: 'linear-gradient(180deg, #ffffff 30%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              JalRakshak Bihar
            </h1>
            <span className="badge badge-demo">
              <Radio size={11} className="animate-pulse" />
              SIMULATED / DEMO MODE
            </span>
          </div>
          <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '1px' }}>
            State Emergency Operations Center • AI Flood Intelligence & Triage System
          </p>
        </div>
      </div>

      {/* Center Interactive Controls: Live District Selector & Simulation Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-glass)',
          borderRadius: '10px',
          padding: '0.35rem 0.75rem',
          backdropFilter: 'blur(8px)'
        }}>
          <Building2 size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>District:</span>
          <select 
            className="input-control" 
            style={{ 
              width: 'auto', 
              padding: '0.25rem 0.6rem', 
              fontSize: '0.82rem',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              color: '#38bdf8',
              cursor: 'pointer'
            }}
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
          >
            {districts.map(d => (
              <option key={d} value={d} style={{ background: '#0b1329', color: '#f8fafc' }}>
                {d === 'ALL' ? 'All Bihar Districts (Statewide)' : `${d} District`}
              </option>
            ))}
          </select>
        </div>

        {/* Live Scenario Simulator Launcher */}
        <button 
          onClick={onOpenSimulation}
          className="btn btn-secondary btn-sm"
          style={{ 
            borderColor: 'rgba(56, 189, 248, 0.4)', 
            color: '#38bdf8',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)'
          }}
          title="Trigger hydrological surge scenarios to observe live priority & resource changes"
        >
          <Sliders size={14} />
          <span>Scenario Simulator</span>
          <span style={{
            fontSize: '0.65rem',
            background: 'rgba(56, 189, 248, 0.25)',
            padding: '1px 6px',
            borderRadius: '999px',
            fontWeight: 700
          }}>
            Interactive
          </span>
        </button>

        {/* Manual Telemetry Sync Button */}
        <button
          onClick={handleManualRefresh}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.45rem', borderRadius: '8px' }}
          title="Refresh Live Telemetry"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
        </button>
      </div>

      {/* Right Controls: Tactical Audio Toggle & User / Role Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
        {/* Sound FX Toggle */}
        <button
          onClick={toggleSound}
          className="btn btn-secondary btn-sm"
          style={{ 
            padding: '0.45rem', 
            borderRadius: '8px', 
            color: soundEnabled ? '#38bdf8' : '#64748b' 
          }}
          title={soundEnabled ? 'Emergency Chime: ON (Click to Mute)' : 'Emergency Chime: MUTED (Click to Enable)'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {user?.full_name || 'Official Session'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {user?.department || 'Disaster Management Cell'}
          </div>
        </div>

        {/* Role Pill with Interactive Switcher */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="btn btn-secondary btn-sm"
            style={{ 
              background: role === 'ADMIN' ? 'rgba(56, 189, 248, 0.15)' : 
                         role === 'DISTRICT_OFFICIAL' ? 'rgba(16, 185, 129, 0.15)' : 
                         role === 'FIELD_OFFICER' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              borderColor: role === 'ADMIN' ? '#38bdf8' : 
                           role === 'DISTRICT_OFFICIAL' ? '#10b981' : 
                           role === 'FIELD_OFFICER' ? '#f59e0b' : 'var(--border-glass)',
              color: 'var(--text-main)',
              gap: '0.45rem',
              borderRadius: '9999px',
              padding: '0.35rem 0.85rem'
            }}
          >
            <UserCheck size={14} color={role === 'ADMIN' ? '#38bdf8' : role === 'DISTRICT_OFFICIAL' ? '#10b981' : '#f59e0b'} />
            <span style={{ fontWeight: 700 }}>{role}</span>
            <ChevronDown size={12} color="var(--text-muted)" />
          </button>

          {roleMenuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '125%',
              background: '#0d1527',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              padding: '0.6rem',
              boxShadow: '0 16px 40px rgba(0,0,0,0.7), 0 0 25px rgba(56, 189, 248, 0.15)',
              zIndex: 250,
              minWidth: '240px',
              animation: 'scaleUp 0.15s ease-out'
            }}>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', padding: '0.3rem 0.6rem', fontWeight: 700 }}>
                Switch Role (Quick Test)
              </div>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '0.35rem', borderColor: role === 'ADMIN' ? '#38bdf8' : 'transparent' }}
                onClick={() => handleRoleSwitch('ADMIN')}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
                <span>ADMIN (Full System Access)</span>
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '0.35rem', borderColor: role === 'DISTRICT_OFFICIAL' ? '#10b981' : 'transparent' }}
                onClick={() => handleRoleSwitch('DISTRICT_OFFICIAL')}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span>DISTRICT_OFFICIAL (Triage & Resources)</span>
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '0.35rem', borderColor: role === 'FIELD_OFFICER' ? '#f59e0b' : 'transparent' }}
                onClick={() => handleRoleSwitch('FIELD_OFFICER')}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                <span>FIELD_OFFICER (Road/Incidents)</span>
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ width: '100%', justifyContent: 'flex-start', borderColor: role === 'VIEW_ONLY' ? '#94a3b8' : 'transparent' }}
                onClick={() => handleRoleSwitch('VIEW_ONLY')}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
                <span>VIEW_ONLY (Observer Mode)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
