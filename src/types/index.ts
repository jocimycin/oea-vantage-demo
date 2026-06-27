// ─── OEA Vantage — Shared TypeScript Contracts ────────────────────────────

export interface Nest {
  nest_id: string
  nest_name: string
  lat: number
  lng: number
  state: string
  lga: string
  platform_types: ('P1' | 'P2')[]
  drone_capacity: number
  operational: boolean
  ncaa_permit_ref: string
  onsa_clearance_ref: string | null
  service_radius_p1_km: number
  service_radius_p2_km: number | null
}

export interface Facility {
  facility_id: string
  dhis2_uid: string
  facility_name: string
  facility_type: 'hospital' | 'phc' | 'maternity' | 'market' | 'warehouse'
  ownership: 'federal' | 'state' | 'lga' | 'private'
  state: string
  lga: string
  lat: number
  lng: number
  cold_chain: boolean
  priority_tier: 1 | 2 | 3
  active: boolean
  contact_name: string
  contact_phone: string
}

export interface KFZ {
  kfz_id: string
  kfz_name: string
  kfz_type: 'airport' | 'military' | 'aso_rock' | 'prison' | 'refinery' | 'event' | 'advisory'
  severity: 'hard_exclusion' | 'advisory'
  authority: 'NCAA' | 'ONSA' | 'military' | 'NAMA'
  notam_ref: string
  lat: number
  lng: number
  radius_km: number
  altitude_floor_m: number
  altitude_ceiling_m: number
  valid_from: string
  valid_to: string | null
  is_active: boolean
  override_allowed: boolean
}

export type FlightStatus = 'in_flight' | 'validated' | 'completed' | 'aborted' | 'pending'
export type WeatherOpsStatus = 'go' | 'caution' | 'no_fly'
export type CargoType = 'blood' | 'vaccine' | 'medication' | 'medical_supply' | 'market_goods'

export interface Flight {
  delivery_id: string
  flight_plan_id: string
  ncaa_submission_ref: string
  nest_id: string
  nest_name: string
  site_id: string
  site_name: string
  drone_id: string
  drone_serial: string
  platform: 'P1' | 'P2'
  operator_name: string
  cargo_type: CargoType
  payload_kg: number
  status: FlightStatus
  dispatched_at: string | null
  eta: string | null
  weather_status: WeatherOpsStatus
  kfz_conflicts: string[]
  current_lat: number | null
  current_lng: number | null
  current_alt_m: number | null
}

export interface WeatherObservation {
  obs_id: string
  nest_id: string
  nest_name: string
  observed_at: string
  source: 'nimet_api' | 'openweather'
  wind_speed_mps: number
  wind_dir_deg: number
  wind_gust_mps: number
  precipitation_mm: number
  visibility_km: number
  cloud_base_m: number
  temp_c: number
  humidity_pct: number
  harmattan_index: number
  ops_status: WeatherOpsStatus
}

export interface WeatherThresholds {
  wind_speed_max_mps: number
  wind_gust_max_mps: number
  precipitation_max_mm: number
  visibility_min_km: number
  cloud_base_min_m: number
  harmattan_index_max: number
}

export interface WeatherState {
  observations: WeatherObservation[]
  thresholds: WeatherThresholds
}

export interface AnalyticsKPIs {
  total_deliveries_mtd: number
  deliveries_today: number
  on_time_rate_pct: number
  active_flights: number
  nests_operational: number
  nests_total: number
  facilities_served: number
  coverage_gap_count: number
}

export interface DailyDelivery { date: string; count: number }
export interface CargoDelivery  { type: string; count: number }

export interface CoverageGap {
  facility_name: string
  state: string
  lga: string
  distance_to_nearest_nest_km: number
  priority_score: number
  in_p1_range: boolean
  in_p2_range: boolean
}

export interface Analytics {
  kpis: AnalyticsKPIs
  deliveries_by_day: DailyDelivery[]
  deliveries_by_cargo: CargoDelivery[]
  coverage_gaps: CoverageGap[]
}

export type DropSiteSurveyStatus = 'approved' | 'pending' | 'rejected'
export type TerrainType = 'flat' | 'gentle_slope' | 'undulating'

export interface DropSite {
  site_id: string
  site_name: string
  facility_id: string
  facility_name: string
  lat: number
  lng: number
  state: string
  lga: string
  survey_status: DropSiteSurveyStatus
  zipline_score: number            // 0–100 composite Zipline suitability
  clearance_radius_m: number       // must be ≥ 10m
  powerline_distance_m: number     // must be ≥ 30m
  obstacle_height_max_m: number    // max obstacle within 50m radius
  population_buffer_m: number      // distance to nearest building
  terrain_slope_deg: number        // < 5° ideal
  canopy_cover_pct: number         // overhead vegetation %
  approach_vectors: number         // clear approach paths (≥ 2)
  kfz_clearance_m: number          // distance to nearest KFZ boundary
  terrain_type: TerrainType
  surveyed_by: string
  surveyed_at: string
  notes: string
}

export type DroneStatus = 'available' | 'in_flight' | 'maintenance' | 'offline'

export interface Drone {
  drone_id: string
  serial: string
  model: string
  platform: 'P1' | 'P2'
  nest_id: string
  nest_name: string
  status: DroneStatus
  battery_pct: number
  flight_hours_total: number
  last_flight: string | null
  ncaa_permit_ref: string
  onsa_euc_ref: string
  payload_capacity_kg: number
  range_km: number
}

export type PermitType = 'ncaa_rpas_operator' | 'ncaa_rpas_nest' | 'onsa_euc' | 'ncaa_flight_ops' | 'state_airspace'
export type PermitStatus = 'active' | 'expired' | 'suspended'

export interface Permit {
  permit_id: string
  permit_type: PermitType
  permit_number: string
  issued_by: string
  entity_name: string
  valid_from: string
  valid_to: string
  status: PermitStatus
  document_url: string | null
}

// ─── OSM POI (real facility data from OpenStreetMap) ─────────────────────
export type OsmPoiType = 'hospital' | 'phc' | 'school' | 'market'

export interface OsmPoi {
  id: string
  name: string
  type: OsmPoiType
  state: string
  city: string
  lat: number
  lng: number
}

export interface QuickDispatchTarget {
  name: string
  lat: number
  lng: number
  suggestedSiteId?: string
}

// ─── Store types ──────────────────────────────────────────────────────────
export type EntityType = 'nest' | 'facility' | 'dropsite' | 'flight' | 'kfz' | null

export interface AppStore {
  nests: Nest[]
  facilities: Facility[]
  kfz: KFZ[]
  flights: Flight[]
  weather: WeatherState | null
  analytics: Analytics | null
  dropSites: DropSite[]
  drones: Drone[]
  permits: Permit[]
  osmPois: OsmPoi[]
  selectedEntityId: string | null
  selectedEntityType: EntityType
  mapCenter: [number, number]
  mapZoom: number
  quickDispatchTarget: QuickDispatchTarget | null
  layerToggles: {
    facilities: boolean
    nests: boolean
    dropSites: boolean
    kfz: boolean
    serviceAreas: boolean
    flightTracks: boolean
    pois: boolean
  }
  mapStyle: 'dark' | 'light'
  setSelected: (id: string | null, type: EntityType) => void
  flyTo: (lat: number, lng: number, zoom?: number) => void
  toggleLayer: (layer: keyof AppStore['layerToggles']) => void
  addFlight: (flight: Flight) => void
  setQuickDispatchTarget: (target: QuickDispatchTarget | null) => void
  setMapStyle: (style: 'dark' | 'light') => void
}
