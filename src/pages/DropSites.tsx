import { useState } from 'react'
import { MapPin, Search, CheckCircle2 } from 'lucide-react'
import { useStore } from '../store'
import { StatusPill } from '../components/ui/StatusPill'
import { MapCanvas } from '../components/map/MapCanvas'

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-status-go' : score >= 70 ? 'bg-status-caution' : 'bg-status-nogo'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 bg-oea-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`font-mono font-bold text-xs ${score >= 85 ? 'text-status-go' : score >= 70 ? 'text-status-caution' : 'text-status-nogo'}`}>{score}</span>
    </div>
  )
}

export function DropSites() {
  const { dropSites, flyTo } = useStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<typeof dropSites[0] | null>(null)

  const filtered = dropSites.filter(s => {
    const q = search.toLowerCase()
    return !q || s.site_name.toLowerCase().includes(q) || s.facility_name.toLowerCase().includes(q) || s.lga.toLowerCase().includes(q)
  })

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* Left: table + detail */}
      <div className="w-[55%] flex flex-col border-r border-oea-border overflow-hidden">
        <div className="px-5 py-3 border-b border-oea-border flex-shrink-0">
          <h1 className="text-sm font-bold text-oea-white">Drop Site Manager</h1>
          <p className="text-xs text-oea-text-muted mt-0.5">Zipline suitability criteria · {dropSites.filter(s=>s.survey_status==='approved').length} approved of {dropSites.length}</p>
        </div>

        <div className="px-5 py-2 border-b border-oea-border flex-shrink-0">
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-oea-text-muted" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search sites, facilities, LGA..."
              className="w-full bg-oea-night border border-oea-border rounded-sm pl-7 pr-3 py-1.5 text-[11px] text-oea-text placeholder:text-oea-text-muted focus:outline-none focus:border-oea-blue"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-oea-border">
          {filtered.map(s => (
            <div
              key={s.site_id}
              onClick={() => { setSelected(s); flyTo(s.lat, s.lng, 14) }}
              className={`p-4 cursor-pointer hover:bg-oea-border/20 transition-colors ${selected?.site_id === s.site_id ? 'bg-oea-blue/5' : ''}`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin size={12} className="text-status-caution flex-shrink-0" />
                  <span className="text-xs font-semibold text-oea-white truncate">{s.site_name}</span>
                </div>
                <StatusPill status={s.survey_status} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-oea-text-muted">{s.facility_name} · {s.lga}</span>
                <ScoreBar score={s.zipline_score} />
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="border-t border-oea-border bg-oea-surface p-4 flex-shrink-0 slide-in">
            <div className="text-xs font-bold text-oea-white mb-3">{selected.site_name}</div>
            <div className="mb-2">
              <div className="text-[10px] font-bold text-oea-text-muted uppercase tracking-wider mb-2">Zipline Suitability Criteria</div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {[
                  ['Clearance Radius',    `${selected.clearance_radius_m}m`, selected.clearance_radius_m >= 10],
                  ['Powerline Distance',  `${selected.powerline_distance_m}m`, selected.powerline_distance_m >= 30],
                  ['Max Obstacle Height', `${selected.obstacle_height_max_m}m`, selected.obstacle_height_max_m <= 5],
                  ['Population Buffer',   `${selected.population_buffer_m}m`, selected.population_buffer_m >= 20],
                  ['Terrain Slope',       `${selected.terrain_slope_deg}°`, selected.terrain_slope_deg <= 5],
                  ['Canopy Cover',        `${selected.canopy_cover_pct}%`, selected.canopy_cover_pct <= 15],
                  ['Approach Vectors',    `${selected.approach_vectors}`, selected.approach_vectors >= 2],
                  ['KFZ Clearance',       `${(selected.kfz_clearance_m / 1000).toFixed(1)}km`, selected.kfz_clearance_m >= 1000],
                ].map(([label, val, pass]) => (
                  <div key={label as string} className="flex items-center justify-between bg-oea-night border border-oea-border rounded-sm px-2.5 py-1.5">
                    <span className="text-oea-text-muted">{label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={pass ? 'text-oea-white font-mono' : 'text-status-nogo font-mono'}>{val}</span>
                      <CheckCircle2 size={10} className={pass ? 'text-status-go' : 'text-status-nogo'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-oea-text-muted bg-oea-night border border-oea-border rounded-sm p-2">
              <span className="text-oea-text-muted font-semibold">Notes: </span>{selected.notes}
            </div>
          </div>
        )}
      </div>

      {/* Right: map */}
      <div style={{ flex:'1 1 0', position:'relative', minWidth:0, minHeight:0, overflow:'hidden' }}>
        <MapCanvas showPopups />
      </div>
    </div>
  )
}
