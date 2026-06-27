import { Bell, User, Search, Cross, School, ShoppingBag, Building2 } from 'lucide-react'
import { WeatherPill } from '../weather/WeatherPill'
import { useStore } from '../../store'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { OsmPoiType } from '../../types'

const NAV_INDEX = [
  { label: 'Dashboard — Live Operations',           path: '/dashboard'  },
  { label: 'Flights — Flight Plans',                path: '/flights'    },
  { label: 'Facilities — Health Facility Registry', path: '/facilities' },
  { label: 'Drop Sites — Site Manager',             path: '/drop-sites' },
  { label: 'Nests — Nest Management',               path: '/nests'      },
  { label: 'Airspace — KFZ Registry',               path: '/airspace'   },
  { label: 'Weather — NiMet Dashboard',             path: '/weather'    },
  { label: 'Fleet — Drone Registry',                path: '/fleet'      },
  { label: 'Analytics — Coverage & KPIs',           path: '/analytics'  },
  { label: 'Permits — NCAA/ONSA Permit Registry',   path: '/permits'    },
]

const POI_ICON: Record<OsmPoiType, typeof Cross> = {
  hospital: Cross,
  phc:      Cross,
  school:   School,
  market:   ShoppingBag,
}

const POI_COLOR: Record<OsmPoiType, string> = {
  hospital: '#e8394a',
  phc:      '#00c97a',
  school:   '#f5a623',
  market:   '#b27cff',
}

export function Topbar() {
  const { flights, osmPois, flyTo, setQuickDispatchTarget } = useStore()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const activeCount = flights.filter((f) => f.status === 'in_flight').length

  const q = query.toLowerCase().trim()

  const filteredNav = useMemo(() =>
    q ? NAV_INDEX.filter(item => item.label.toLowerCase().includes(q)) : NAV_INDEX
  , [q])

  const filteredPois = useMemo(() => {
    if (!q || q.length < 2) return []
    return osmPois
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)  ||
        p.state.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [q, osmPois])

  const hasResults = filteredNav.length > 0 || filteredPois.length > 0

  const handlePoiSelect = (poi: typeof osmPois[0]) => {
    flyTo(poi.lat, poi.lng, 14)
    setQuickDispatchTarget({ name: poi.name, lat: poi.lat, lng: poi.lng })
    setQuery('')
    setSearchOpen(false)
    navigate('/dashboard')
  }

  return (
    <header className="flex items-center justify-between bg-oea-surface border-b border-oea-border px-4 flex-shrink-0" style={{ height: 48 }}>
      {/* Wordmark */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <svg width="28" height="28" viewBox="0 0 28 28">
          <polygon points="14,2 24,8 24,20 14,26 4,20 4,8" fill="#102030" stroke="#1574b6" strokeWidth="1.5"/>
          <text x="14" y="18" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Inter" fill="#1574b6">OEA</text>
        </svg>
        <div className="border-l border-oea-blue pl-3">
          <div className="text-white text-[13px] font-semibold leading-none">OEA Vantage</div>
          <div className="text-oea-text-muted text-[10px] leading-none mt-0.5 tracking-wide">Drone Ops Intelligence Module</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mx-8 flex-1 max-w-md">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-oea-text-muted" />
          <input
            type="text"
            placeholder="Search hospitals, markets, schools, nests…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(e.target.value.length > 0) }}
            onFocus={() => { if (query.length > 0) setSearchOpen(true) }}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            className="w-full bg-oea-night border border-oea-border rounded-sm pl-9 pr-3 py-1.5 text-xs text-oea-text placeholder:text-oea-text-muted focus:outline-none focus:border-oea-blue transition-colors"
          />
        </div>

        {searchOpen && hasResults && (
          <div className="absolute top-full left-0 right-0 mt-1 oea-card z-50 shadow-2xl fade-in overflow-hidden max-h-80 overflow-y-auto">
            {/* POI results first when typed */}
            {filteredPois.length > 0 && (
              <>
                <div className="px-3 py-1.5 border-b border-oea-border">
                  <span className="text-[9px] font-bold text-oea-text-muted uppercase tracking-widest">Facilities & Venues ({filteredPois.length})</span>
                </div>
                {filteredPois.map((poi) => {
                  const Icon = POI_ICON[poi.type] ?? Building2
                  const color = POI_COLOR[poi.type] ?? '#888'
                  return (
                    <button
                      key={poi.id}
                      onMouseDown={() => handlePoiSelect(poi)}
                      className="w-full text-left px-3 py-2 hover:bg-oea-border/40 hover:text-oea-white transition-colors flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: `${color}22` }}>
                        <Icon size={12} style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] text-oea-white font-medium truncate">{poi.name}</div>
                        <div className="text-[9px] text-oea-text-muted">{poi.city} · {poi.state} · {poi.type}</div>
                      </div>
                      <div className="ml-auto text-[9px] text-oea-blue-light flex-shrink-0">Dispatch ↗</div>
                    </button>
                  )
                })}
              </>
            )}

            {/* Navigation results */}
            {filteredNav.length > 0 && (
              <>
                {filteredPois.length > 0 && (
                  <div className="px-3 py-1.5 border-t border-b border-oea-border">
                    <span className="text-[9px] font-bold text-oea-text-muted uppercase tracking-widest">Navigation</span>
                  </div>
                )}
                {filteredNav.map((item) => (
                  <button
                    key={item.path}
                    onMouseDown={() => { navigate(item.path); setQuery(''); setSearchOpen(false) }}
                    className="w-full text-left px-4 py-2 text-xs text-oea-text hover:bg-oea-border/40 hover:text-oea-white transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <WeatherPill />

        <div className="relative">
          <Bell size={16} className="text-oea-text-muted hover:text-oea-white cursor-pointer transition-colors" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-oea-blue text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>

        <button className="flex items-center gap-2 rounded-sm border border-oea-border bg-oea-night px-2.5 py-1 hover:border-oea-blue/50 transition-colors">
          <div className="h-5 w-5 rounded-full bg-oea-blue flex items-center justify-center">
            <User size={11} className="text-white" />
          </div>
          <span className="text-xs text-oea-text">Dispatcher</span>
        </button>
      </div>
    </header>
  )
}
