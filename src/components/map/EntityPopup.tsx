import { X, MapPin, Home, Building2, Plane, Shield } from 'lucide-react'
import { useStore } from '../../store'
import { StatusPill } from '../ui/StatusPill'
import { MonoChip } from '../ui/MonoChip'
import { FacilityBadge, PlatformBadge, CargoBadge } from '../ui/Badge'

export function EntityPopup() {
  const { selectedEntityId, selectedEntityType, setSelected, nests, facilities, kfz, flights, dropSites } = useStore()
  if (!selectedEntityId || !selectedEntityType) return null

  const handleClose = () => setSelected(null, null)

  return (
    <div className="absolute bottom-8 left-3 z-20 w-72 fade-in slide-in">
      <div className="oea-card shadow-2xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-oea-text-muted hover:text-oea-white transition-colors z-10"
        >
          <X size={14} />
        </button>

        {selectedEntityType === 'nest' && (() => {
          const nest = nests.find(n => n.nest_id === selectedEntityId)
          if (!nest) return null
          return (
            <div>
              <div className="flex items-center gap-2 bg-oea-blue/10 border-b border-oea-border px-4 py-3">
                <Home size={14} className="text-oea-blue-light flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-oea-white truncate">{nest.nest_name}</div>
                  <div className="text-[10px] text-oea-text-muted">{nest.lga}, {nest.state}</div>
                </div>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Status</span>
                  <StatusPill status={nest.operational ? 'operational' : 'offline'} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Platforms</span>
                  <div className="flex gap-1">{nest.platform_types.map(p => <PlatformBadge key={p} platform={p} />)}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Drone Capacity</span>
                  <span className="text-oea-white font-medium">{nest.drone_capacity} units</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-oea-text-muted">NCAA Permit</span>
                  <MonoChip>{nest.ncaa_permit_ref}</MonoChip>
                </div>
              </div>
            </div>
          )
        })()}

        {selectedEntityType === 'facility' && (() => {
          const fac = facilities.find(f => f.facility_id === selectedEntityId)
          if (!fac) return null
          return (
            <div>
              <div className="flex items-center gap-2 bg-status-go/5 border-b border-oea-border px-4 py-3">
                <Building2 size={14} className="text-status-go flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-oea-white truncate">{fac.facility_name}</div>
                  <div className="text-[10px] text-oea-text-muted">{fac.lga}, {fac.state}</div>
                </div>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Type</span>
                  <FacilityBadge type={fac.facility_type} />
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">DHIS2 UID</span>
                  <MonoChip>{fac.dhis2_uid}</MonoChip>
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Cold Chain</span>
                  <span className={fac.cold_chain ? 'text-status-go' : 'text-oea-text-muted'}>{fac.cold_chain ? '✓ Yes' : '✗ No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Contact</span>
                  <span className="text-oea-text">{fac.contact_name}</span>
                </div>
              </div>
            </div>
          )
        })()}

        {selectedEntityType === 'dropsite' && (() => {
          const site = dropSites.find(s => s.site_id === selectedEntityId)
          if (!site) return null
          return (
            <div>
              <div className="flex items-center gap-2 bg-status-caution/5 border-b border-oea-border px-4 py-3">
                <MapPin size={14} className="text-status-caution flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-oea-white truncate">{site.site_name}</div>
                  <div className="text-[10px] text-oea-text-muted">{site.lga}, {site.state}</div>
                </div>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-oea-text-muted">Zipline Score</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-20 bg-oea-border rounded-full overflow-hidden">
                      <div className="h-full bg-status-go rounded-full" style={{ width: `${site.zipline_score}%` }} />
                    </div>
                    <span className="font-mono font-bold text-status-go">{site.zipline_score}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Survey Status</span>
                  <StatusPill status={site.survey_status} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Clearance Radius</span>
                  <span className="text-oea-white font-mono">{site.clearance_radius_m}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Powerline Clear</span>
                  <span className={site.powerline_distance_m >= 30 ? 'text-status-go font-mono' : 'text-status-caution font-mono'}>
                    {site.powerline_distance_m}m
                  </span>
                </div>
              </div>
            </div>
          )
        })()}

        {selectedEntityType === 'flight' && (() => {
          const flight = flights.find(f => f.delivery_id === selectedEntityId)
          if (!flight) return null
          return (
            <div>
              <div className="flex items-center gap-2 bg-oea-blue/10 border-b border-oea-border px-4 py-3">
                <Plane size={14} className="text-oea-blue-light flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-oea-white truncate">{flight.drone_serial}</div>
                  <div className="text-[10px] text-oea-text-muted">{flight.site_name}</div>
                </div>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Status</span>
                  <StatusPill status={flight.status} size="sm" pulse={flight.status === 'in_flight'} />
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Cargo</span>
                  <CargoBadge type={flight.cargo_type} />
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Platform</span>
                  <PlatformBadge platform={flight.platform} />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-oea-text-muted">NCAA Ref</span>
                  <MonoChip>{flight.ncaa_submission_ref}</MonoChip>
                </div>
                {flight.current_alt_m && (
                  <div className="flex justify-between">
                    <span className="text-oea-text-muted">Altitude</span>
                    <span className="font-mono text-status-info">{flight.current_alt_m}m AGL</span>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {selectedEntityType === 'kfz' && (() => {
          const zone = kfz.find(k => k.kfz_id === selectedEntityId)
          if (!zone) return null
          return (
            <div>
              <div className={`flex items-center gap-2 border-b border-oea-border px-4 py-3 ${zone.severity === 'hard_exclusion' ? 'bg-status-nogo/10' : 'bg-status-caution/10'}`}>
                <Shield size={14} className={zone.severity === 'hard_exclusion' ? 'text-status-nogo' : 'text-status-caution'} />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-oea-white truncate">{zone.kfz_name}</div>
                  <MonoChip>{zone.notam_ref}</MonoChip>
                </div>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Authority</span>
                  <span className="font-mono font-bold text-oea-white">{zone.authority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Radius</span>
                  <span className="font-mono text-oea-white">{zone.radius_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Ceiling</span>
                  <span className="font-mono text-oea-white">{zone.altitude_ceiling_m === 9999 ? 'Unlimited' : `${zone.altitude_ceiling_m}m`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-oea-text-muted">Override</span>
                  <span className={zone.override_allowed ? 'text-status-caution' : 'text-status-nogo'}>
                    {zone.override_allowed ? 'Supervisor only' : 'Not permitted'}
                  </span>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
