import { useEffect, useRef, useState } from 'react'
import { Minus, Maximize2, X, Zap } from 'lucide-react'
import { useStore } from '../../store'

const SPEED = 0.000055 // matches MapCanvas drone speed

// Project [lat,lng] to SVG [x,y] within a given bounding box
function project(lat: number, lng: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }, w: number, h: number, pad = 24) {
  const lngRange = bounds.maxLng - bounds.minLng || 0.01
  const latRange = bounds.maxLat - bounds.minLat || 0.01
  const x = pad + ((lng - bounds.minLng) / lngRange) * (w - pad * 2)
  const y = pad + ((bounds.maxLat - lat) / latRange) * (h - pad * 2)
  return { x, y }
}

interface TrackerFlight {
  delivery_id: string
  drone_serial: string
  platform: 'P1' | 'P2'
  cargo_type: string
  nestLat: number
  nestLng: number
  siteLat: number
  siteLng: number
  nestName: string
  siteName: string
  eta: string | null
}

export function LiveFlightPiP() {
  const { flights, nests, dropSites } = useStore()
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const droneRef = useRef<SVGGElement>(null)
  const progressRef = useRef<Record<string, number>>({})
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(performance.now())

  const activeFlights: TrackerFlight[] = flights
    .filter(f => f.status === 'in_flight')
    .flatMap(f => {
      const nest = nests.find(n => n.nest_id === f.nest_id)
      const site = dropSites.find(s => s.site_id === f.site_id)
      if (!nest || !site) return []
      return [{
        delivery_id: f.delivery_id,
        drone_serial: f.drone_serial,
        platform: f.platform,
        cargo_type: f.cargo_type,
        nestLat: nest.lat, nestLng: nest.lng,
        siteLat: site.lat, siteLng: site.lng,
        nestName: nest.nest_name,
        siteName: site.site_name,
        eta: f.eta,
      }]
    })

  // Primary flight for display (first in-flight)
  const primary = activeFlights[0]

  useEffect(() => {
    if (!primary || collapsed || dismissed) {
      cancelAnimationFrame(animRef.current)
      return
    }

    const W = 280, H = 170
    const bounds = {
      minLat: Math.min(primary.nestLat, primary.siteLat),
      maxLat: Math.max(primary.nestLat, primary.siteLat),
      minLng: Math.min(primary.nestLng, primary.siteLng),
      maxLng: Math.max(primary.nestLng, primary.siteLng),
    }

    const nestPt  = project(primary.nestLat, primary.nestLng, bounds, W, H)
    const sitePt  = project(primary.siteLat, primary.siteLng, bounds, W, H)

    if (!(primary.delivery_id in progressRef.current)) {
      progressRef.current[primary.delivery_id] = 0.35
    }

    const animate = (now: number) => {
      const dt = now - lastTimeRef.current
      lastTimeRef.current = now

      let t = (progressRef.current[primary.delivery_id] ?? 0.35) + SPEED * dt
      if (t >= 1) t = 0
      progressRef.current[primary.delivery_id] = t

      const droneEl = droneRef.current
      if (droneEl) {
        const dx = nestPt.x + (sitePt.x - nestPt.x) * t
        const dy = nestPt.y + (sitePt.y - nestPt.y) * t
        // Rotation: angle of travel
        const angle = Math.atan2(sitePt.y - nestPt.y, sitePt.x - nestPt.x) * (180 / Math.PI)
        droneEl.setAttribute('transform', `translate(${dx},${dy}) rotate(${angle})`)
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [primary, collapsed, dismissed])

  if (!primary || dismissed) return null

  const W = 280, H = 170
  const bounds = {
    minLat: Math.min(primary.nestLat, primary.siteLat),
    maxLat: Math.max(primary.nestLat, primary.siteLat),
    minLng: Math.min(primary.nestLng, primary.siteLng),
    maxLng: Math.max(primary.nestLng, primary.siteLng),
  }
  const nestPt  = project(primary.nestLat, primary.nestLng, bounds, W, H)
  const sitePt  = project(primary.siteLat, primary.siteLng, bounds, W, H)
  const midX = (nestPt.x + sitePt.x) / 2
  const midY = (nestPt.y + sitePt.y) / 2

  const etaStr = primary.eta
    ? new Date(primary.eta).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null

  const CARGO_ICON: Record<string, string> = {
    blood: '🩸', vaccine: '💉', medication: '💊', medical_supply: '🏥', market_goods: '📦',
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 72, // right of NavRail
        zIndex: 200,
        width: collapsed ? 220 : 296,
        transition: 'width 0.2s ease, height 0.2s ease',
        fontFamily: 'Inter, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* Header pill */}
      <div
        style={{
          background: '#0d1b2a',
          border: '1px solid #1a3a50',
          borderBottom: collapsed ? '1px solid #1a3a50' : 'none',
          borderRadius: collapsed ? '6px' : '6px 6px 0 0',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(c => !c)}
      >
        {/* Pulsing live indicator */}
        <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: '#00c97a',
            animation: 'dronePulse 2s ease-out infinite',
          }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#00c97a' }} />
        </div>

        <span style={{ fontSize: 11, fontWeight: 700, color: '#e8f4fd', flexGrow: 1, letterSpacing: '0.02em' }}>
          LIVE  {CARGO_ICON[primary.cargo_type] ?? '📦'} {primary.drone_serial}
        </span>

        {etaStr && !collapsed && (
          <span style={{ fontSize: 10, color: '#338fce', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
            ETA {etaStr}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); setCollapsed(c => !c) }}
            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#5a7a90', lineHeight: 0 }}
            title={collapsed ? 'Expand' : 'Minimize'}
          >
            {collapsed ? <Maximize2 size={11} /> : <Minus size={11} />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); setDismissed(true) }}
            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#5a7a90', lineHeight: 0 }}
            title="Dismiss"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* SVG flight tracker */}
      {!collapsed && (
        <div style={{ background: '#0a1520', border: '1px solid #1a3a50', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
          <svg
            ref={svgRef}
            width={W}
            height={H}
            style={{ display: 'block' }}
          >
            {/* Grid lines */}
            {[...Array(6)].map((_, i) => (
              <line key={`h${i}`} x1={0} y1={(i + 1) * H / 7} x2={W} y2={(i + 1) * H / 7}
                stroke="#1a3a50" strokeWidth={0.5} strokeDasharray="3,4" />
            ))}
            {[...Array(8)].map((_, i) => (
              <line key={`v${i}`} x1={(i + 1) * W / 9} y1={0} x2={(i + 1) * W / 9} y2={H}
                stroke="#1a3a50" strokeWidth={0.5} strokeDasharray="3,4" />
            ))}

            {/* Route shadow */}
            <line
              x1={nestPt.x} y1={nestPt.y} x2={sitePt.x} y2={sitePt.y}
              stroke="#1574b6" strokeWidth={6} strokeOpacity={0.08}
            />

            {/* Dashed route line */}
            <line
              x1={nestPt.x} y1={nestPt.y} x2={sitePt.x} y2={sitePt.y}
              stroke="#338fce" strokeWidth={1.5} strokeDasharray="5,4" strokeOpacity={0.7}
            />

            {/* Coverage circle hint */}
            <circle cx={nestPt.x} cy={nestPt.y} r={30} fill="none" stroke="#1574b6" strokeWidth={0.5} strokeDasharray="2,3" strokeOpacity={0.4} />

            {/* Mid-route distance label */}
            <text x={midX} y={midY - 8} textAnchor="middle" fontSize={9} fill="#5a7a90" fontFamily="JetBrains Mono, monospace">
              IN FLIGHT
            </text>

            {/* Nest marker */}
            <g transform={`translate(${nestPt.x},${nestPt.y})`}>
              <polygon
                points="0,-10 8.7,-5 8.7,5 0,10 -8.7,5 -8.7,-5"
                fill="#1574b6" opacity={0.9}
              />
              <polygon
                points="0,-6.5 5.6,-3.25 5.6,3.25 0,6.5 -5.6,3.25 -5.6,-3.25"
                fill="#338fce"
              />
            </g>
            {/* Nest label */}
            <text x={nestPt.x} y={nestPt.y + 18} textAnchor="middle" fontSize={8} fill="#5a7a90" fontFamily="Inter, sans-serif">
              {primary.nestName.split('-')[0]}
            </text>

            {/* Drop site marker */}
            <g transform={`translate(${sitePt.x},${sitePt.y})`}>
              <path d="M0,-12 C-7,-12 -7,-4 0,0 C7,-4 7,-12 0,-12 Z" fill="#f5a623" />
              <circle cx={0} cy={-8} r={3} fill="#0a1520" />
            </g>
            {/* Site label */}
            <text x={sitePt.x} y={sitePt.y + 6} textAnchor="middle" fontSize={8} fill="#5a7a90" fontFamily="Inter, sans-serif">
              {primary.siteName.split('—')[0].trim()}
            </text>

            {/* Animated drone */}
            <g ref={droneRef} transform={`translate(${nestPt.x + (sitePt.x - nestPt.x) * 0.35},${nestPt.y + (sitePt.y - nestPt.y) * 0.35})`}>
              {/* Halo */}
              <circle cx={0} cy={0} r={10} fill="rgba(21,116,182,0.2)" />
              {/* Body */}
              <circle cx={0} cy={0} r={5} fill="#1574b6" />
              <circle cx={0} cy={0} r={3} fill="#338fce" />
              {primary.platform === 'P2' ? (
                <>
                  <line x1={-8} y1={-8} x2={-3} y2={-3} stroke="#c8dce8" strokeWidth={1.2} strokeLinecap="round" />
                  <line x1={8}  y1={-8} x2={3}  y2={-3} stroke="#c8dce8" strokeWidth={1.2} strokeLinecap="round" />
                  <line x1={-8} y1={8}  x2={-3} y2={3}  stroke="#c8dce8" strokeWidth={1.2} strokeLinecap="round" />
                  <line x1={8}  y1={8}  x2={3}  y2={3}  stroke="#c8dce8" strokeWidth={1.2} strokeLinecap="round" />
                  <circle cx={-8} cy={-8} r={2} fill="#5a7a90" />
                  <circle cx={8}  cy={-8} r={2} fill="#5a7a90" />
                  <circle cx={-8} cy={8}  r={2} fill="#5a7a90" />
                  <circle cx={8}  cy={8}  r={2} fill="#5a7a90" />
                </>
              ) : (
                <>
                  <line x1={-9} y1={0} x2={9} y2={0} stroke="#c8dce8" strokeWidth={1.5} strokeLinecap="round" />
                  <line x1={0} y1={-6} x2={0} y2={6} stroke="#c8dce8" strokeWidth={1} strokeLinecap="round" />
                </>
              )}
              {/* Centre pip */}
              <circle cx={0} cy={0} r={1.8} fill="white" />
            </g>
          </svg>

          {/* Footer strip */}
          <div style={{
            padding: '6px 10px',
            background: '#0d1b2a',
            borderTop: '1px solid #1a3a50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={10} style={{ color: '#1574b6' }} />
              <span style={{ fontSize: 10, color: '#5a7a90', fontFamily: 'JetBrains Mono, monospace' }}>
                {primary.platform}
              </span>
              <span style={{ fontSize: 10, color: '#c8dce8', fontFamily: 'JetBrains Mono, monospace' }}>
                {primary.drone_serial}
              </span>
            </div>
            {activeFlights.length > 1 && (
              <span style={{ fontSize: 9, color: '#5a7a90' }}>+{activeFlights.length - 1} more</span>
            )}
            {etaStr && (
              <span style={{ fontSize: 10, color: '#338fce', fontFamily: 'JetBrains Mono, monospace' }}>
                ETA {etaStr}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
