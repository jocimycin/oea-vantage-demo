import { useStore } from '../store'
import { MapCanvas } from '../components/map/MapCanvas'
import { MonoChip } from '../components/ui/MonoChip'
import { Clock, AlertTriangle } from 'lucide-react'

function formatExpiry(validTo: string | null): string {
  if (!validTo) return 'Permanent'
  const d = new Date(validTo)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  if (diffMs < 0) return 'Expired'
  const hours = Math.floor(diffMs / 3600000)
  if (hours < 24) return `${hours}h remaining`
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const SEVERITY_COLORS: Record<string, string> = {
  hard_exclusion: 'text-status-nogo',
  advisory:       'text-status-caution',
}

const TYPE_ICONS: Record<string, string> = {
  airport:  '✈',
  military: '🪖',
  aso_rock: '🏛',
  prison:   '🔒',
  refinery: '🏭',
  event:    '🎯',
  advisory: '⚠',
}

export function Airspace() {
  const { kfz, setSelected } = useStore()

  const activeKfz = kfz.filter(z => z.is_active)
  const timeLimited = activeKfz.filter(z => z.valid_to !== null)

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* Left: KFZ list */}
      <div className="w-80 flex flex-col border-r border-oea-border overflow-hidden flex-shrink-0">
        {/* TFR indicator */}
        {timeLimited.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-status-caution/10 border-b border-status-caution/30">
            <AlertTriangle size={13} className="text-status-caution flex-shrink-0" />
            <span className="text-xs font-semibold text-status-caution">{timeLimited.length} active TFR{timeLimited.length > 1 ? 's' : ''}</span>
          </div>
        )}

        <div className="px-4 py-3 border-b border-oea-border flex-shrink-0">
          <h1 className="text-sm font-bold text-oea-white">KFZ Registry</h1>
          <p className="text-xs text-oea-text-muted mt-0.5">{activeKfz.length} active zones · {kfz.filter(z => !z.is_active).length} inactive</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-oea-border">
          {kfz.map(z => (
            <button
              key={z.kfz_id}
              onClick={() => { setSelected(z.kfz_id, 'kfz') }}
              className={`w-full text-left p-4 hover:bg-oea-border/20 transition-colors ${!z.is_active ? 'opacity-40' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none flex-shrink-0">{TYPE_ICONS[z.kfz_type] ?? '🚫'}</span>
                  <span className="text-xs font-semibold text-oea-white line-clamp-2 text-left">{z.kfz_name}</span>
                </div>
                {!z.is_active && <span className="text-[9px] text-oea-text-muted font-mono flex-shrink-0">INACTIVE</span>}
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-bold font-mono ${SEVERITY_COLORS[z.severity]}`}>
                  {z.severity === 'hard_exclusion' ? 'HARD EXCLUSION' : 'ADVISORY'}
                </span>
                <span className="text-[10px] text-oea-text-muted">· {z.authority}</span>
              </div>

              <div className="flex items-center justify-between">
                <MonoChip>{z.notam_ref}</MonoChip>
                <div className="flex items-center gap-1 text-[10px] text-oea-text-muted">
                  <Clock size={9} />
                  {formatExpiry(z.valid_to)}
                </div>
              </div>

              <div className="mt-1.5 text-[10px] text-oea-text-muted">
                R {z.radius_km} km · {z.altitude_ceiling_m === 9999 ? 'Unlimited ceiling' : `≤ ${z.altitude_ceiling_m}m AGL`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Full-width map */}
      <div style={{ flex:'1 1 0', position:'relative', minWidth:0, minHeight:0, overflow:'hidden' }}>
        <MapCanvas showPopups />

        {/* KFZ legend overlay */}
        <div className="absolute bottom-8 right-4 oea-card px-3 py-2 text-[10px] space-y-1.5">
          <div className="font-bold text-oea-white mb-1 text-[11px]">KFZ Legend</div>
          {[
            { color: 'bg-status-nogo', label: 'Hard Exclusion (NCAA/ONSA/Military)' },
            { color: 'bg-status-caution', label: 'Advisory Buffer' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`h-2 w-4 ${color} opacity-60 rounded-sm`} />
              <span className="text-oea-text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
