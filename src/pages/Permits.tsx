import { Upload, AlertTriangle } from 'lucide-react'
import { useStore } from '../store'
import { MonoChip } from '../components/ui/MonoChip'
import { StatusPill } from '../components/ui/StatusPill'

const TYPE_LABELS: Record<string, string> = {
  ncaa_rpas_operator: 'NCAA RPAS Operator',
  ncaa_rpas_nest:     'NCAA RPAS Nest',
  onsa_euc:           'ONSA EUC',
  ncaa_flight_ops:    'NCAA Flight Ops Approval',
  state_airspace:     'State Airspace Auth',
}

function daysUntilExpiry(validTo: string): number {
  return Math.floor((new Date(validTo).getTime() - Date.now()) / 86400000)
}

function ExpiryCell({ validTo }: { validTo: string }) {
  const days = daysUntilExpiry(validTo)
  const color = days < 0 ? 'text-status-nogo line-through' : days < 30 ? 'text-status-nogo' : days < 90 ? 'text-status-caution' : 'text-status-go'
  const label = days < 0 ? 'Expired' : `${days}d`
  return (
    <span className={`font-mono font-bold text-xs ${color}`}>{label}</span>
  )
}

export function Permits() {
  const { permits } = useStore()

  const expiringSoon = permits.filter(p => {
    const d = daysUntilExpiry(p.valid_to)
    return d >= 0 && d < 30 && p.status === 'active'
  })

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-sm font-bold text-oea-white">Permit Registry</h1>
          <p className="text-xs text-oea-text-muted mt-0.5">NCAA · ONSA · State airspace permits</p>
        </div>
        <button className="oea-btn-ghost flex items-center gap-1.5 text-xs" title="Phase 2: Supabase Storage upload">
          <Upload size={12} /> Upload Document
        </button>
      </div>

      {/* Expiry warnings */}
      {expiringSoon.length > 0 && (
        <div className="flex items-start gap-3 bg-status-caution/10 border border-status-caution/30 rounded-sm p-4 mb-5">
          <AlertTriangle size={14} className="text-status-caution flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-status-caution">{expiringSoon.length} permit{expiringSoon.length > 1 ? 's' : ''} expire within 30 days:</span>
            <span className="text-oea-text-muted ml-2">{expiringSoon.map(p => p.permit_number).join(' · ')}</span>
          </div>
        </div>
      )}

      <div className="oea-card overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-oea-surface border-b border-oea-border">
            <tr>
              {['Type', 'Permit Number', 'Entity', 'Issued By', 'Valid From', 'Expires', 'Days Left', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-oea-text-muted font-medium text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-oea-border">
            {permits.map(p => (
              <tr key={p.permit_id} className={`hover:bg-oea-border/20 transition-colors ${p.status === 'expired' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-semibold text-oea-text-muted">{TYPE_LABELS[p.permit_type] ?? p.permit_type}</span>
                </td>
                <td className="px-4 py-3"><MonoChip>{p.permit_number}</MonoChip></td>
                <td className="px-4 py-3 text-oea-text max-w-[180px] truncate">{p.entity_name}</td>
                <td className="px-4 py-3 text-oea-text-muted">{p.issued_by}</td>
                <td className="px-4 py-3 text-oea-text-muted font-mono text-[11px]">
                  {new Date(p.valid_from).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-oea-text-muted font-mono text-[11px]">
                  {new Date(p.valid_to).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' })}
                </td>
                <td className="px-4 py-3"><ExpiryCell validTo={p.valid_to} /></td>
                <td className="px-4 py-3"><StatusPill status={p.status} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
