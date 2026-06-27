import { Home, Cpu } from 'lucide-react'
import { useStore } from '../store'
import { StatusPill } from '../components/ui/StatusPill'
import { MonoChip } from '../components/ui/MonoChip'
import { PlatformBadge } from '../components/ui/Badge'
import { MapCanvas } from '../components/map/MapCanvas'

export function Nests() {
  const { nests, drones, flights, flyTo } = useStore()

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* Left: Nest list */}
      <div className="w-96 flex flex-col border-r border-oea-border overflow-hidden flex-shrink-0">
        <div className="px-5 py-4 border-b border-oea-border flex-shrink-0">
          <h1 className="text-sm font-bold text-oea-white">Nest Management</h1>
          <p className="text-xs text-oea-text-muted mt-0.5">{nests.filter(n=>n.operational).length} of {nests.length} operational</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-oea-border">
          {nests.map(nest => {
            const nestDrones = drones.filter(d => d.nest_id === nest.nest_id)
            const activeFlights = flights.filter(f => f.nest_id === nest.nest_id && f.status === 'in_flight')
            const availableDrones = nestDrones.filter(d => d.status === 'available')

            return (
              <div
                key={nest.nest_id}
                className="p-5 cursor-pointer hover:bg-oea-border/20 transition-colors"
                onClick={() => flyTo(nest.lat, nest.lng, 11)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 flex-shrink-0 flex items-center justify-center"
                      style={{ background: '#1574b6', clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)', opacity: nest.operational ? 1 : 0.4 }}>
                      <Home size={12} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-oea-white truncate">{nest.nest_name}</div>
                      <div className="text-[10px] text-oea-text-muted">{nest.lga}, {nest.state}</div>
                    </div>
                  </div>
                  <StatusPill status={nest.operational ? 'operational' : 'offline'} size="sm" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-oea-night border border-oea-border rounded-sm p-2 text-center">
                    <div className="text-lg font-black font-mono text-oea-white">{availableDrones.length}</div>
                    <div className="text-[9px] text-oea-text-muted">Available</div>
                  </div>
                  <div className="bg-oea-night border border-oea-border rounded-sm p-2 text-center">
                    <div className="text-lg font-black font-mono text-status-info">{activeFlights.length}</div>
                    <div className="text-[9px] text-oea-text-muted">In Flight</div>
                  </div>
                  <div className="bg-oea-night border border-oea-border rounded-sm p-2 text-center">
                    <div className="text-lg font-black font-mono text-oea-white">{nestDrones.length}</div>
                    <div className="text-[9px] text-oea-text-muted">Total Fleet</div>
                  </div>
                </div>

                {/* Platform types */}
                <div className="flex items-center gap-2 mb-2">
                  {nest.platform_types.map(p => <PlatformBadge key={p} platform={p} />)}
                  <span className="text-[10px] text-oea-text-muted">·</span>
                  <span className="text-[10px] text-oea-text-muted">P1 {nest.service_radius_p1_km}km</span>
                  {nest.service_radius_p2_km && <span className="text-[10px] text-oea-text-muted">· P2 {nest.service_radius_p2_km}km</span>}
                </div>

                {/* Permits */}
                <div className="space-y-1">
                  <MonoChip>{nest.ncaa_permit_ref}</MonoChip>
                  {nest.onsa_clearance_ref && <MonoChip className="ml-1">{nest.onsa_clearance_ref}</MonoChip>}
                </div>

                {/* Fleet preview */}
                {nestDrones.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {nestDrones.slice(0, 6).map(d => (
                      <div key={d.drone_id} className="flex items-center gap-1 bg-oea-night border border-oea-border rounded-sm px-2 py-0.5">
                        <Cpu size={9} className={
                          d.status === 'available'   ? 'text-status-go' :
                          d.status === 'in_flight'   ? 'text-oea-blue-light' :
                          d.status === 'maintenance' ? 'text-status-caution' : 'text-status-nogo'
                        } />
                        <span className="font-mono text-[9px] text-oea-text">{d.serial}</span>
                        <span className="text-[9px] text-oea-text-muted">{d.battery_pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: Map */}
      <div style={{ flex:'1 1 0', position:'relative', minWidth:0, minHeight:0, overflow:'hidden' }}>
        <MapCanvas showPopups />
      </div>
    </div>
  )
}
