/**
 * Phase 2 API client stub.
 * All methods return mock data via the Zustand store in Phase 1.
 * In Phase 2, replace each method body with a real fetch() to the FastAPI backend.
 *
 * Base URL will be set via VITE_API_URL env var.
 * Auth: JWT in Authorization header (from Supabase Auth session).
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  // Phase 2: return fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${getToken()}` }, ...options }).then(r => r.json())
  void API_BASE; void options
  throw new Error(`[Phase 2] API not yet connected. Path: ${path}`)
}

export const api = {
  // Nests
  getNests:         () => req('/api/nests'),
  getNest:          (id: string) => req(`/api/nests/${id}`),

  // Facilities
  getFacilities:    (params?: Record<string, string>) => req(`/api/facilities?${new URLSearchParams(params)}`),
  getFacility:      (id: string) => req(`/api/facilities/${id}`),
  createFacility:   (body: unknown) => req('/api/facilities', { method: 'POST', body: JSON.stringify(body) }),

  // Drop Sites
  getDropSites:     (params?: Record<string, string>) => req(`/api/drop-sites?${new URLSearchParams(params)}`),
  getDropSite:      (id: string) => req(`/api/drop-sites/${id}`),
  createDropSite:   (body: unknown) => req('/api/drop-sites', { method: 'POST', body: JSON.stringify(body) }),
  approveDropSite:  (id: string) => req(`/api/drop-sites/${id}/approve`, { method: 'PATCH' }),

  // KFZ
  getKFZ:           () => req('/api/kfz'),
  checkKFZ:         (routeGeoJSON: unknown) => req('/api/kfz/check', { method: 'POST', body: JSON.stringify({ route_geojson: routeGeoJSON }) }),

  // Flights
  getFlights:       (params?: Record<string, string>) => req(`/api/flights?${new URLSearchParams(params)}`),
  getFlight:        (id: string) => req(`/api/flights/${id}`),
  createFlight:     (body: unknown) => req('/api/flights', { method: 'POST', body: JSON.stringify(body) }),
  dispatchFlight:   (id: string) => req(`/api/flights/${id}/dispatch`, { method: 'POST' }),

  // Weather
  getWeather:       () => req('/api/weather/current'),

  // Analytics
  getKPIs:          () => req('/api/analytics/kpis'),
  getCoverageGaps:  () => req('/api/analytics/coverage-gaps'),

  // Permits
  getPermits:       () => req('/api/permits'),
}

/**
 * Phase 2 WebSocket telemetry stub.
 * Connect per active delivery. Emits MAVLink-bridged position updates.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function connectTelemetry(deliveryId: string, onPosition: (lat: number, lng: number, alt: number) => void): () => void {
  void onPosition
  // Phase 2: const ws = new WebSocket(`${BASE.replace('http', 'ws')}/ws/telemetry/${deliveryId}`)
  // ws.onmessage = (e) => { const d = JSON.parse(e.data); onPosition(d.lat, d.lng, d.alt_m) }
  // return () => ws.close()
  console.warn('[Phase 2] Telemetry WebSocket not yet connected for delivery', deliveryId)
  return () => {}
}
