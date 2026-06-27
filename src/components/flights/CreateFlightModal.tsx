import { useState, useCallback } from 'react'
import { X, CheckCircle2, AlertTriangle, XCircle, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import circle from '@turf/circle'
import booleanIntersects from '@turf/boolean-intersects'
import distance from '@turf/distance'
import { point, lineString } from '@turf/helpers'
import { useStore } from '../../store'
import { StatusPill } from '../ui/StatusPill'
import { MonoChip } from '../ui/MonoChip'
import { PlatformBadge, CargoBadge } from '../ui/Badge'
import type { Flight, CargoType } from '../../types'

const NCAA_REF_PATTERN = /^NCAA\/FP\/\d{4}\/\d{2}\/\d{4}$/

const CARGO_OPTIONS: { value: CargoType; label: string; icon: string }[] = [
  { value: 'blood',          label: 'Blood Products',   icon: '🩸' },
  { value: 'vaccine',        label: 'Vaccines',         icon: '💉' },
  { value: 'medication',     label: 'Medication',       icon: '💊' },
  { value: 'medical_supply', label: 'Medical Supply',   icon: '🏥' },
  { value: 'market_goods',   label: 'Market Goods',     icon: '📦' },
]

interface Props {
  onClose: () => void
  prefillCargo?: CargoType
  prefillSiteId?: string
}

const STEPS = [
  'Destination',
  'Nest Selection',
  'Route Preview',
  'KFZ Check',
  'Weather Check',
  'Pre-flight',
  'Confirm',
]

export function CreateFlightModal({ onClose, prefillCargo, prefillSiteId }: Props) {
  const { facilities, nests, kfz, weather, dropSites, addFlight } = useStore()

  const [step, setStep] = useState(prefillSiteId ? 1 : 0)
  const [facilityId,  setFacilityId]  = useState(() => {
    if (!prefillSiteId) return ''
    const site = dropSites.find(s => s.site_id === prefillSiteId)
    return site?.facility_id ?? ''
  })
  const [siteId,      setSiteId]      = useState(prefillSiteId ?? '')
  const [cargoType,   setCargoType]   = useState<CargoType>(prefillCargo ?? 'medication')
  const [payloadKg,   setPayloadKg]   = useState(1.5)
  const [nestId,      setNestId]      = useState(() => {
    // Pre-select nearest operational nest when a site is pre-filled
    if (!prefillSiteId) return ''
    const site = dropSites.find(s => s.site_id === prefillSiteId)
    if (!site) return ''
    const sitePoint = point([site.lng, site.lat])
    let nearest = nests.find(n => n.operational) ?? nests[0]
    let minDist = Infinity
    nests.filter(n => n.operational).forEach(n => {
      const d = distance(sitePoint, point([n.lng, n.lat]), { units: 'kilometers' })
      if (d < minDist) { minDist = d; nearest = n }
    })
    return nearest?.nest_id ?? ''
  })
  const [kfzConflicts, setKfzConflicts] = useState<{ name: string; notam: string }[]>([])
  const [ncaaRef,     setNcaaRef]     = useState('')
  const [ncaaError,   setNcaaError]   = useState('')
  const [checklist,   setChecklist]   = useState({
    battery:     false,
    payload:     false,
    siteManager: false,
    ncaaFiled:   false,
    onsa:        false,
  })

  const selectedSite     = dropSites.find(s => s.site_id === siteId)
  const selectedNest     = nests.find(n => n.nest_id === nestId)
  const nestWeather      = weather?.observations.find(o => o.nest_id === nestId)

  // Auto-select nearest nest by Haversine when site is chosen
  const autoSelectNest = useCallback((site: typeof selectedSite) => {
    if (!site) return
    const sitePoint = point([site.lng, site.lat])
    let nearest = nests[0]
    let minDist = Infinity
    nests.filter(n => n.operational).forEach(n => {
      const d = distance(sitePoint, point([n.lng, n.lat]), { units: 'kilometers' })
      if (d < minDist) { minDist = d; nearest = n }
    })
    setNestId(nearest.nest_id)
  }, [nests])

  // KFZ route intersection check
  const runKfzCheck = useCallback(() => {
    if (!selectedNest || !selectedSite) return
    const route = lineString([[selectedNest.lng, selectedNest.lat], [selectedSite.lng, selectedSite.lat]])
    const conflicts: { name: string; notam: string }[] = []
    kfz.filter(z => z.is_active).forEach(z => {
      const zone = circle([z.lng, z.lat], z.radius_km, { units: 'kilometers' })
      if (booleanIntersects(route, zone)) {
        conflicts.push({ name: z.kfz_name, notam: z.notam_ref })
      }
    })
    setKfzConflicts(conflicts)
  }, [selectedNest, selectedSite, kfz])

  const handleNext = () => {
    if (step === 2) runKfzCheck()
    setStep(s => s + 1)
  }
  const handleBack = () => setStep(s => s - 1)

  const canProceed = () => {
    if (step === 0) return !!facilityId && !!siteId && !!cargoType
    if (step === 1) return !!nestId
    if (step === 3) return kfzConflicts.length === 0
    if (step === 4) return nestWeather?.ops_status === 'go' || nestWeather?.ops_status === 'caution'
    if (step === 5) return Object.values(checklist).every(Boolean) && NCAA_REF_PATTERN.test(ncaaRef)
    return true
  }

  const handleDispatch = () => {
    if (!selectedNest || !selectedSite) return
    const now = new Date().toISOString()
    const eta = new Date(Date.now() + 22 * 60 * 1000).toISOString()
    const newFlight: Flight = {
      delivery_id:          `dlv-${Date.now()}`,
      flight_plan_id:       `fp-${Date.now()}`,
      ncaa_submission_ref:  ncaaRef,
      nest_id:              nestId,
      nest_name:            selectedNest.nest_name,
      site_id:              siteId,
      site_name:            selectedSite.site_name,
      drone_id:             'drone-auto',
      drone_serial:         'ZP1-NG-AUTO',
      platform:             selectedNest.platform_types[0],
      operator_name:        'Dispatcher',
      cargo_type:           cargoType,
      payload_kg:           payloadKg,
      status:               'validated',
      dispatched_at:        now,
      eta,
      weather_status:       nestWeather?.ops_status ?? 'go',
      kfz_conflicts:        [],
      current_lat:          null,
      current_lng:          null,
      current_alt_m:        null,
    }
    addFlight(newFlight)
    onClose()
  }

  const sitesForFacility = dropSites.filter(s => s.facility_id === facilityId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-oea-night/95 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl oea-card shadow-2xl fade-in overflow-hidden" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-oea-border flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-oea-white">New Flight Plan</h2>
            <p className="text-xs text-oea-text-muted mt-0.5">{STEPS[step]} — Step {step + 1} of {STEPS.length}</p>
          </div>
          <button onClick={onClose} className="text-oea-text-muted hover:text-oea-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex px-6 py-3 gap-1 border-b border-oea-border flex-shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1 w-full rounded-full transition-colors ${i <= step ? 'bg-oea-blue' : 'bg-oea-border'}`} />
              <span className={`text-[9px] font-medium ${i === step ? 'text-oea-blue-light' : i < step ? 'text-oea-text-muted' : 'text-oea-border'}`}>{s}</span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Step 0: Destination */}
          {step === 0 && (
            <div className="space-y-4 fade-in">
              <div>
                <label className="block text-xs font-semibold text-oea-white mb-2">Destination Facility</label>
                <select
                  value={facilityId}
                  onChange={e => { setFacilityId(e.target.value); setSiteId('') }}
                  className="w-full bg-oea-night border border-oea-border rounded-sm px-3 py-2 text-xs text-oea-text focus:outline-none focus:border-oea-blue"
                >
                  <option value="">— Select facility —</option>
                  {facilities.map(f => (
                    <option key={f.facility_id} value={f.facility_id}>
                      {f.facility_name} ({f.lga}, {f.state})
                    </option>
                  ))}
                </select>
              </div>

              {facilityId && (
                <div className="fade-in">
                  <label className="block text-xs font-semibold text-oea-white mb-2">Drop Site</label>
                  {sitesForFacility.length === 0 ? (
                    <div className="text-xs text-status-nogo bg-status-nogo/10 border border-status-nogo/20 rounded-sm p-3">
                      No approved drop sites for this facility. Submit a survey request first.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sitesForFacility.map(site => (
                        <button
                          key={site.site_id}
                          onClick={() => { setSiteId(site.site_id); autoSelectNest(site) }}
                          className={`w-full text-left p-3 rounded-sm border transition-colors ${siteId === site.site_id ? 'border-oea-blue bg-oea-blue/10' : 'border-oea-border hover:border-oea-blue/50'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-oea-white">{site.site_name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-status-go font-bold">{site.zipline_score}</span>
                              <StatusPill status={site.survey_status} size="sm" />
                            </div>
                          </div>
                          <div className="flex gap-3 text-[10px] text-oea-text-muted">
                            <span>⬤ {site.clearance_radius_m}m clear</span>
                            <span>⚡ {site.powerline_distance_m}m from lines</span>
                            <span>↗ {site.approach_vectors} vectors</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-oea-white mb-2">Cargo Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {CARGO_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setCargoType(c.value)}
                      className={`p-2 rounded-sm border text-center transition-colors ${cargoType === c.value ? 'border-oea-blue bg-oea-blue/10' : 'border-oea-border hover:border-oea-blue/40'}`}
                    >
                      <div className="text-lg">{c.icon}</div>
                      <div className="text-[10px] text-oea-text mt-0.5">{c.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oea-white mb-2">Payload Weight (kg)</label>
                <input
                  type="number"
                  min={0.1}
                  max={4.0}
                  step={0.1}
                  value={payloadKg}
                  onChange={e => setPayloadKg(parseFloat(e.target.value))}
                  className="w-32 bg-oea-night border border-oea-border rounded-sm px-3 py-1.5 text-xs text-oea-text focus:outline-none focus:border-oea-blue font-mono"
                />
                <span className="text-[10px] text-oea-text-muted ml-2">max 4.0 kg (P1), 1.75 kg (P2)</span>
              </div>
            </div>
          )}

          {/* Step 1: Nest Selection */}
          {step === 1 && (
            <div className="space-y-3 fade-in">
              <p className="text-xs text-oea-text-muted">
                System has auto-selected the nearest eligible nest. You may override below.
              </p>
              {nests.filter(n => n.operational).map(n => {
                const sitePoint = selectedSite ? point([selectedSite.lng, selectedSite.lat]) : null
                const dist = sitePoint ? distance(sitePoint, point([n.lng, n.lat]), { units: 'kilometers' }).toFixed(1) : '—'
                return (
                  <button
                    key={n.nest_id}
                    onClick={() => setNestId(n.nest_id)}
                    className={`w-full text-left p-3 rounded-sm border transition-colors ${nestId === n.nest_id ? 'border-oea-blue bg-oea-blue/10' : 'border-oea-border hover:border-oea-blue/40'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-oea-white">{n.nest_name}</span>
                      {nestId === n.nest_id && <span className="text-[10px] text-oea-blue-light font-bold">AUTO-SELECTED</span>}
                    </div>
                    <div className="flex gap-3 text-[10px] text-oea-text-muted">
                      <span>{n.lga}, {n.state}</span>
                      <span className="text-status-info font-mono">{dist} km away</span>
                      {n.platform_types.map(p => <PlatformBadge key={p} platform={p} />)}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2: Route Preview */}
          {step === 2 && selectedNest && selectedSite && (
            <div className="fade-in space-y-3">
              <p className="text-xs text-oea-text-muted">Straight-line route preview. Phase 2 will show 3D waypoint routing from the API.</p>
              <div className="bg-oea-night border border-oea-border rounded-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-oea-blue" />
                  <span className="text-xs text-oea-white font-semibold">{selectedNest.nest_name}</span>
                </div>
                <div className="flex items-center gap-2 ml-[5px]">
                  <div className="w-0.5 h-12 bg-oea-blue/40 border-r border-dashed border-oea-blue/60" />
                  <div className="ml-2 text-[10px] text-oea-text-muted">
                    <div>Distance: <span className="text-oea-white font-mono">
                      {distance(point([selectedNest.lng, selectedNest.lat]), point([selectedSite.lng, selectedSite.lat]), { units: 'kilometers' }).toFixed(1)} km
                    </span></div>
                    <div>Estimated flight time: <span className="text-oea-white font-mono">~{
                      Math.round(distance(point([selectedNest.lng, selectedNest.lat]), point([selectedSite.lng, selectedSite.lat]), { units: 'kilometers' }) * 1.4)
                    } min</span></div>
                    <div>Platform: <PlatformBadge platform={selectedNest.platform_types[0]} /></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-0">
                  <div className="h-2.5 w-2.5 rounded-full bg-status-caution" />
                  <span className="text-xs text-oea-white font-semibold">{selectedSite.site_name}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  ['Origin',      selectedNest.nest_name],
                  ['Destination', selectedSite.site_name],
                  ['Cargo',       cargoType.replace('_', ' ')],
                  ['Payload',     `${payloadKg} kg`],
                ].map(([label, val]) => (
                  <div key={label} className="bg-oea-night border border-oea-border rounded-sm p-2">
                    <div className="text-oea-text-muted">{label}</div>
                    <div className="text-oea-white font-medium mt-0.5">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: KFZ Check */}
          {step === 3 && (
            <div className="fade-in space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-oea-white">Keep-Out Zone Intersection Check</span>
                <MonoChip>{kfz.filter(z => z.is_active).length} zones scanned</MonoChip>
              </div>

              {kfzConflicts.length === 0 ? (
                <div className="flex items-start gap-3 bg-status-go/10 border border-status-go/20 rounded-sm p-4">
                  <CheckCircle2 size={18} className="text-status-go flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-status-go">No conflicts detected</div>
                    <div className="text-xs text-oea-text-muted mt-0.5">
                      Route does not intersect any active KFZ. Cleared to proceed.
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-3 bg-status-nogo/10 border border-status-nogo/20 rounded-sm p-4 mb-3">
                    <XCircle size={18} className="text-status-nogo flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-status-nogo">{kfzConflicts.length} KFZ conflict{kfzConflicts.length > 1 ? 's' : ''} detected</div>
                      <div className="text-xs text-oea-text-muted mt-0.5">Route must be rerouted or this flight plan cannot be filed.</div>
                    </div>
                  </div>
                  {kfzConflicts.map((c, i) => (
                    <div key={i} className="border border-status-nogo/30 rounded-sm p-3 mb-2">
                      <div className="text-xs font-semibold text-oea-white">{c.name}</div>
                      <MonoChip className="mt-1">{c.notam}</MonoChip>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-oea-text-muted">
                Using turf.js booleanIntersects() against route bounding buffer. Phase 2 will use PostGIS ST_Intersects() via /api/kfz/check.
              </p>
            </div>
          )}

          {/* Step 4: Weather Check */}
          {step === 4 && nestWeather && (
            <div className="fade-in space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-oea-white">Weather at {selectedNest?.nest_name}</span>
                <span className="text-[10px] text-oea-text-muted font-mono">{nestWeather.source}</span>
              </div>

              <div className={`rounded-sm border p-4 ${
                nestWeather.ops_status === 'go'     ? 'bg-status-go/10 border-status-go/30' :
                nestWeather.ops_status === 'caution'? 'bg-status-caution/10 border-status-caution/30' :
                                                      'bg-status-nogo/10 border-status-nogo/30'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {nestWeather.ops_status === 'no_fly'
                    ? <XCircle size={18} className="text-status-nogo" />
                    : nestWeather.ops_status === 'caution'
                    ? <AlertTriangle size={18} className="text-status-caution" />
                    : <CheckCircle2 size={18} className="text-status-go" />
                  }
                  <StatusPill status={nestWeather.ops_status} />
                </div>

                {nestWeather.ops_status === 'no_fly' && (
                  <div className="text-xs text-status-nogo mb-3 font-semibold">
                    Dispatch blocked — weather conditions outside flight envelope.
                  </div>
                )}
                {nestWeather.ops_status === 'caution' && (
                  <div className="text-xs text-status-caution mb-3">
                    ⚠️ Advisory conditions. Supervisor confirmation required before dispatch.
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  {[
                    ['Wind',        `${nestWeather.wind_speed_mps.toFixed(1)} m/s`, nestWeather.wind_speed_mps > 10],
                    ['Gusts',       `${nestWeather.wind_gust_mps.toFixed(1)} m/s`,  nestWeather.wind_gust_mps > 14],
                    ['Precip',      `${nestWeather.precipitation_mm.toFixed(1)} mm`, nestWeather.precipitation_mm > 1],
                    ['Visibility',  `${nestWeather.visibility_km.toFixed(1)} km`,   nestWeather.visibility_km < 3],
                    ['Cloud Base',  `${nestWeather.cloud_base_m}m`,                 nestWeather.cloud_base_m < 300],
                    ['Humidity',    `${nestWeather.humidity_pct}%`,                 false],
                  ].map(([label, val, fail]) => (
                    <div key={label as string} className="bg-oea-surface/50 rounded-sm p-2">
                      <div className="text-oea-text-muted">{label}</div>
                      <div className={`font-mono font-bold mt-0.5 ${fail ? 'text-status-nogo' : 'text-oea-white'}`}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Pre-flight Checklist */}
          {step === 5 && (
            <div className="fade-in space-y-4">
              <p className="text-xs text-oea-text-muted">Complete all items before dispatch.</p>

              <div className="space-y-2">
                {([
                  ['battery',     'Drone battery > 80%'],
                  ['payload',     'Payload weight within platform limit'],
                  ['siteManager', 'Drop site confirmed with Site Manager'],
                  ['onsa',        'ONSA clearance confirmed active'],
                ] as [keyof typeof checklist, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 p-3 rounded-sm border border-oea-border hover:border-oea-blue/40 cursor-pointer transition-colors">
                    <div
                      onClick={() => setChecklist(c => ({ ...c, [key]: !c[key] }))}
                      className={`h-4 w-4 rounded-sm border flex items-center justify-center flex-shrink-0 transition-colors ${
                        checklist[key] ? 'bg-oea-blue border-oea-blue' : 'border-oea-border bg-oea-night'
                      }`}
                    >
                      {checklist[key] && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-xs text-oea-text">{label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-oea-white mb-1">NCAA Flight Plan Submission Reference</label>
                <input
                  type="text"
                  value={ncaaRef}
                  onChange={e => {
                    setNcaaRef(e.target.value)
                    setNcaaError(NCAA_REF_PATTERN.test(e.target.value) ? '' : 'Format: NCAA/FP/YYYY/MM/NNNN')
                  }}
                  placeholder="NCAA/FP/2026/06/0001"
                  className={`font-mono w-full bg-oea-mono-bg border rounded-sm px-3 py-2 text-xs text-oea-text focus:outline-none ${
                    ncaaError ? 'border-status-nogo' : ncaaRef && !ncaaError ? 'border-status-go' : 'border-oea-border focus:border-oea-blue'
                  }`}
                />
                {ncaaError && <p className="text-[10px] text-status-nogo mt-1">{ncaaError}</p>}
                <p className="text-[10px] text-oea-text-muted mt-1">
                  File at NCAA AIS portal before dispatch. Pattern: NCAA/FP/YYYY/MM/NNNN
                </p>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-sm border border-oea-border hover:border-oea-blue/40 cursor-pointer">
                <div
                  onClick={() => setChecklist(c => ({ ...c, ncaaFiled: !c.ncaaFiled }))}
                  className={`h-4 w-4 rounded-sm border flex items-center justify-center flex-shrink-0 transition-colors ${
                    checklist.ncaaFiled ? 'bg-oea-blue border-oea-blue' : 'border-oea-border bg-oea-night'
                  }`}
                >
                  {checklist.ncaaFiled && <Check size={10} className="text-white" />}
                </div>
                <span className="text-xs text-oea-text">NCAA flight plan filed — submission ref confirmed above</span>
              </label>
            </div>
          )}

          {/* Step 6: Confirm Dispatch */}
          {step === 6 && (
            <div className="fade-in space-y-4">
              <div className="flex items-center gap-3 bg-oea-blue/10 border border-oea-blue/30 rounded-sm p-4">
                <CheckCircle2 size={20} className="text-oea-blue-light flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-oea-white">Ready to dispatch</div>
                  <div className="text-xs text-oea-text-muted mt-0.5">All checks passed. Review summary below.</div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  ['NCAA Ref',     <MonoChip>{ncaaRef}</MonoChip>],
                  ['Nest',         selectedNest?.nest_name],
                  ['Destination',  selectedSite?.site_name],
                  ['Cargo',        <CargoBadge type={cargoType} />],
                  ['Payload',      `${payloadKg} kg`],
                  ['Platform',     <PlatformBadge platform={selectedNest?.platform_types[0] ?? 'P1'} />],
                  ['Weather',      <StatusPill status={nestWeather?.ops_status ?? 'go'} size="sm" />],
                  ['KFZ Status',   <span className="text-status-go font-semibold">✓ Clear</span>],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex items-center justify-between border-b border-oea-border pb-2">
                    <span className="text-oea-text-muted">{label}</span>
                    <div>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-oea-border flex-shrink-0">
          <button
            onClick={step === 0 ? onClose : handleBack}
            className="oea-btn-ghost flex items-center gap-1.5 text-xs"
          >
            <ChevronLeft size={13} /> {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`oea-btn flex items-center gap-1.5 text-xs ${!canProceed() ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              Next <ChevronRight size={13} />
            </button>
          ) : (
            <button
              onClick={handleDispatch}
              className="oea-btn flex items-center gap-1.5 text-xs bg-status-go hover:bg-status-go/90 px-6"
            >
              <CheckCircle2 size={13} /> Confirm Dispatch
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
