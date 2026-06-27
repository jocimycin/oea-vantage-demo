import { NavLink } from 'react-router-dom'
import {
  Map, Route, Building2, MapPin, Home, Shield,
  Cloud, Cpu, BarChart2, FileCheck,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',  icon: Map,       label: 'Dashboard' },
  { to: '/flights',    icon: Route,     label: 'Flights'   },
  { to: '/facilities', icon: Building2, label: 'Facilities'},
  { to: '/drop-sites', icon: MapPin,    label: 'Drop Sites'},
  { to: '/nests',      icon: Home,      label: 'Nests'     },
  { to: '/airspace',   icon: Shield,    label: 'Airspace'  },
  { to: '/weather',    icon: Cloud,     label: 'Weather'   },
  { to: '/fleet',      icon: Cpu,       label: 'Fleet'     },
  { to: '/analytics',  icon: BarChart2, label: 'Analytics' },
  { to: '/permits',    icon: FileCheck, label: 'Permits'   },
]

export function NavRail() {
  return (
    <nav
      className="flex flex-col bg-oea-surface border-r border-oea-border flex-shrink-0"
      style={{ width: 56 }}
    >
      <div className="flex-1 flex flex-col pt-2 gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `group relative flex flex-col items-center justify-center py-3 transition-colors ${
                isActive
                  ? 'text-oea-white bg-oea-blue/10 border-r-2 border-oea-blue'
                  : 'text-oea-text-muted hover:text-oea-white hover:bg-oea-border/30 border-r-2 border-transparent'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.5} />
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute left-full ml-2 z-50 hidden group-hover:block whitespace-nowrap">
              <div className="bg-oea-surface border border-oea-border rounded-sm px-2.5 py-1 text-xs font-medium text-oea-white shadow-lg">
                {label}
              </div>
            </div>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
