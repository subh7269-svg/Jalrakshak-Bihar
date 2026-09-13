import {
  User,
  LocationItem,
  WhyAtRiskData,
  RiskBrief,
  PriorityRankingResponse,
  PriorityWeights,
  ResourceItem,
  LocationResourcePlan,
  ResourcePlanningAssumption,
  ShelterItem,
  ShelterGapAnalysis,
  RoadStatusItem,
  IncidentItem,
  AlertItem,
  AuditLogItem,
  LocationRecommendationResponse,
  DataSourceCatalogResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8002/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('jalrakshak_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errBody.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request<any>('/health'),

  // Auth
  login: async (username: string, password: string) => {
    const data = await request<{
      access_token: string;
      token_type: string;
      role: string;
      username: string;
      full_name: string;
      district?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('jalrakshak_token', data.access_token);
    return data;
  },
  getMe: () => request<User>('/auth/me'),

  // Locations
  getLocations: (district?: string) => {
    const q = district && district !== 'ALL' ? `?district=${encodeURIComponent(district)}` : '';
    return request<LocationItem[]>(`/locations${q}`);
  },
  getLocation: (id: number) => request<LocationItem>(`/locations/${id}`),

  // Risk Intelligence
  getRiskAssessments: (district?: string) => {
    const q = district && district !== 'ALL' ? `?district=${encodeURIComponent(district)}` : '';
    return request<any[]>(`/risk${q}`);
  },
  getWhyAtRisk: (locationId: number) => request<WhyAtRiskData>(`/risk/${locationId}/why-at-risk`),
  recalculateRisk: () => request<any>('/risk/recalculate', { method: 'POST' }),

  // Priority Engine
  getPriorityRanking: (district?: string, weights?: Partial<PriorityWeights>) => {
    const params = new URLSearchParams();
    if (district && district !== 'ALL') params.append('district', district);
    if (weights?.weight_flood_risk !== undefined) params.append('w_risk', weights.weight_flood_risk.toString());
    if (weights?.weight_population_exposure !== undefined) params.append('w_pop', weights.weight_population_exposure.toString());
    if (weights?.weight_road_blockage !== undefined) params.append('w_road', weights.weight_road_blockage.toString());
    if (weights?.weight_shelter_gap !== undefined) params.append('w_shelter', weights.weight_shelter_gap.toString());
    if (weights?.weight_river_rise_rate !== undefined) params.append('w_rise', weights.weight_river_rise_rate.toString());
    const q = params.toString() ? `?${params.toString()}` : '';
    return request<PriorityRankingResponse>(`/priority-ranking${q}`);
  },

  // Resources
  getResources: (district?: string) => {
    const q = district && district !== 'ALL' ? `?district=${encodeURIComponent(district)}` : '';
    return request<ResourceItem[]>(`/resources${q}`);
  },
  updateResource: (data: {
    resource_id: number;
    available_quantity: number;
    deployed_quantity: number;
    status?: string;
    destination?: string;
    notes?: string;
  }) => request<ResourceItem>('/resources/update', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getResourceRequirements: (locationId: number, assumptions?: Partial<ResourcePlanningAssumption>) =>
    request<LocationResourcePlan>(`/resources/requirements/${locationId}`, {
      method: 'POST',
      body: JSON.stringify(assumptions || {}),
    }),

  // Shelters
  getShelters: (district?: string) => {
    const q = district && district !== 'ALL' ? `?district=${encodeURIComponent(district)}` : '';
    return request<ShelterItem[]>(`/shelters${q}`);
  },
  updateShelter: (data: {
    shelter_id: number;
    current_occupancy: number;
    accessibility_status?: string;
    notes?: string;
  }) => request<ShelterItem>('/shelters/update', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getShelterGapAnalysis: (district: string = 'Supaul', evacuationDemand: number = 3500) =>
    request<ShelterGapAnalysis>(`/shelters/gap-analysis?district=${encodeURIComponent(district)}&evacuation_demand=${evacuationDemand}`),

  // Road Accessibility
  getRoadStatuses: (district?: string) => {
    const q = district && district !== 'ALL' ? `?district=${encodeURIComponent(district)}` : '';
    return request<RoadStatusItem[]>(`/roads${q}`);
  },
  submitRoadReport: (data: {
    location_id: number;
    road_name: string;
    route_segment: string;
    status: string;
    notes?: string;
    photo_url?: string;
  }) => request<RoadStatusItem>('/roads/report', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Incidents
  getIncidents: (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<IncidentItem[]>(`/incidents${q}`);
  },
  createIncident: (data: {
    location_id: number;
    incident_type: string;
    severity: string;
    description: string;
  }) => request<IncidentItem>('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateIncidentStatus: (id: number, status: string, notes?: string) =>
    request<IncidentItem>(`/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  // Alerts
  getAlerts: (acknowledged?: boolean) => {
    const q = acknowledged !== undefined ? `?acknowledged=${acknowledged}` : '';
    return request<AlertItem[]>(`/alerts${q}`);
  },
  acknowledgeAlert: (id: number, notes?: string) =>
    request<AlertItem>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  // Recommendations
  getRecommendation: (locationId: number) =>
    request<LocationRecommendationResponse>(`/recommendations/${locationId}`),

  // Audit Log
  getAuditLogs: (filters?: { entity_type?: string; action?: string; username?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (filters?.entity_type) p.append('entity_type', filters.entity_type);
    if (filters?.action) p.append('action', filters.action);
    if (filters?.username) p.append('username', filters.username);
    if (filters?.limit) p.append('limit', filters.limit.toString());
    const q = p.toString() ? `?${p.toString()}` : '';
    return request<AuditLogItem[]>(`/audit-log${q}`);
  },

  // Data Sources Catalog
  getDataSources: () => request<DataSourceCatalogResponse>('/data-sources'),

  // Dynamic Scenarios
  triggerScenario: (scenarioId: string, notes?: string) =>
    request<any>('/simulate/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId, notes }),
    }),
};
