import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Package, Clock, Zap, Home, Building2, AlertTriangle } from 'lucide-react'
import { useStore } from '../store'

const KPI_CONFIG = [
  { key: 'total_deliveries_mtd', label: 'Deliveries MTD',     icon: Package,   color: 'text-oea-blue-light',  fmt: (v: number) => v.toLocaleString() },
  { key: 'deliveries_today',     label: 'Deliveries Today',   icon: TrendingUp,color: 'text-status-go',       fmt: (v: number) => String(v) },
  { key: 'on_time_rate_pct',     label: 'On-Time Rate',       icon: Clock,     color: 'text-status-go',       fmt: (v: number) => `${v}%` },
  { key: 'active_flights',       label: 'Active Flights',     icon: Zap,       color: 'text-status-info',     fmt: (v: number) => String(v) },
  { key: 'nests_operational',    label: 'Nests Operational',  icon: Home,      color: 'text-oea-blue-light',  fmt: (v: number) => String(v) },
  { key: 'facilities_served',    label: 'Facilities Served',  icon: Building2, color: 'text-status-go',       fmt: (v: number) => String(v) },
]

const CARGO_COLORS: Record<string, string> = {
  blood:          '#e8394a',
  vaccine:        '#00c97a',
  medication:     '#4fc3f7',
  medical_supply: '#9b7fe8',
  market_goods:   '#f5a623',
}

const CustomTooltipBar = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="oea-card px-3 py-2 shadow-xl text-xs">
      <div className="text-oea-text-muted mb-1">{label}</div>
      <div className="text-oea-white font-bold font-mono">{payload[0].value} deliveries</div>
    </div>
  )
}


export function Analytics() {
  const analytics = useStore(s => s.analytics)
  if (!analytics) return null

  const { kpis, deliveries_by_day, deliveries_by_cargo, coverage_gaps } = analytics

  // Format date labels short
  const chartData = deliveries_by_day.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
    today: d.date === '2026-06-15',
  }))

  const cargoData = deliveries_by_cargo.map(d => ({
    ...d,
    label: d.type.replace('_', ' '),
    fill: CARGO_COLORS[d.type] ?? '#5a7a90',
  }))

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5">
        <h1 className="text-sm font-bold text-oea-white">Analytics</h1>
        <p className="text-xs text-oea-text-muted mt-0.5">Coverage gap analysis · Delivery KPIs · MTD performance</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {KPI_CONFIG.map(({ key, label, icon: Icon, color, fmt }) => (
          <div key={key} className="oea-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} className={color} />
              <span className="text-[10px] text-oea-text-muted font-medium">{label}</span>
            </div>
            <div className={`text-2xl font-black font-mono ${color}`}>
              {fmt(kpis[key as keyof typeof kpis])}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {/* Deliveries by day */}
        <div className="oea-card p-5">
          <h3 className="text-xs font-bold text-oea-white mb-4">Deliveries — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3a50" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#5a7a90', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a7a90', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(21,116,182,0.1)' }} />
              <Bar
                dataKey="count"
                fill="#1574b6"
                radius={[2, 2, 0, 0]}
                // Today's bar is highlighted
                label={false}
                isAnimationActive
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deliveries by cargo */}
        <div className="oea-card p-5">
          <h3 className="text-xs font-bold text-oea-white mb-4">Deliveries by Cargo Type</h3>
          <div className="space-y-2.5">
            {cargoData.sort((a, b) => b.count - a.count).map(d => (
              <div key={d.type}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-oea-text capitalize">{d.label}</span>
                  <span className="font-mono font-bold" style={{ color: d.fill }}>{d.count}</span>
                </div>
                <div className="h-2 bg-oea-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(d.count / Math.max(...cargoData.map(c => c.count))) * 100}%`,
                      background: d.fill,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coverage gap table */}
      <div className="oea-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-oea-border">
          <AlertTriangle size={13} className="text-status-caution" />
          <h3 className="text-xs font-bold text-oea-white">Coverage Gaps</h3>
          <span className="text-[10px] font-mono text-status-caution bg-status-caution/10 px-1.5 py-0.5 rounded-sm ml-1">
            {kpis.coverage_gap_count} facilities
          </span>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-oea-surface border-b border-oea-border">
            <tr>
              {['Facility', 'State', 'LGA', 'Distance to Nest', 'Priority Score', 'P1 Range', 'P2 Range'].map(h => (
                <th key={h} className="text-left px-4 py-2 text-oea-text-muted font-medium text-[10px] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-oea-border">
            {[...coverage_gaps].sort((a, b) => b.priority_score - a.priority_score).map((g, i) => (
              <tr key={i} className="hover:bg-oea-border/20">
                <td className="px-4 py-2.5 text-oea-white font-medium">{g.facility_name}</td>
                <td className="px-4 py-2.5 text-oea-text">{g.state}</td>
                <td className="px-4 py-2.5 text-oea-text">{g.lga}</td>
                <td className="px-4 py-2.5 font-mono text-status-caution">{g.distance_to_nearest_nest_km.toFixed(1)} km</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-oea-border rounded-full overflow-hidden">
                      <div className="h-full bg-status-caution rounded-full" style={{ width: `${g.priority_score * 10}%` }} />
                    </div>
                    <span className="font-mono font-bold text-status-caution">{g.priority_score}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center text-status-nogo">✗</td>
                <td className="px-4 py-2.5 text-center text-status-nogo">✗</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
