
import { useStore } from '../store'
import { StatusPill } from '../components/ui/StatusPill'
import { MonoChip } from '../components/ui/MonoChip'
import { PlatformBadge } from '../components/ui/Badge'
import type { DroneStatus } from '../types'

const STATUS_ORDER: DroneStatus[] = ['in_flight', 'available', 'maintenance', 'offline']

function BatteryBar({ pct }: { pct: number }) {
  const color = pct > 60 ? 'bg-status-go' : pct > 30 ? 'bg-status-caution' : 'bg-status-nogo'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 bg-oea-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`font-mono text-[11px] font-bold ${color.replace('bg-', 'text-')}`}>{pct}%</span>
    </div>
  )
}

export function Fleet() {
  const { drones } = useStore()

  const grouped = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = drones.filter(d => d.status === status)
    return acc
  }, {} as Record<DroneStatus, typeof drones>)

  const STATUS_LABELS: Record<DroneStatus, string> = {
    in_flight:   'In Flight',
    available:   'Available',
    maintenance: 'Maintenance',
    offline:     'Offline',
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-oea-white">Drone Fleet Registry</h1>
          <p className="text-xs text-oea-text-muted mt-0.5">{drones.length} aircraft · {drones.filter(d => d.status === 'available').length} available</p>
        </div>
        <div className="flex gap-2">
          {STATUS_ORDER.map(s => (
            <div key={s} className="text-center">
              <div className="text-lg font-black font-mono text-oea-white">{grouped[s].length}</div>
              <div className="text-[9px] text-oea-text-muted">{STATUS_LABELS[s]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="oea-card overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-oea-surface border-b border-oea-border">
            <tr>
              {['Serial', 'Model', 'Platform', 'Nest', 'Status', 'Battery', 'Flight Hours', 'Payload', 'Range', 'NCAA Permit'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-oea-text-muted font-medium text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-oea-border">
            {drones.map(d => (
              <tr key={d.drone_id} className={`hover:bg-oea-border/20 transition-colors ${d.status === 'offline' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3"><MonoChip>{d.serial}</MonoChip></td>
                <td className="px-4 py-3 text-oea-text">{d.model}</td>
                <td className="px-4 py-3"><PlatformBadge platform={d.platform} /></td>
                <td className="px-4 py-3 text-oea-text-muted text-[11px]">{d.nest_name.replace(' Nest 01', '')}</td>
                <td className="px-4 py-3"><StatusPill status={d.status as any} size="sm" pulse={d.status === 'in_flight'} /></td>
                <td className="px-4 py-3"><BatteryBar pct={d.battery_pct} /></td>
                <td className="px-4 py-3 font-mono text-oea-white">{d.flight_hours_total.toLocaleString()}h</td>
                <td className="px-4 py-3 font-mono text-oea-text">{d.payload_capacity_kg}kg</td>
                <td className="px-4 py-3 font-mono text-oea-text">{d.range_km}km</td>
                <td className="px-4 py-3"><MonoChip>{d.ncaa_permit_ref}</MonoChip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
