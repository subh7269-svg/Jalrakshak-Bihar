import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: 'ADMIN' | 'DISTRICT_OFFICIAL' | 'FIELD_OFFICER' | 'VIEW_ONLY';
  token: string | null;
  isAuthenticated: boolean;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchRoleQuick: (role: 'ADMIN' | 'DISTRICT_OFFICIAL' | 'FIELD_OFFICER' | 'VIEW_ONLY') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<string, User> = {
  ADMIN: {
    id: 1,
    username: 'admin',
    email: 'admin@jalrakshak.bihar.gov.in',
    full_name: 'Dr. Amitabh Verma, IAS',
    role: 'ADMIN',
    department: 'Bihar State Disaster Management Authority (BSDMA)',
    district: 'ALL',
    is_active: true,
  },
  DISTRICT_OFFICIAL: {
    id: 2,
    username: 'dm_supaul',
    email: 'dm.supaul@bihar.gov.in',
    full_name: 'Kaushal Kumar, IAS (DM Supaul)',
    role: 'DISTRICT_OFFICIAL',
    department: 'District Emergency Operations Center Supaul',
    district: 'Supaul',
    is_active: true,
  },
  FIELD_OFFICER: {
    id: 4,
    username: 'field_officer',
    email: 'field.kosi@bihar.gov.in',
    full_name: 'Commander Rajesh Kumar (SDRF Patrol)',
    role: 'FIELD_OFFICER',
    department: 'State Disaster Response Force (SDRF)',
    district: 'Supaul',
    is_active: true,
  },
  VIEW_ONLY: {
    id: 5,
    username: 'viewer',
    email: 'observer@bihar.gov.in',
    full_name: 'Information Officer Priya Sharma',
    role: 'VIEW_ONLY',
    department: 'Public Information Directorate',
    district: 'ALL',
    is_active: true,
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<'ADMIN' | 'DISTRICT_OFFICIAL' | 'FIELD_OFFICER' | 'VIEW_ONLY'>('DISTRICT_OFFICIAL');
  const [user, setUser] = useState<User | null>(DEMO_USERS['DISTRICT_OFFICIAL']);
  const [token, setToken] = useState<string | null>(localStorage.getItem('jalrakshak_token') || 'demo_token');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  useEffect(() => {
    // Attempt auto-login with default DM credentials to establish valid JWT on backend
    api.login('dm_supaul', 'supaul123')
      .then((res) => {
        setToken(res.access_token);
      })
      .catch((err) => {
        console.warn('Backend login fallback to local session:', err);
      });
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    setToken(res.access_token);
    const assignedRole = res.role as any;
    setRole(assignedRole);
    setUser({
      id: 99,
      username: res.username,
      email: `${res.username}@bihar.gov.in`,
      full_name: res.full_name,
      role: assignedRole,
      district: res.district,
      is_active: true,
    });
  };

  const logout = () => {
    localStorage.removeItem('jalrakshak_token');
    setToken(null);
    setUser(null);
  };

  const switchRoleQuick = async (newRole: 'ADMIN' | 'DISTRICT_OFFICIAL' | 'FIELD_OFFICER' | 'VIEW_ONLY') => {
    setRole(newRole);
    setUser(DEMO_USERS[newRole]);
    const creds: Record<string, [string, string]> = {
      ADMIN: ['admin', 'admin123'],
      DISTRICT_OFFICIAL: ['dm_supaul', 'supaul123'],
      FIELD_OFFICER: ['field_officer', 'field123'],
      VIEW_ONLY: ['viewer', 'view123'],
    };
    const [u, p] = creds[newRole];
    try {
      const res = await api.login(u, p);
      setToken(res.access_token);
    } catch (e) {
      console.warn('Quick role switched locally');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!user,
        selectedDistrict,
        setSelectedDistrict,
        login,
        logout,
        switchRoleQuick,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
