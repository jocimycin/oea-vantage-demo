import { create } from 'zustand'
import type { AppStore, EntityType, OsmPoi } from '../types'
import distance from '@turf/distance'
import { point } from '@turf/helpers'

import nestsData      from '../mock-data/nests.json'
import facilitiesData from '../mock-data/facilities.json'
import kfzData        from '../mock-data/kfz.json'
import flightsData    from '../mock-data/flights.json'
import weatherData    from '../mock-data/weather.json'
import analyticsData  from '../mock-data/analytics.json'
import dropSitesData  from '../mock-data/drop-sites.json'
import dronesData     from '../mock-data/drones.json'
import permitsData    from '../mock-data/permits.json'
import osmPoisRaw     from '../mock-data/facilities-osm.json'

// Map GeoJSON features to OsmPoi[]
const osmPoisData: OsmPoi[] = (osmPoisRaw as unknown as { features: { properties: { id: string; name: string; type: string; state: string; city: string }; geometry: { coordinates: number[] } }[] }).features.map(f => ({
  id:    f.properties.id,
  name:  f.properties.name,
  type:  f.properties.type as OsmPoi['type'],
  state: f.properties.state,
  city:  f.properties.city,
  lat:   f.geometry.coordinates[1]!,
  lng:   f.geometry.coordinates[0]!,
}))

// Pre-compute nearest drop site for each POI
const dropSites = dropSitesData as AppStore['dropSites']
function nearestApprovedSite(lat: number, lng: number): string | undefined {
  const approved = dropSites.filter(s => s.survey_status === 'approved')
  if (!approved.length) return undefined
  const p = point([lng, lat])
  let nearest = approved[0]
  let minD = Infinity
  approved.forEach(s => {
    const d = distance(p, point([s.lng, s.lat]), { units: 'kilometers' })
    if (d < minD) { minD = d; nearest = s }
  })
  return nearest.site_id
}

export const useStore = create<AppStore>((set) => ({
  nests:      nestsData      as AppStore['nests'],
  facilities: facilitiesData as AppStore['facilities'],
  kfz:        kfzData        as AppStore['kfz'],
  flights:    flightsData    as AppStore['flights'],
  weather:    weatherData    as AppStore['weather'],
  analytics:  analyticsData  as AppStore['analytics'],
  dropSites:  dropSitesData  as AppStore['dropSites'],
  drones:     dronesData     as AppStore['drones'],
  permits:    permitsData    as AppStore['permits'],
  osmPois:    osmPoisData,

  selectedEntityId:    null,
  selectedEntityType:  null,
  mapCenter: [8.6753, 9.082],
  mapZoom:   6,
  quickDispatchTarget: null,
  mapStyle: 'dark' as const,

  layerToggles: {
    facilities:   true,
    nests:        true,
    dropSites:    true,
    kfz:          true,
    serviceAreas: true,
    flightTracks: true,
    pois:         true,
  },

  setSelected: (id, type) => set({ selectedEntityId: id, selectedEntityType: type as EntityType }),

  flyTo: (lat, lng, zoom = 12) =>
    set({ mapCenter: [lng, lat], mapZoom: zoom }),

  toggleLayer: (layer) =>
    set((s) => ({
      layerToggles: { ...s.layerToggles, [layer]: !s.layerToggles[layer] },
    })),

  addFlight: (flight) =>
    set((s) => ({ flights: [flight, ...s.flights] })),

  setQuickDispatchTarget: (target) => {
    if (!target) { set({ quickDispatchTarget: null }); return }
    const suggestedSiteId = nearestApprovedSite(target.lat, target.lng)
    set({ quickDispatchTarget: { ...target, suggestedSiteId } })
  },

  setMapStyle: (style) => set({ mapStyle: style }),
}))
