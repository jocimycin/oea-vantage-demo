import type { WeatherOpsStatus, FlightStatus } from '../../types'

type StatusVariant = WeatherOpsStatus | FlightStatus | 'active' | 'expired' | 'suspended' | 'operational' | 'offline' | 'approved' | 'pending' | 'rejected'

const CONFIG: Record<StatusVariant, { label: string; dot: string; text: string; bg: string }> = {
  go:           { label: 'GO',          dot: 'bg-status-go',      text: 'text-status-go',      bg: 'bg-status-go/10' },
  caution:      { label: 'CAUTION',     dot: 'bg-status-caution', text: 'text-status-caution', bg: 'bg-status-caution/10' },
  no_fly:       { label: 'NO-FLY',      dot: 'bg-status-nogo',    text: 'text-status-nogo',    bg: 'bg-status-nogo/10' },
  in_flight:    { label: 'IN FLIGHT',   dot: 'bg-oea-blue',       text: 'text-oea-blue-light', bg: 'bg-oea-blue/10' },
  validated:    { label: 'VALIDATED',   dot: 'bg-status-caution', text: 'text-status-caution', bg: 'bg-status-caution/10' },
  completed:    { label: 'COMPLETED',   dot: 'bg-status-go',      text: 'text-status-go',      bg: 'bg-status-go/10' },
  aborted:      { label: 'ABORTED',     dot: 'bg-status-nogo',    text: 'text-status-nogo',    bg: 'bg-status-nogo/10' },
  pending:      { label: 'PENDING',     dot: 'bg-oea-text-muted', text: 'text-oea-text-muted', bg: 'bg-oea-border/30' },
  active:       { label: 'ACTIVE',      dot: 'bg-status-go',      text: 'text-status-go',      bg: 'bg-status-go/10' },
  expired:      { label: 'EXPIRED',     dot: 'bg-status-nogo',    text: 'text-status-nogo',    bg: 'bg-status-nogo/10' },
  suspended:    { label: 'SUSPENDED',   dot: 'bg-status-caution', text: 'text-status-caution', bg: 'bg-status-caution/10' },
  operational:  { label: 'OPERATIONAL', dot: 'bg-status-go',      text: 'text-status-go',      bg: 'bg-status-go/10' },
  offline:      { label: 'OFFLINE',     dot: 'bg-status-nogo',    text: 'text-status-nogo',    bg: 'bg-status-nogo/10' },
  approved:     { label: 'APPROVED',    dot: 'bg-status-go',      text: 'text-status-go',      bg: 'bg-status-go/10' },
  rejected:     { label: 'REJECTED',    dot: 'bg-status-nogo',    text: 'text-status-nogo',    bg: 'bg-status-nogo/10' },
}

interface Props {
  status: StatusVariant
  size?: 'sm' | 'md'
  pulse?: boolean
}

export function StatusPill({ status, size = 'md', pulse = false }: Props) {
  const cfg = CONFIG[status] ?? CONFIG.pending
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-mono font-medium tracking-widest ${textSize} ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${pulse ? 'animate-ping-slow' : ''}`} />
      {cfg.label}
    </span>
  )
}
