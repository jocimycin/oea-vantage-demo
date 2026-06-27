import { useState } from 'react'
import { Plus, Search, Filter, ChevronDown } from 'lucide-react'
import { useStore } from '../store'
import { StatusPill } from '../components/ui/StatusPill'
import { MonoChip } from '../components/ui/MonoChip'
import { CargoBadge, PlatformBadge } from '../components/ui/Badge'
import { CreateFlightModal } from '../components/flights/CreateFlightModal'
import type { FlightStatus } from '../types'

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

export function Flights() {
  const { flights } = useStore()
  const [showCreate, setShowCreate] = useState(false)
  const [search,   setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState<FlightStatus | ''>('')
  const [platformFilter, setPlatformFilter] = useState<'P1' | 'P2' | ''>('')

  const filtered = flights.filter(f => {
    const q = search.toLowerCase()
    const matchSearch = !q || f.ncaa_submission_ref.toLowerCase().includes(q) ||
      f.drone_serial.toLowerCase().includes(q) || f.site_name.toLowerCase().includes(q) ||
      f.nest_name.toLowerCase().includes(q) || f.operator_name.toLowerCase().includes(q)
    const matchStatus   = !statusFilter   || f.status   === statusFilter
    const matchPlatform = !platformFilter || f.platform === platformFilter
    return matchSearch && matchStatus && matchPlatform
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-oea-border flex-shrink-0">
        <div>
          <h1 className="text-sm font-bold text-oea-white">Flight Plans</h1>
          <p className="text-xs text-oea-text-muted mt-0.5">{flights.length} total · {flights.filter(f => f.status === 'in_flight').length} active</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="oea-btn flex items-center gap-2 text-xs">
          <Plus size={13} /> New Flight Plan
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-oea-border flex-shrink-0 bg-oea-surface/50">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-oea-text-muted" />
          <input
            type="text"
            placeholder="Search flights, serials, refs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-oea-night border border-oea-border rounded-sm pl-8 pr-3 py-1.5 text-xs text-oea-text placeholder:text-oea-text-muted focus:outline-none focus:border-oea-blue"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as FlightStatus | '')}
            className="bg-oea-night border border-oea-border rounded-sm pl-3 pr-8 py-1.5 text-xs text-oea-text focus:outline-none focus:border-oea-blue appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="in_flight">In Flight</option>
            <option value="validated">Validated</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="aborted">Aborted</option>
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-oea-text-muted pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value as 'P1' | 'P2' | '')}
            className="bg-oea-night border border-oea-border rounded-sm pl-3 pr-8 py-1.5 text-xs text-oea-text focus:outline-none focus:border-oea-blue appearance-none cursor-pointer"
          >
            <option value="">All Platforms</option>
            <option value="P1">P1 — Sparrow</option>
            <option value="P2">P2 — Zipper</option>
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-oea-text-muted pointer-events-none" />
        </div>

        <span className="text-xs text-oea-text-muted ml-auto">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-oea-surface border-b border-oea-border">
            <tr>
              {['NCAA Ref', 'Origin Nest', 'Destination', 'Platform', 'Cargo', 'Status', 'Dispatcher', 'Dispatched'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-oea-text-muted font-medium text-[11px] uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-oea-border">
            {filtered.map(f => (
              <tr key={f.delivery_id} className="hover:bg-oea-border/20 transition-colors cursor-pointer">
                <td className="px-4 py-3"><MonoChip>{f.ncaa_submission_ref}</MonoChip></td>
                <td className="px-4 py-3 text-oea-text">{f.nest_name.replace(' Nest 01', '')}</td>
                <td className="px-4 py-3 text-oea-white font-medium max-w-xs truncate">{f.site_name}</td>
                <td className="px-4 py-3"><PlatformBadge platform={f.platform} /></td>
                <td className="px-4 py-3"><CargoBadge type={f.cargo_type} /></td>
                <td className="px-4 py-3"><StatusPill status={f.status} size="sm" pulse={f.status === 'in_flight'} /></td>
                <td className="px-4 py-3 text-oea-text-muted">{f.operator_name}</td>
                <td className="px-4 py-3 text-oea-text-muted font-mono text-[11px]">{formatDateTime(f.dispatched_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-oea-text-muted text-xs">
            <Filter size={20} className="mb-2 opacity-30" />
            No flights match filters
          </div>
        )}
      </div>

      {showCreate && <CreateFlightModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
