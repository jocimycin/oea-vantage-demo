import { useState } from 'react'
import { Wind, ChevronDown, X } from 'lucide-react'
import { useStore } from '../../store'
import type { WeatherOpsStatus } from '../../types'

const STATUS_CONFIG: Record<WeatherOpsStatus, { label: string; color: string; bg: string; border: string }> = {
  go:     { label: 'GO',      color: 'text-status-go',      bg: 'bg-status-go/10',      border: 'border-status-go/30' },
  caution:{ label: 'CAUTION', color: 'text-status-caution', bg: 'bg-status-caution/10', border: 'border-status-caution/30' },
  no_fly: { label: 'NO-FLY',  color: 'text-status-nogo',    bg: 'bg-status-nogo/10',    border: 'border-status-nogo/30' },
}

const STATUS_RANK: Record<WeatherOpsStatus, number> = { go: 0, caution: 1, no_fly: 2 }

export function WeatherPill() {
  const [open, setOpen] = useState(false)
  const weather = useStore((s) => s.weather)
  if (!weather) return null

  const { observations } = weather
  const worst = observations.reduce((a, b) =>
    STATUS_RANK[b.ops_status] > STATUS_RANK[a.ops_status] ? b : a
  )
  const cfg = STATUS_CONFIG[worst.ops_status]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${cfg.bg} ${cfg.border} ${cfg.color} hover:brightness-110`}
      >
        <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
          worst.ops_status === 'go' ? 'bg-status-go' : worst.ops_status === 'caution' ? 'bg-status-caution' : 'bg-status-nogo'
        } ${worst.ops_status === 'no_fly' ? 'animate-ping-slow' : ''}`} />
        <Wind size={12} />
        <span className="font-mono tracking-wider">{cfg.label}</span>
        <span className="text-oea-text-muted">{worst.wind_speed_mps.toFixed(1)} m/s</span>
        <ChevronDown size={12} className={`text-oea-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 fade-in">
          <div className="oea-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-oea-border px-4 py-2">
              <span className="text-xs font-semibold text-oea-white">Weather — All Nests</span>
              <button onClick={() => setOpen(false)} className="text-oea-text-muted hover:text-oea-white">
                <X size={14} />
              </button>
            </div>
            <div className="divide-y divide-oea-border">
              {observations.map((obs) => {
                const c = STATUS_CONFIG[obs.ops_status]
                return (
                  <div key={obs.obs_id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-oea-white">{obs.nest_name}</span>
                      <span className={`font-mono text-[10px] font-bold tracking-wider ${c.color}`}>{c.label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <div className="text-oea-text-muted mb-0.5">Wind</div>
                        <div className="text-oea-white font-medium">{obs.wind_speed_mps.toFixed(1)} m/s</div>
                      </div>
                      <div>
                        <div className="text-oea-text-muted mb-0.5">Visibility</div>
                        <div className="text-oea-white font-medium">{obs.visibility_km.toFixed(1)} km</div>
                      </div>
                      <div>
                        <div className="text-oea-text-muted mb-0.5">Precip</div>
                        <div className="text-oea-white font-medium">{obs.precipitation_mm.toFixed(1)} mm</div>
                      </div>
                    </div>
                    <div className="mt-1 text-[10px] text-oea-text-muted">
                      Source: <span className="font-mono">{obs.source}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
