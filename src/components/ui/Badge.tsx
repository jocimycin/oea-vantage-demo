type FacilityType = 'hospital' | 'phc' | 'maternity' | 'market' | 'warehouse'
type CargoType    = 'blood' | 'vaccine' | 'medication' | 'medical_supply' | 'market_goods'
type PlatformType = 'P1' | 'P2'

const FACILITY_COLORS: Record<FacilityType, string> = {
  hospital:  'bg-oea-blue/20 text-oea-blue-light border-oea-blue/30',
  phc:       'bg-status-go/10 text-status-go border-status-go/20',
  maternity: 'bg-status-purple/10 text-status-purple border-status-purple/20',
  market:    'bg-status-caution/10 text-status-caution border-status-caution/20',
  warehouse: 'bg-oea-border/40 text-oea-text-muted border-oea-border',
}

const CARGO_COLORS: Record<CargoType, string> = {
  blood:          'bg-status-nogo/10 text-status-nogo',
  vaccine:        'bg-status-go/10 text-status-go',
  medication:     'bg-status-info/10 text-status-info',
  medical_supply: 'bg-status-purple/10 text-status-purple',
  market_goods:   'bg-status-caution/10 text-status-caution',
}

const CARGO_LABELS: Record<CargoType, string> = {
  blood:          'Blood',
  vaccine:        'Vaccine',
  medication:     'Medication',
  medical_supply: 'Med Supply',
  market_goods:   'Market Goods',
}

interface FacilityBadgeProps { type: FacilityType }
export function FacilityBadge({ type }: FacilityBadgeProps) {
  return (
    <span className={`inline-block rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${FACILITY_COLORS[type] ?? 'bg-oea-border/40 text-oea-text-muted border-oea-border'}`}>
      {type.replace('_', ' ')}
    </span>
  )
}

interface CargoBadgeProps { type: CargoType }
export function CargoBadge({ type }: CargoBadgeProps) {
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CARGO_COLORS[type] ?? 'bg-oea-border/40 text-oea-text-muted'}`}>
      {CARGO_LABELS[type] ?? type}
    </span>
  )
}

interface PlatformBadgeProps { platform: PlatformType }
export function PlatformBadge({ platform }: PlatformBadgeProps) {
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-wider ${
      platform === 'P1'
        ? 'bg-oea-blue/20 text-oea-blue-light border border-oea-blue/30'
        : 'bg-status-purple/10 text-status-purple border border-status-purple/20'
    }`}>
      {platform}
    </span>
  )
}

interface PriorityBadgeProps { tier: 1 | 2 | 3 }
export function PriorityBadge({ tier }: PriorityBadgeProps) {
  const colors = {
    1: 'bg-status-nogo/10 text-status-nogo',
    2: 'bg-status-caution/10 text-status-caution',
    3: 'bg-oea-border/40 text-oea-text-muted',
  }
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-semibold ${colors[tier]}`}>
      Tier {tier}
    </span>
  )
}
