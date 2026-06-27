/**
 * Phase 2 Weather service stub.
 * Fetches NiMet (primary) → falls back to OpenWeatherMap.
 * Harmattan index computed from visibility per OEA spec.
 */

export function computeHarmattanIndex(visibility_km: number): number {
  if (visibility_km < 1) return 5
  if (visibility_km < 2) return 4
  if (visibility_km < 4) return 3
  if (visibility_km < 6) return 2
  if (visibility_km < 8) return 1
  return 0
}

export type OpsStatus = 'go' | 'caution' | 'no_fly'

export function evaluateFlightEnvelope(obs: {
  wind_speed_mps: number
  wind_gust_mps: number
  precipitation_mm: number
  visibility_km: number
  cloud_base_m: number
  harmattan_index: number
}): OpsStatus {
  if (
    obs.wind_speed_mps     > 10.0 ||
    obs.wind_gust_mps      > 14.0 ||
    obs.precipitation_mm   > 2.0  ||
    obs.visibility_km      < 2.0  ||
    obs.cloud_base_m       < 200  ||
    obs.harmattan_index    >= 4
  ) return 'no_fly'

  if (
    obs.wind_speed_mps     > 7.0  ||
    obs.wind_gust_mps      > 10.0 ||
    obs.precipitation_mm   > 1.0  ||
    obs.visibility_km      < 3.0  ||
    obs.cloud_base_m       < 300  ||
    obs.harmattan_index    >= 2
  ) return 'caution'

  return 'go'
}

// Phase 2: real fetch implementations below
export async function fetchWeatherForNest(_nestId: string): Promise<void> {
  // Try NiMet → fallback to OpenWeatherMap
  console.warn('[Phase 2] Weather fetch not yet implemented')
}
