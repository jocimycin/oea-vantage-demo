import { useState } from 'react'
import { Search, Thermometer, ChevronDown, X, Phone, User } from 'lucide-react'
import { useStore } from '../store'
import { MapCanvas } from '../components/map/MapCanvas'
import { FacilityBadge, PriorityBadge } from '../components/ui/Badge'
import { MonoChip } from '../components/ui/MonoChip'
import type { Facility } from '../types'

export function Facilities() {
  const { facilities, dropSites } = useStore()
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState('')
  const [tierFilter,  setTierFilter]  = useState('')
  const [selected,    setSelected]    = useState<Facility | null>(null)

  const filtered = facilities.filter(f => {
    const q = search.toLowerCase()
    const matchQ = !q || f.facility_name.toLowerCase().includes(q) || f.lga.toLowerCase().includes(q) || f.state.toLowerCase().includes(q)
    const matchType = !typeFilter || f.facility_type === typeFilter
    const matchTier = !tierFilter || String(f.priority_tier) === tierFilter
    return matchQ && matchType && matchTier
  })

  const facilityDropSites = selected ? dropSites.filter(s => s.facility_id === selected.facility_id) : []

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* Left: Table */}
      <div className="w-[55%] flex flex-col border-r border-oea-border overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-oea-border flex-shrink-0">
          <h1 className="text-sm font-bold text-oea-white">Facility Registry</h1>
          <p className="text-xs text-oea-text-muted mt-0.5">{facilities.length} facilities · DHIS2-synced</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-oea-border flex-shrink-0 bg-oea-surface/50">
          <div className="relative flex-1">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-oea-text-muted" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, LGA, state..."
              className="w-full bg-oea-night border border-oea-border rounded-sm pl-7 pr-2 py-1.5 text-[11px] text-oea-text placeholder:text-oea-text-muted focus:outline-none focus:border-oea-blue"
            />
          </div>
          <div className="relative">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="bg-oea-night border border-oea-border rounded-sm pl-2 pr-6 py-1.5 text-[11px] text-oea-text focus:outline-none focus:border-oea-blue appearance-none cursor-pointer">
              <option value="">All Types</option>
              <option value="hospital">Hospital</option>
              <option value="phc">PHC</option>
              <option value="maternity">Maternity</option>
              <option value="market">Market</option>
              <option value="warehouse">Warehouse</option>
            </select>
            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-oea-text-muted pointer-events-none" />
          </div>
          <div className="relative">
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
              className="bg-oea-night border border-oea-border rounded-sm pl-2 pr-6 py-1.5 text-[11px] text-oea-text focus:outline-none focus:border-oea-blue appearance-none cursor-pointer">
              <option value="">All Tiers</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-oea-text-muted pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-oea-surface border-b border-oea-border">
              <tr>
                {['DHIS2 UID', 'Name', 'Type', 'State', 'Priority', 'Cold Chain'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-oea-text-muted font-medium text-[10px] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-oea-border">
              {filtered.map(f => (
                <tr
                  key={f.facility_id}
                  onClick={() => setSelected(f)}
                  className={`cursor-pointer transition-colors hover:bg-oea-border/20 ${selected?.facility_id === f.facility_id ? 'bg-oea-blue/10' : ''}`}
                >
                  <td className="px-3 py-2.5"><MonoChip>{f.dhis2_uid}</MonoChip></td>
                  <td className="px-3 py-2.5 text-oea-white font-medium max-w-[160px] truncate">{f.facility_name}</td>
                  <td className="px-3 py-2.5"><FacilityBadge type={f.facility_type} /></td>
                  <td className="px-3 py-2.5 text-oea-text">{f.state}</td>
                  <td className="px-3 py-2.5"><PriorityBadge tier={f.priority_tier} /></td>
                  <td className="px-3 py-2.5 text-center">
                    {f.cold_chain
                      ? <Thermometer size={13} className="text-status-info mx-auto" />
                      : <span className="text-oea-border">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: Map + detail */}
      <div style={{ flex:'1 1 0', display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Map */}
        <div style={{ flex:'1 1 0', position:'relative', minWidth:0, minHeight:0, overflow:'hidden' }}>
          <MapCanvas showPopups={false} filteredFacilityIds={filtered.map(f => f.facility_id)} />
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="h-60 border-t border-oea-border bg-oea-surface overflow-y-auto flex-shrink-0 slide-in">
            <div className="flex items-start justify-between p-4 border-b border-oea-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FacilityBadge type={selected.facility_type} />
                  <PriorityBadge tier={selected.priority_tier} />
                  {selected.cold_chain && <Thermometer size={12} className="text-status-info" />}
                </div>
                <h2 className="text-sm font-bold text-oea-white">{selected.facility_name}</h2>
                <p className="text-xs text-oea-text-muted">{selected.lga}, {selected.state}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-oea-text-muted hover:text-oea-white">
                <X size={14} />
              </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-oea-text-muted mb-1">DHIS2 UID</div>
                <MonoChip>{selected.dhis2_uid}</MonoChip>
              </div>
              <div>
                <div className="text-oea-text-muted mb-1">Ownership</div>
                <span className="text-oea-white capitalize">{selected.ownership}</span>
              </div>
              <div>
                <div className="text-oea-text-muted mb-1 flex items-center gap-1"><User size={10}/> Contact</div>
                <div className="text-oea-white">{selected.contact_name}</div>
              </div>
              <div>
                <div className="text-oea-text-muted mb-1 flex items-center gap-1"><Phone size={10}/> Phone</div>
                <div className="font-mono text-status-info text-[11px]">{selected.contact_phone}</div>
              </div>
            </div>

            {facilityDropSites.length > 0 && (
              <div className="px-4 pb-4">
                <div className="text-[10px] font-bold text-oea-text-muted uppercase tracking-wider mb-2">Drop Sites ({facilityDropSites.length})</div>
                <div className="space-y-1.5">
                  {facilityDropSites.map(s => (
                    <div key={s.site_id} className="flex items-center justify-between bg-oea-night border border-oea-border rounded-sm px-3 py-1.5 text-[11px]">
                      <span className="text-oea-text truncate">{s.site_name}</span>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="font-mono text-status-go font-bold">{s.zipline_score}</span>
                        <span className={`font-semibold ${s.survey_status === 'approved' ? 'text-status-go' : s.survey_status === 'pending' ? 'text-status-caution' : 'text-status-nogo'}`}>
                          {s.survey_status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
