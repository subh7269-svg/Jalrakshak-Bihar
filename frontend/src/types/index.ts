export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'DISTRICT_OFFICIAL' | 'FIELD_OFFICER' | 'VIEW_ONLY';
  department?: string;
  district?: string;
  is_active: boolean;
}

export interface HydrologyData {
  rainfall_24h_mm: number;
  river_level_m: number;
  danger_mark_m: number;
  warning_mark_m: number;
  river_rise_rate_3h_m: number;
  distance_to_river_km: number;
  soil_saturation_pct: number;
  data_source_type: string;
  is_simulated: boolean;
  recorded_at: string;
}

export interface RiskBrief {
  risk_score_pct: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  predicted_exposure_pct: number;
  estimated_exposed_population: number;
  calculation_method: string;
  is_simulated: boolean;
  assessed_at: string;
}

export interface LocationItem {
  id: number;
  name: string;
  district: string;
  block: string;
  panchayat?: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  population: number;
  river_basin: string;
  baseline_vulnerability: number;
  is_active: boolean;
  hydrology?: HydrologyData;
  risk_assessment?: RiskBrief;
}

export interface ContributingFactor {
  factor_name: string;
  impact: string;
  weight_pct: number;
  description: string;
  feature_value: string;
}

export interface RawSensorValues {
  river_level_m: number;
  danger_mark_m: number;
  river_rise_rate_3h_m: number;
  rainfall_24h_mm: number;
  elevation_m: number;
  distance_to_river_km: number;
  soil_saturation_pct: number;
  data_source: string;
  is_simulated: boolean;
}

export interface PopulationExposureEstimate {
  total_population: number;
  predicted_exposure_pct: number;
  estimated_exposed_population: number;
  calculation_formula: string;
  is_model_estimate: boolean;
  methodology_note: string;
}

export interface WhyAtRiskData {
  location_id: number;
  location_name: string;
  district: string;
  risk_score_pct: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  model_name: string;
  is_simulated: boolean;
  data_source_badge: string;
  factors: ContributingFactor[];
  raw_inputs: RawSensorValues;
  population_exposure: PopulationExposureEstimate;
  disclaimer: string;
}

export interface PriorityFactorScore {
  factor_name: string;
  raw_value: string;
  normalized_score: number;
  weight: number;
  contribution: number;
  reason: string;
}

export interface LocationPriorityRank {
  rank: number;
  location_id: number;
  location_name: string;
  district: string;
  priority_score: number;
  priority_category: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  flood_risk_pct: number;
  estimated_exposed_population: number;
  road_accessibility_status: 'OPEN' | 'PARTIALLY_BLOCKED' | 'BLOCKED' | 'UNKNOWN';
  shelter_capacity_gap: number;
  river_rise_rate_3h_m: number;
  why_ranked_here: string;
  key_drivers: string[];
  factor_breakdown: PriorityFactorScore[];
}

export interface PriorityWeights {
  weight_flood_risk: number;
  weight_population_exposure: number;
  weight_road_blockage: number;
  weight_shelter_gap: number;
  weight_river_rise_rate: number;
}

export interface PriorityRankingResponse {
  ranking: LocationPriorityRank[];
  weights_applied: PriorityWeights;
  evaluated_at: string;
  formula_explanation: string;
}

export interface ResourceItem {
  id: number;
  location_id?: number;
  resource_type: string;
  station_name: string;
  total_quantity: number;
  available_quantity: number;
  deployed_quantity: number;
  unit: string;
  status: string;
  destination?: string;
  last_updated_by: string;
  updated_at: string;
  is_simulated: boolean;
  location_name?: string;
  district?: string;
}

export interface ResourcePlanningAssumption {
  boat_capacity_persons: number;
  expected_trips_per_boat: number;
  evacuation_ratio_pct: number;
  food_packets_per_person_per_day: number;
  water_litres_per_person_per_day: number;
  medical_kits_per_100_persons: number;
  planning_horizon_days: number;
}

export interface ResourceRequirementItem {
  resource_type: string;
  unit: string;
  planning_estimate_required: number;
  available_quantity: number;
  deployed_quantity: number;
  shortage_quantity: number;
  calculation_basis: string;
  status: 'ADEQUATE' | 'DEFICIT' | 'SEVERE_DEFICIT';
}

export interface LocationResourcePlan {
  location_id: number;
  location_name: string;
  district: string;
  risk_level: string;
  estimated_exposed_population: number;
  estimated_evacuation_target: number;
  assumptions_applied: ResourcePlanningAssumption;
  requirements: ResourceRequirementItem[];
  planning_disclaimer: string;
}

export interface ShelterItem {
  id: number;
  location_id: number;
  name: string;
  district: string;
  total_capacity: number;
  current_occupancy: number;
  available_capacity: number;
  accessibility_status: string;
  latitude: number;
  longitude: number;
  contact_person?: string;
  contact_phone?: string;
  is_active: boolean;
  updated_at: string;
  is_simulated: boolean;
  location_name?: string;
  occupancy_pct: number;
}

export interface ShelterGapAnalysis {
  district: string;
  total_shelters: number;
  total_capacity: number;
  current_occupancy: number;
  total_available_capacity: number;
  estimated_evacuation_demand: number;
  capacity_gap: number;
  status: 'SURPLUS' | 'TIGHT' | 'DEFICIT';
  warning_message?: string;
}

export interface RoadStatusItem {
  id: number;
  location_id: number;
  road_name: string;
  route_segment: string;
  status: 'OPEN' | 'PARTIALLY_BLOCKED' | 'BLOCKED' | 'UNKNOWN';
  notes?: string;
  photo_url?: string;
  reported_by: string;
  reporter_role: string;
  is_simulated: boolean;
  reported_at: string;
  location_name?: string;
  district?: string;
}

export interface IncidentItem {
  id: number;
  location_id: number;
  incident_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED';
  reported_by: string;
  reported_at: string;
  resolved_at?: string;
  is_simulated: boolean;
  location_name?: string;
  district?: string;
}

export interface AlertItem {
  id: number;
  location_id?: number;
  title: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  alert_type: string;
  what_happened: string;
  where_location: string;
  why_it_matters: string;
  recommended_step: string;
  created_at: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  is_simulated: boolean;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  username: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  entity_name?: string;
  field_name: string;
  old_value?: string;
  new_value: string;
  timestamp: string;
  notes?: string;
}

export interface RecommendationItem {
  category: string;
  action: string;
  rationale: string;
  urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM';
}

export interface LocationRecommendationResponse {
  location_id: number;
  location_name: string;
  district: string;
  priority_rank: number;
  priority_category: string;
  flood_risk_pct: number;
  trigger_reasons: string[];
  planning_recommendations: RecommendationItem[];
  underlying_evidence: string[];
  official_disclaimer: string;
}

export interface DataSourceItem {
  category: string;
  dataset_name: string;
  provider: string;
  data_type: string;
  is_simulated: boolean;
  refresh_frequency: string;
  last_ingested_or_updated: string;
  processing_method: string;
  reliability_notes: string;
}

export interface DataSourceCatalogResponse {
  catalog: DataSourceItem[];
  audit_policy: string;
}
