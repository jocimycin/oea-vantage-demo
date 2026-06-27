import { useState } from 'react'
import { useStore } from '../store'
import { MapCanvas } from '../components/map/MapCanvas'
import { StatusPill } from '../components/ui/StatusPill'
import { CargoBadge, PlatformBadge } from '../components/ui/Badge'
import { MonoChip } from '../components/ui/MonoChip'
import { CreateFlightModal } from '../components/flights/CreateFlightModal'
import { Plane, Package, Clock, AlertTriangle, Plus, X, Zap, MapPin } from 'lucide-react'
import type { CargoType, Flight } from '../types'

const CARGO_ICONS: Record<CargoType, string> = {
  blood:          '🩸',
  vaccine:        '💉',
  medication:     '💊',
  medical_supply: '🏥',
  market_goods:   '📦',
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function Dashboard() {
  const { flights, setSelected, flyTo, quickDispatchTarget, setQuickDispatchTarget, dropSites } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [prefillSiteId, setPrefillSiteId] = useState<string | undefined>()

  const activeFlight = flights.filter(f => f.status === 'in_flight')
  const pendingFlights = flights.filter(f => f.status === 'validated' || f.status === 'pending')
  const recentFlights = flights.filter(f => f.status === 'completed' || f.status === 'aborted')

  const handleFlightClick = (deliveryId: string, lat: number | null, lng: number | null) => {
    setSelected(deliveryId, 'flight')
    if (lat && lng) flyTo(lat, lng, 12)
  }

  const handleQuickDispatch = () => {
    if (quickDispatchTarget?.suggestedSiteId) setPrefillSiteId(quickDispatchTarget.suggestedSiteId)
    setModalOpen(true)
  }

  const suggestedSite = quickDispatchTarget?.suggestedSiteId
    ? dropSites.find(s => s.site_id === quickDispatchTarget.suggestedSiteId)
    : null

  return (
    <>
    {modalOpen && (
      <CreateFlightModal
        onClose={() => { setModalOpen(false); setPrefillSiteId(undefined) }}
        prefillCargo="blood"
        prefillSiteId={prefillSiteId}
      />
    )}
    <div style={{ display:'flex', width:'100%', height:'100%', overflow:'hidden' }}>
      {/* ── Map Canvas ── */}
      <div style={{ flex:'1 1 0', position:'relative', overflow:'hidden', minWidth:0, minHeight:0 }}>
        <MapCanvas showPopups />
      </div>

      {/* ── Flights Sidebar ── */}
      <div className="w-80 flex-shrink-0 bg-oea-surface border-l border-oea-border flex flex-col overflow-hidden">
        {/* Quick Dispatch Banner */}
        {quickDispatchTarget && (
          <div className="flex-shrink-0 border-b border-oea-blue/30 bg-oea-blue/10 px-3 py-2.5 slide-in">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin size={12} className="text-oea-blue-light flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-oea-white truncate">{quickDispatchTarget.name}</div>
                  {suggestedSite && (
                    <div className="text-[9px] text-oea-text-muted mt-0.5">
                      Nearest site: {suggestedSite.site_name} · Score {suggestedSite.zipline_score}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setQuickDispatchTarget(null)} className="text-oea-text-muted hover:text-oea-white flex-shrink-0">
                <X size={12} />
              </button>
            </div>
            <button
              onClick={handleQuickDispatch}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-[11px] font-bold text-white rounded-sm transition-colors"
              style={{ background:'#1574b6' }}
            >
              <Zap size={11} /> Dispatch Blood Delivery
            </button>
          </div>
        )}

        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-oea-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Plane size={14} className="text-oea-blue-light" />
            <span className="text-sm font-semibold text-oea-white">Active Flights</span>
            <span className="bg-oea-blue text-white text-[10px] font-bold rounded-sm px-1.5 py-0.5 font-mono">
              {activeFlight.length}
            </span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="oea-btn flex items-center gap-1 text-[11px] py-1 px-2.5"
          >
            <Plus size={11} /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* In-flight section */}
          {activeFlight.length > 0 && (
            <div>
              <div className="px-4 py-2 border-b border-oea-border bg-oea-blue/5">
                <span className="text-[10px] font-bold text-oea-blue-light uppercase tracking-widest">In Flight</span>
              </div>
              {activeFlight.map(f => (
                <FlightCard
                  key={f.delivery_id}
                  flight={f}
                  onClick={() => handleFlightClick(f.delivery_id, f.current_lat, f.current_lng)}
                />
              ))}
            </div>
          )}

          {/* Validated / Pending */}
          {pendingFlights.length > 0 && (
            <div>
              <div className="px-4 py-2 border-b border-oea-border bg-oea-night/50">
                <span className="text-[10px] font-bold text-oea-text-muted uppercase tracking-widest">Queued</span>
              </div>
              {pendingFlights.map(f => (
                <FlightCard
                  key={f.delivery_id}
                  flight={f}
                  onClick={() => handleFlightClick(f.delivery_id, null, null)}
                />
              ))}
            </div>
          )}

          {/* Recent */}
          {recentFlights.length > 0 && (
            <div>
              <div className="px-4 py-2 border-b border-oea-border bg-oea-night/50">
                <span className="text-[10px] font-bold text-oea-text-muted uppercase tracking-widest">Recent</span>
              </div>
              {recentFlights.map(f => (
                <FlightCard
                  key={f.delivery_id}
                  flight={f}
                  onClick={() => handleFlightClick(f.delivery_id, null, null)}
                />
              ))}
            </div>
          )}

          {flights.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-oea-text-muted text-xs">
              <Plane size={24} className="mb-2 opacity-30" />
              No flights today
            </div>
          )}
        </div>

        {/* Sidebar footer — quick stats */}
        <div className="border-t border-oea-border p-3 flex-shrink-0 grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-[10px] text-oea-text-muted mb-0.5">Today</div>
            <div className="text-sm font-bold text-oea-white font-mono">23</div>
          </div>
          <div className="text-center border-x border-oea-border">
            <div className="text-[10px] text-oea-text-muted mb-0.5">On-Time</div>
            <div className="text-sm font-bold text-status-go font-mono">94.2%</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-oea-text-muted mb-0.5">MTD</div>
            <div className="text-sm font-bold text-oea-white font-mono">847</div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

function FlightCard({ flight, onClick }: { flight: Flight; onClick: () => void }) {
  const isActive = flight.status === 'in_flight'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-oea-border hover:bg-oea-border/20 transition-colors ${isActive ? 'bg-oea-blue/5' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base leading-none">{CARGO_ICONS[flight.cargo_type]}</span>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-oea-white truncate">
              {flight.site_name.split('—')[0].trim()}
            </div>
            <MonoChip className="mt-0.5">{flight.drone_serial}</MonoChip>
          </div>
        </div>
        <StatusPill status={flight.status} size="sm" pulse={isActive} />
      </div>

      <div className="flex items-center justify-between mt-2 text-[11px]">
        <div className="flex items-center gap-1 text-oea-text-muted">
          <Package size={10} />
          <CargoBadge type={flight.cargo_type} />
        </div>
        <PlatformBadge platform={flight.platform} />
      </div>

      {(flight.eta || flight.dispatched_at) && (
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-oea-text-muted">
          {flight.dispatched_at && (
            <span className="flex items-center gap-1">
              <Clock size={9} /> {formatTime(flight.dispatched_at)}
            </span>
          )}
          {flight.eta && (
            <span className="flex items-center gap-1 text-oea-blue-light">
              ETA {formatTime(flight.eta)}
            </span>
          )}
          {flight.weather_status !== 'go' && (
            <span className={`flex items-center gap-1 ${flight.weather_status === 'caution' ? 'text-status-caution' : 'text-status-nogo'}`}>
              <AlertTriangle size={9} />
              WX
            </span>
          )}
        </div>
      )}

      {isActive && flight.current_alt_m && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-status-info font-mono">
          ▲ {flight.current_alt_m}m AGL
        </div>
      )}
    </button>
  )
}
