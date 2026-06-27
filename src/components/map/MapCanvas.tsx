import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import circle from '@turf/circle'
import { useStore } from '../../store'
import { LayerToggles } from './LayerToggles'
import { EntityPopup } from './EntityPopup'
import type { Nest, Facility, Flight } from '../../types'
import osmPoisGeoJSON from '../../mock-data/facilities-osm.json'

const STADIA_STYLES = {
  dark:  'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
  light: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
}

// ─── Drone SVG marker (animated) ──────────────────────────────────────────
function createDroneMarkerEl(platform: 'P1' | 'P2', inFlight: boolean): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'drone-marker'
  wrapper.style.cssText = 'position:relative;cursor:pointer;'

  const size = platform === 'P2' ? 28 : 32
  wrapper.innerHTML = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      ${inFlight ? `
        <div style="
          position:absolute;inset:-8px;border-radius:50%;
          background:radial-gradient(circle,rgba(21,116,182,0.25) 0%,transparent 70%);
          animation:dronePulse 2s ease-out infinite;
        "></div>
      ` : ''}
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Platform body -->
        <circle cx="16" cy="16" r="${platform === 'P2' ? 6 : 7}" fill="#1574b6" />
        <circle cx="16" cy="16" r="${platform === 'P2' ? 4 : 5}" fill="#338fce" />
        ${platform === 'P1' ? `
          <!-- P1 fixed-wing silhouette -->
          <path d="M5 16 H27 M16 8 L16 24" stroke="#c8dce8" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M8 14 L16 10 L24 14" fill="none" stroke="#c8dce8" stroke-width="1" stroke-linecap="round"/>
        ` : `
          <!-- P2 quadrotor arms -->
          <line x1="8" y1="8"   x2="13" y2="13" stroke="#c8dce8" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="24" y1="8"  x2="19" y2="13" stroke="#c8dce8" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="8" y1="24"  x2="13" y2="19" stroke="#c8dce8" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="24" y1="24" x2="19" y2="19" stroke="#c8dce8" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="8"  cy="8"  r="2.5" fill="#5a7a90"/>
          <circle cx="24" cy="8"  r="2.5" fill="#5a7a90"/>
          <circle cx="8"  cy="24" r="2.5" fill="#5a7a90"/>
          <circle cx="24" cy="24" r="2.5" fill="#5a7a90"/>
        `}
        <!-- Centre dot -->
        <circle cx="16" cy="16" r="2.5" fill="white"/>
      </svg>
    </div>
  `
  return wrapper
}

function createNestMarkerEl(operational: boolean): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = 'cursor:pointer;'
  el.innerHTML = `
    <div style="
      width:28px;height:28px;
      background:#1574b6;
      clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
      display:flex;align-items:center;justify-content:center;
      opacity:${operational ? 1 : 0.45};
      box-shadow:0 0 12px rgba(21,116,182,0.5);
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" fill="white" stroke="none"/>
      </svg>
    </div>
  `
  return el
}

function createFacilityMarkerEl(tier: 1 | 2 | 3): HTMLElement {
  const sizes: Record<number, number> = { 1: 14, 2: 11, 3: 8 }
  const size = sizes[tier] ?? 10
  const el = document.createElement('div')
  el.style.cssText = 'cursor:pointer;'
  el.innerHTML = `
    <div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:#00c97a;
      border:2px solid rgba(0,201,122,0.4);
      box-shadow:0 0 ${size}px rgba(0,201,122,0.4);
    "></div>
  `
  return el
}

function createDropSiteMarkerEl(): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = 'cursor:pointer;'
  el.innerHTML = `
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
      <path d="M10 0C4.477 0 0 4.477 0 10c0 7.5 10 14 10 14s10-6.5 10-14C20 4.477 15.523 0 10 0z" fill="#f5a623"/>
      <circle cx="10" cy="10" r="4" fill="#0D1B2A"/>
    </svg>
  `
  return el
}

interface Props {
  onEntityClick?: (id: string, type: 'nest' | 'facility' | 'dropsite' | 'kfz' | 'flight') => void
  filterNestId?: string | null
  filteredFacilityIds?: string[]
  showPopups?: boolean
  height?: string
}

export function MapCanvas({ onEntityClick, filterNestId, filteredFacilityIds, showPopups = true, height = '100%' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const droneMarkersRef = useRef<maplibregl.Marker[]>([])
  const animFrameRef = useRef<number>(0)
  const animProgressRef = useRef<Record<string, number>>({})

  const { nests, facilities, kfz, flights, dropSites, layerToggles, mapCenter, mapZoom, mapStyle, setSelected, setQuickDispatchTarget, flyTo } = useStore()

  // ─── Init map ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: STADIA_STYLES[mapStyle],
      center: mapCenter as [number, number],
      zoom: mapZoom,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-left')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    map.on('load', () => {
      addKFZLayers(map)
      addServiceAreaLayers(map)
      addRouteLines(map)
      addPOILayers(map)
    })

    // Force resize after mount so MapLibre measures the real container size
    requestAnimationFrame(() => map.resize())

    // Keep resize in sync with container changes (flex layout shifts, window resize)
    const ro = new ResizeObserver(() => map.resize())
    if (mapRef.current) ro.observe(mapRef.current)

    mapInstanceRef.current = map
    return () => {
      ro.disconnect()
      cancelAnimationFrame(animFrameRef.current)
      map.remove()
      mapInstanceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Sync map center when store changes ──────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    map.flyTo({ center: mapCenter as [number, number], zoom: mapZoom, duration: 800, essential: true })
  }, [mapCenter, mapZoom])

  // ─── Style switching (dark ↔ light) ──────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !map.loaded()) return
    map.setStyle(STADIA_STYLES[mapStyle])
    // Re-add all custom layers after style loads (sources/layers are wiped on style change)
    map.once('style.load', () => {
      addKFZLayers(map)
      addServiceAreaLayers(map)
      addRouteLines(map)
      addPOILayers(map)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle])

  // ─── KFZ polygon layers ───────────────────────────────────────────────────
  const addKFZLayers = useCallback((map: maplibregl.Map) => {
    const hardFeatures   = kfz.filter(z => z.severity === 'hard_exclusion' && z.is_active).map(z => circle([z.lng, z.lat], z.radius_km, { units: 'kilometers', properties: z }))
    const advFeatures    = kfz.filter(z => z.severity === 'advisory'       && z.is_active).map(z => circle([z.lng, z.lat], z.radius_km, { units: 'kilometers', properties: z }))

    if (!map.getSource('kfz-hard')) {
      map.addSource('kfz-hard', { type: 'geojson', data: { type: 'FeatureCollection', features: hardFeatures } })
      map.addLayer({ id: 'kfz-hard-fill', type: 'fill',   source: 'kfz-hard', paint: { 'fill-color': 'rgba(232,57,74,0.2)',   'fill-opacity': 1 } })
      map.addLayer({ id: 'kfz-hard-line', type: 'line',   source: 'kfz-hard', paint: { 'line-color': '#e8394a', 'line-width': 1.5, 'line-dasharray': [3,2] } })
    }
    if (!map.getSource('kfz-adv')) {
      map.addSource('kfz-adv', { type: 'geojson', data: { type: 'FeatureCollection', features: advFeatures } })
      map.addLayer({ id: 'kfz-adv-fill', type: 'fill',   source: 'kfz-adv', paint: { 'fill-color': 'rgba(245,166,35,0.12)', 'fill-opacity': 1 } })
      map.addLayer({ id: 'kfz-adv-line', type: 'line',   source: 'kfz-adv', paint: { 'line-color': '#f5a623', 'line-width': 1,   'line-dasharray': [4,2] } })
    }
  }, [kfz])

  // ─── OSM POI cluster layers ───────────────────────────────────────────────
  const addPOILayers = useCallback((map: maplibregl.Map) => {
    if (map.getSource('pois-source')) return

    map.addSource('pois-source', {
      type: 'geojson',
      data: osmPoisGeoJSON as GeoJSON.FeatureCollection,
      cluster: true,
      clusterMaxZoom: 9,
      clusterRadius: 45,
    })

    // Cluster circles
    map.addLayer({
      id: 'pois-clusters',
      type: 'circle',
      source: 'pois-source',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          '#1574b6', 10, '#338fce', 50, '#00c97a',
        ],
        'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 50, 22],
        'circle-opacity': 0.8,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(255,255,255,0.25)',
      },
    })

    // Cluster count label
    map.addLayer({
      id: 'pois-cluster-count',
      type: 'symbol',
      source: 'pois-source',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Stadia Regular'],
        'text-size': 11,
      },
      paint: { 'text-color': '#ffffff' },
    })

    // Individual unclustered points (zoom ≥ 8)
    map.addLayer({
      id: 'pois-unclustered',
      type: 'circle',
      source: 'pois-source',
      filter: ['!', ['has', 'point_count']],
      minzoom: 8,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 13, 7],
        'circle-color': [
          'match', ['get', 'type'],
          'hospital', '#e8394a',
          'phc',      '#00c97a',
          'school',   '#f5a623',
          'market',   '#b27cff',
          '#888',
        ],
        'circle-opacity': 0.85,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255,255,255,0.3)',
      },
    })

    // Name labels at zoom ≥ 11.5
    map.addLayer({
      id: 'pois-labels',
      type: 'symbol',
      source: 'pois-source',
      filter: ['!', ['has', 'point_count']],
      minzoom: 11.5,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Stadia Regular'],
        'text-size': 10,
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
        'text-max-width': 10,
      },
      paint: {
        'text-color': '#c8dce8',
        'text-halo-color': '#0d1b2a',
        'text-halo-width': 1.5,
      },
    })

    // Expand cluster on click
    map.on('click', 'pois-clusters', async (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['pois-clusters'] })
      if (!features.length) return
      const clusterId = features[0].properties?.cluster_id as number
      const src = map.getSource('pois-source') as maplibregl.GeoJSONSource
      try {
        const zoom = await src.getClusterExpansionZoom(clusterId)
        const geom = features[0].geometry as GeoJSON.Point
        map.easeTo({ center: geom.coordinates as [number, number], zoom })
      } catch { /* ignore */ }
    })

    // Click individual POI → set quick dispatch target
    map.on('click', 'pois-unclustered', (e) => {
      const f = e.features?.[0]
      if (!f) return
      const { name, type } = f.properties as { name: string; type: string }
      const geom = f.geometry as GeoJSON.Point
      const [lng, lat] = geom.coordinates
      setQuickDispatchTarget({ name, lat, lng })
      flyTo(lat, lng, 14)
      // Show a minimal tooltip popup
      new maplibregl.Popup({ closeButton: true, className: 'oea-map-popup', maxWidth: '240px' })
        .setLngLat([lng, lat])
        .setHTML(`
          <div style="padding:8px 10px;background:#102030;border:1px solid #1a3a50;border-radius:3px;font-family:Inter,sans-serif;">
            <div style="font-size:11px;font-weight:700;color:#e8f4fd;margin-bottom:4px;">${name}</div>
            <div style="font-size:10px;color:#5a7a90;text-transform:uppercase;letter-spacing:.05em;">${type}</div>
            <div style="margin-top:8px;font-size:10px;color:#338fce;">↑ Quick Dispatch panel ready</div>
          </div>
        `)
        .addTo(map)
    })

    map.on('mouseenter', 'pois-clusters',     () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'pois-clusters',     () => { map.getCanvas().style.cursor = '' })
    map.on('mouseenter', 'pois-unclustered',  () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'pois-unclustered',  () => { map.getCanvas().style.cursor = '' })
  }, [setQuickDispatchTarget, flyTo])

  // ─── Service area rings ───────────────────────────────────────────────────
  const addServiceAreaLayers = useCallback((map: maplibregl.Map) => {
    const p1Features = nests.filter(n => n.operational).map(n => circle([n.lng, n.lat], n.service_radius_p1_km, { units: 'kilometers', properties: { nest_id: n.nest_id } }))
    const p2Features = nests.filter(n => n.operational && n.service_radius_p2_km).map(n => circle([n.lng, n.lat], n.service_radius_p2_km!, { units: 'kilometers', properties: { nest_id: n.nest_id } }))

    if (!map.getSource('service-p1')) {
      map.addSource('service-p1', { type: 'geojson', data: { type: 'FeatureCollection', features: p1Features } })
      map.addLayer({ id: 'service-p1-fill', type: 'fill', source: 'service-p1', paint: { 'fill-color': 'rgba(21,116,182,0.06)', 'fill-opacity': 1 } })
      map.addLayer({ id: 'service-p1-line', type: 'line', source: 'service-p1', paint: { 'line-color': '#1574b6', 'line-width': 1, 'line-opacity': 0.4, 'line-dasharray': [6,3] } })
    }
    if (!map.getSource('service-p2')) {
      map.addSource('service-p2', { type: 'geojson', data: { type: 'FeatureCollection', features: p2Features } })
      map.addLayer({ id: 'service-p2-fill', type: 'fill', source: 'service-p2', paint: { 'fill-color': 'rgba(51,143,206,0.1)', 'fill-opacity': 1 } })
      map.addLayer({ id: 'service-p2-line', type: 'line', source: 'service-p2', paint: { 'line-color': '#338fce', 'line-width': 1, 'line-opacity': 0.5 } })
    }
  }, [nests])

  // ─── Static route lines (dotted, from nest to site) ───────────────────────
  const addRouteLines = useCallback((map: maplibregl.Map) => {
    const routeFeatures = flights
      .filter(f => f.status === 'in_flight' || f.status === 'validated')
      .map(f => {
        const nest = nests.find(n => n.nest_id === f.nest_id)
        const site = dropSites.find(s => s.site_id === f.site_id)
        if (!nest || !site) return null
        return {
          type: 'Feature' as const,
          properties: { delivery_id: f.delivery_id, status: f.status },
          geometry: { type: 'LineString' as const, coordinates: [[nest.lng, nest.lat], [site.lng, site.lat]] },
        }
      })
      .filter(Boolean)

    if (!map.getSource('routes')) {
      map.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: routeFeatures as unknown[] as GeoJSON.Feature[] } })
      map.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'routes',
        paint: {
          'line-color': '#338fce',
          'line-width': 2,
          'line-opacity': 0.7,
          'line-dasharray': [4, 3],
        },
      })
    }
  }, [flights, nests, dropSites])

  // ─── Layer visibility toggling ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !map.loaded()) return

    const toggle = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
      }
    }

    toggle('kfz-hard-fill', layerToggles.kfz)
    toggle('kfz-hard-line', layerToggles.kfz)
    toggle('kfz-adv-fill',  layerToggles.kfz)
    toggle('kfz-adv-line',  layerToggles.kfz)
    toggle('service-p1-fill', layerToggles.serviceAreas)
    toggle('service-p1-line', layerToggles.serviceAreas)
    toggle('service-p2-fill', layerToggles.serviceAreas)
    toggle('service-p2-line', layerToggles.serviceAreas)
    toggle('routes-line', layerToggles.flightTracks)
    toggle('pois-clusters',       layerToggles.pois)
    toggle('pois-cluster-count',  layerToggles.pois)
    toggle('pois-unclustered',    layerToggles.pois)
    toggle('pois-labels',         layerToggles.pois)
  }, [layerToggles])

  // ─── Nest markers ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (!layerToggles.nests) return

    const displayNests = filterNestId ? nests.filter(n => n.nest_id === filterNestId) : nests

    displayNests.forEach((nest: Nest) => {
      const el = createNestMarkerEl(nest.operational)
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([nest.lng, nest.lat])
        .addTo(map)

      el.addEventListener('click', () => {
        setSelected(nest.nest_id, 'nest')
        onEntityClick?.(nest.nest_id, 'nest')
        map.flyTo({ center: [nest.lng, nest.lat], zoom: 10, duration: 600 })
      })

      markersRef.current.push(marker)
    })
  }, [nests, layerToggles.nests, filterNestId, setSelected, onEntityClick])

  // ─── Facility markers ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !layerToggles.facilities) return

    const displayFacilities = filteredFacilityIds
      ? facilities.filter(f => filteredFacilityIds.includes(f.facility_id))
      : facilities

    displayFacilities.forEach((fac: Facility) => {
      const el = createFacilityMarkerEl(fac.priority_tier)
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([fac.lng, fac.lat])
        .addTo(map)

      el.addEventListener('click', () => {
        setSelected(fac.facility_id, 'facility')
        onEntityClick?.(fac.facility_id, 'facility')
        map.flyTo({ center: [fac.lng, fac.lat], zoom: 13, duration: 600 })
      })

      markersRef.current.push(marker)
    })
  }, [facilities, layerToggles.facilities, filteredFacilityIds, setSelected, onEntityClick])

  // ─── Drop site markers ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !layerToggles.dropSites) return

    dropSites.forEach((site) => {
      const el = createDropSiteMarkerEl()
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([site.lng, site.lat])
        .addTo(map)

      el.addEventListener('click', () => {
        setSelected(site.site_id, 'dropsite')
        onEntityClick?.(site.site_id, 'dropsite')
        map.flyTo({ center: [site.lng, site.lat], zoom: 14, duration: 600 })
      })

      markersRef.current.push(marker)
    })
  }, [dropSites, layerToggles.dropSites, setSelected, onEntityClick])

  // ─── Drone animation system ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !layerToggles.flightTracks) return

    droneMarkersRef.current.forEach(m => m.remove())
    droneMarkersRef.current = []
    cancelAnimationFrame(animFrameRef.current)

    const activeFlights = flights.filter(f => f.status === 'in_flight')

    activeFlights.forEach((flight: Flight) => {
      const nest = nests.find(n => n.nest_id === flight.nest_id)
      const site = dropSites.find(s => s.site_id === flight.site_id)
      if (!nest || !site) return

      if (!(flight.delivery_id in animProgressRef.current)) {
        // Start mid-route for in-progress flights
        animProgressRef.current[flight.delivery_id] = 0.35
      }

      const el = createDroneMarkerEl(flight.platform, true)
      const startLng = nest.lng, startLat = nest.lat
      const endLng = site.lng, endLat = site.lat

      const t = animProgressRef.current[flight.delivery_id]
      const initLng = startLng + (endLng - startLng) * t
      const initLat = startLat + (endLat - startLat) * t

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([initLng, initLat])
        .addTo(map)

      el.addEventListener('click', () => {
        setSelected(flight.delivery_id, 'flight')
        onEntityClick?.(flight.delivery_id, 'flight')
      })

      droneMarkersRef.current.push(marker)
    })

    // Animate all drones together in a single rAF loop
    let lastTime = performance.now()
    const SPEED = 0.000055 // fraction of route per ms

    const animate = (now: number) => {
      const dt = now - lastTime
      lastTime = now

      activeFlights.forEach((flight, i) => {
        const nest = nests.find(n => n.nest_id === flight.nest_id)
        const site = dropSites.find(s => s.site_id === flight.site_id)
        if (!nest || !site) return

        let t = (animProgressRef.current[flight.delivery_id] ?? 0.35) + SPEED * dt
        if (t >= 1) t = 0 // loop for demo
        animProgressRef.current[flight.delivery_id] = t

        const lng = nest.lng + (site.lng - nest.lng) * t
        const lat = nest.lat + (site.lat - nest.lat) * t

        const marker = droneMarkersRef.current[i]
        if (marker) marker.setLngLat([lng, lat])
      })

      animFrameRef.current = requestAnimationFrame(animate)
    }

    if (activeFlights.length > 0) {
      animFrameRef.current = requestAnimationFrame(animate)
    }

    return () => cancelAnimationFrame(animFrameRef.current)
  }, [flights, nests, dropSites, layerToggles.flightTracks, setSelected, onEntityClick])

  return (
    <div style={{ position:'relative', width:'100%', height: height === '100%' ? '100%' : height, minHeight:0, flex:'1 1 0' }}>
      <div ref={mapRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} />
      {showPopups && (
        <>
          <LayerToggles />
          <EntityPopup />
        </>
      )}
      {/* POI legend */}
      {showPopups && layerToggles.pois && (
        <div
          className="absolute bottom-8 left-10 pointer-events-none"
          style={{
            background: mapStyle === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(13,27,42,0.9)',
            border: `1px solid ${mapStyle === 'light' ? '#d1d5db' : '#1a3a50'}`,
            borderRadius: 4,
            padding: '8px 10px',
            fontSize: 9,
          }}
        >
          <div style={{ fontWeight: 700, color: mapStyle === 'light' ? '#1f2937' : '#e8f4fd', fontSize: 10, marginBottom: 6 }}>Facilities</div>
          {[
            { color: '#e8394a', label: 'Hospital' },
            { color: '#00c97a', label: 'PHC / Clinic' },
            { color: '#f5a623', label: 'School' },
            { color: '#b27cff', label: 'Market' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ color: mapStyle === 'light' ? '#4b5563' : '#5a7a90' }}>{label}</span>
            </div>
          ))}
          <div style={{ fontSize: 8, color: mapStyle === 'light' ? '#9ca3af' : '#3a5a70', borderTop: `1px solid ${mapStyle === 'light' ? '#e5e7eb' : '#1a3a50'}`, paddingTop: 5, marginTop: 3 }}>
            Zoom in to see names
          </div>
        </div>
      )}
    </div>
  )
}
