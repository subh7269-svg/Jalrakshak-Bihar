import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  BrainCircuit,
  ListOrdered,
  Boxes,
  Home,
  Compass,
  AlertOctagon,
  BellRing,
  History,
  DatabaseZap,
  Activity,
  Cpu
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Command Center', icon: LayoutDashboard, badge: '5 Qs' },
    { to: '/map', label: 'Tactical GIS Map', icon: Map },
    { to: '/risk-analysis', label: 'Flood Risk Engine', icon: BrainCircuit, badge: 'AI' },
    { to: '/priority', label: 'Priority Ranking', icon: ListOrdered },
    { to: '/resources', label: 'Resources & Gaps', icon: Boxes },
    { to: '/shelters', label: 'Shelter Ops', icon: Home },
    { to: '/roads', label: 'Road Accessibility', icon: Compass },
    { to: '/incidents', label: 'Active Incidents', icon: AlertOctagon },
    { to: '/alerts', label: 'Emergency Alerts', icon: BellRing, isAlert: true },
    { to: '/audit-log', label: 'Audit Trail', icon: History },
    { to: '/data-sources', label: 'Data Provenance', icon: DatabaseZap },
  ];

  return (
    <aside className="app-sidebar">
      <div>
        <div style={{
          padding: '0 1.5rem 0.85rem',
          fontSize: '0.68rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-dim)',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>Operations Modules</span>
          <span style={{ fontSize: '0.6rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>
            v2.0 MVP
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: item.badge === 'AI' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(56, 189, 248, 0.3) 100%)' : 'rgba(255, 255, 255, 0.08)',
                    color: item.badge === 'AI' ? '#c084fc' : 'var(--text-muted)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {item.badge}
                  </span>
                )}
                {item.isAlert && (
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#f43f5e',
                    boxShadow: '0 0 8px #f43f5e'
                  }} />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status & Health */}
      <div style={{ padding: '0 1rem' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(12px)',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }} />
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)' }}>BSDMA Node</span>
            </div>
            <span style={{ fontSize: '0.66rem', color: '#10b981', fontWeight: 700 }}>ONLINE</span>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ML Engine:</span>
              <span style={{ color: '#c084fc', fontWeight: 600 }}>RandomForest 120T</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Decision Mode:</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>Evidence-Based</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
