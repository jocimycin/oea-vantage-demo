import { Cloud, Droplets, Eye, CloudRain } from 'lucide-react'
import { useStore } from '../store'
import { CompassRose } from '../components/ui/CompassRose'
import { MonoChip } from '../components/ui/MonoChip'
import type { WeatherObservation, WeatherThresholds } from '../types'

// Harmattan is only shown Nov 1 – Mar 31
function isHarmattanSeason(): boolean {
  const m = new Date().getMonth() + 1
  return m >= 11 || m <= 3
}

function ThresholdRow({ label, value, unit, threshold, isMin = false }: {
  label: string; value: number; unit: string; threshold: number; isMin?: boolean
}) {
  const pass = isMin ? value >= threshold : value <= threshold
  return (
    <tr className="border-b border-oea-border">
      <td className="px-4 py-2.5 text-xs text-oea-text-muted">{label}</td>
      <td className="px-4 py-2.5 text-xs font-mono font-bold text-oea-white">{value.toFixed(1)} {unit}</td>
      <td className="px-4 py-2.5 text-xs font-mono text-oea-text-muted">{isMin ? '≥' : '≤'} {threshold} {unit}</td>
      <td className="px-4 py-2.5">
        <span className={`font-mono text-[10px] font-bold ${pass ? 'text-status-go' : 'text-status-nogo'}`}>
          {pass ? '✓ PASS' : '✗ FAIL'}
        </span>
      </td>
    </tr>
  )
}

function WxCard({ obs, thresholds }: { obs: WeatherObservation; thresholds: WeatherThresholds }) {
  const cfg = {
    go:     { bg: 'bg-status-go/5 border-status-go/30',     label: 'OPS GO',     color: 'text-status-go' },
    caution:{ bg: 'bg-status-caution/5 border-status-caution/30', label: 'CAUTION', color: 'text-status-caution' },
    no_fly: { bg: 'bg-status-nogo/5 border-status-nogo/30', label: 'NO-FLY',    color: 'text-status-nogo' },
  }[obs.ops_status]

  const harmattan = isHarmattanSeason()

  return (
    <div className={`oea-card border rounded-sm overflow-hidden ${cfg.bg}`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-oea-border">
        <div>
          <h3 className="text-sm font-bold text-oea-white">{obs.nest_name}</h3>
          <MonoChip className="mt-1">{obs.source}</MonoChip>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`font-mono text-lg font-black ${cfg.color}`}>{cfg.label}</span>
          <span className="text-[10px] text-oea-text-muted">{new Date(obs.observed_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} UTC</span>
        </div>
      </div>

      {/* Main metrics */}
      <div className="p-5 grid grid-cols-2 gap-5">
        {/* Wind + compass */}
        <div className="flex flex-col items-center gap-2">
          <CompassRose degrees={obs.wind_dir_deg} size={72} />
          <div className="text-center">
            <div className="text-2xl font-black font-mono text-oea-white">{obs.wind_speed_mps.toFixed(1)}</div>
            <div className="text-[10px] text-oea-text-muted">m/s wind</div>
            <div className="text-xs text-status-caution font-mono mt-0.5">↑ {obs.wind_gust_mps.toFixed(1)} gust</div>
          </div>
        </div>

        {/* Other metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-oea-text-muted"><Eye size={12} /> Visibility</div>
            <span className={`font-mono font-bold ${obs.visibility_km < thresholds.visibility_min_km ? 'text-status-nogo' : 'text-oea-white'}`}>
              {obs.visibility_km.toFixed(1)} km
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-oea-text-muted"><CloudRain size={12} /> Precip</div>
            <span className={`font-mono font-bold ${obs.precipitation_mm > thresholds.precipitation_max_mm ? 'text-status-nogo' : 'text-oea-white'}`}>
              {obs.precipitation_mm.toFixed(1)} mm
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-oea-text-muted"><Cloud size={12} /> Cloud Base</div>
            <span className={`font-mono font-bold ${obs.cloud_base_m < thresholds.cloud_base_min_m ? 'text-status-nogo' : 'text-oea-white'}`}>
              {obs.cloud_base_m}m
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-oea-text-muted"><Droplets size={12} /> Humidity</div>
            <span className="font-mono text-oea-white">{obs.humidity_pct}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="text-oea-text-muted">Temp</div>
            <span className="font-mono text-oea-white">{obs.temp_c.toFixed(1)}°C</span>
          </div>
          {harmattan && (
            <div className="flex items-center justify-between text-xs group relative">
              <div className="flex items-center gap-1.5 text-oea-text-muted">
                🌫 Harmattan
                <span className="text-[9px] cursor-help" title="Dust-haze index 0–5. Meaningful Nov–Mar only. 0=clear, 5=severe haze.">ⓘ</span>
              </div>
              <div className="flex gap-0.5">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className={`h-2.5 w-2.5 rounded-sm ${i < obs.harmattan_index ? 'bg-status-caution' : 'bg-oea-border'}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Threshold check row */}
      <div className="px-5 pb-4">
        <table className="w-full text-[11px] bg-oea-night/50 rounded-sm overflow-hidden">
          <thead>
            <tr className="bg-oea-border/30">
              <th className="text-left px-4 py-1.5 text-oea-text-muted font-medium text-[10px]">Parameter</th>
              <th className="text-left px-4 py-1.5 text-oea-text-muted font-medium text-[10px]">Current</th>
              <th className="text-left px-4 py-1.5 text-oea-text-muted font-medium text-[10px]">Limit</th>
              <th className="text-left px-4 py-1.5 text-oea-text-muted font-medium text-[10px]">Status</th>
            </tr>
          </thead>
          <tbody>
            <ThresholdRow label="Wind Speed"  value={obs.wind_speed_mps}     unit="m/s" threshold={thresholds.wind_speed_max_mps} />
            <ThresholdRow label="Wind Gust"   value={obs.wind_gust_mps}      unit="m/s" threshold={thresholds.wind_gust_max_mps} />
            <ThresholdRow label="Precip"      value={obs.precipitation_mm}   unit="mm"  threshold={thresholds.precipitation_max_mm} />
            <ThresholdRow label="Visibility"  value={obs.visibility_km}      unit="km"  threshold={thresholds.visibility_min_km}   isMin />
            <ThresholdRow label="Cloud Base"  value={obs.cloud_base_m}       unit="m"   threshold={thresholds.cloud_base_min_m}    isMin />
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Weather() {
  const { weather } = useStore()

  if (!weather) return null
  const { observations, thresholds } = weather

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-oea-white">Weather Dashboard</h1>
          <p className="text-xs text-oea-text-muted mt-0.5">NiMet primary · OpenWeatherMap fallback · Auto-refresh every 60s</p>
        </div>
        {isHarmattanSeason() && (
          <div className="bg-status-caution/10 border border-status-caution/30 rounded-sm px-3 py-1.5 text-xs text-status-caution font-semibold">
            🌫 Harmattan Season Active
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {observations.map(obs => (
          <WxCard key={obs.obs_id} obs={obs} thresholds={thresholds} />
        ))}
      </div>
    </div>
  )
}
