import { Layers, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store'

const LAYERS = [
  { key: 'pois'         as const, label: 'Hospitals & Schools', color: '#e8394a' },
  { key: 'facilities'   as const, label: 'DHIS2 Facilities',    color: '#00c97a' },
  { key: 'nests'        as const, label: 'Nests',               color: '#1574b6' },
  { key: 'dropSites'    as const, label: 'Drop Sites',          color: '#f5a623' },
  { key: 'kfz'          as const, label: 'KFZ / Airspace',      color: '#e8394a' },
  { key: 'serviceAreas' as const, label: 'Service Areas',       color: '#338fce' },
  { key: 'flightTracks' as const, label: 'Flight Tracks',       color: '#4fc3f7' },
]

export function LayerToggles() {
  const [open, setOpen] = useState(false)
  const { layerToggles, toggleLayer, mapStyle, setMapStyle } = useStore()
  const isLight = mapStyle === 'light'

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
      {/* Light / Dark toggle */}
      <button
        onClick={() => setMapStyle(isLight ? 'dark' : 'light')}
        title={isLight ? 'Switch to dark map' : 'Switch to light map'}
        className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          isLight
            ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
            : 'bg-oea-surface/90 border-oea-border text-oea-text hover:border-oea-blue/50 hover:text-oea-white'
        }`}
      >
        {isLight ? <Moon size={13} /> : <Sun size={13} />}
        {isLight ? 'Dark' : 'Light'}
      </button>

      {/* Layer panel */}
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
            open
              ? 'bg-oea-blue border-oea-blue text-white'
              : isLight
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                : 'bg-oea-surface/90 border-oea-border text-oea-text hover:border-oea-blue/50 hover:text-oea-white'
          }`}
        >
          <Layers size={13} />
          Layers
        </button>

        {open && (
          <div className={`absolute right-0 top-full mt-1 w-52 shadow-2xl fade-in overflow-hidden rounded-sm border ${
            isLight ? 'bg-white border-gray-200' : 'bg-oea-surface border-oea-border'
          }`}>
            <div className={`px-3 py-2 border-b ${isLight ? 'border-gray-200' : 'border-oea-border'}`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-gray-700' : 'text-oea-white'}`}>
                Map Layers
              </span>
            </div>
            {LAYERS.map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => toggleLayer(key)}
                className={`w-full flex items-center gap-3 px-3 py-2 transition-colors ${
                  isLight ? 'hover:bg-gray-50' : 'hover:bg-oea-border/30'
                }`}
              >
                <div
                  className={`h-2.5 w-2.5 rounded-sm flex-shrink-0 transition-opacity ${layerToggles[key] ? 'opacity-100' : 'opacity-25'}`}
                  style={{ background: color }}
                />
                <span className={`text-xs ${
                  layerToggles[key]
                    ? isLight ? 'text-gray-700' : 'text-oea-text'
                    : isLight ? 'text-gray-400' : 'text-oea-text-muted'
                }`}>
                  {label}
                </span>
                <div className={`ml-auto h-4 w-7 rounded-sm flex items-center transition-colors ${layerToggles[key] ? 'bg-oea-blue' : isLight ? 'bg-gray-200' : 'bg-oea-border'}`}>
                  <div className={`h-3 w-3 rounded-sm bg-white transition-transform ${layerToggles[key] ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
