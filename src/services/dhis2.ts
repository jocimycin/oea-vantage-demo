/**
 * Phase 2 DHIS2 sync stub.
 * Nightly cron calls syncFacilities() → upserts facilities via FastAPI /api/facilities.
 * DHIS2 instance: FMOH Nigeria (hmis.health.gov.ng)
 */

const DHIS2_BASE = 'https://hmis.health.gov.ng/api'

// In Phase 2 this runs server-side (FastAPI background task / Inngest cron).
// Stubbed here for documentation and Phase 1 interface contract.
export async function syncFacilities(): Promise<void> {
  void DHIS2_BASE
  // GET ${DHIS2_BASE}/organisationUnits?fields=id,name,coordinates,organisationUnitGroups[name]&level=4&paging=false
  // Map: id → dhis2_uid, name → facility_name, coordinates → { lat, lng }
  // Derive facility_type from organisationUnitGroups name:
  //   "Hospital" → hospital, "Primary Health Centre" → phc, "Maternity" → maternity
  // Preserve locally-set fields: priority_tier, cold_chain, contact_name, contact_phone
  console.warn('[Phase 2] DHIS2 sync not yet implemented')
}
