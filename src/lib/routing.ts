/**
 * Servicio de ruteo por carretera real (OSRM / OpenStreetMap)
 * Genera la geometría exacta de las carreteras que sigue el conductor
 */
export async function fetchRoadRouteGeometry(
  points: [number, number][] // [[lat, lng], [lat, lng], ...]
): Promise<[number, number][]> {
  if (points.length < 2) return points

  try {
    // OSRM espera lon,lat;lon,lat...
    // Limitar a los primeros 25 puntos para evitar URLs demasiado largas
    const sample = points.slice(0, 25)
    const coordString = sample.map(p => `${p[1]},${p[0]}`).join(';')
    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) throw new Error('OSRM status ' + res.status)

    const json = await res.json()
    if (json.code === 'Ok' && json.routes && json.routes.length > 0) {
      // OSRM devuelve [lon, lat], convertir a [lat, lon] para Leaflet
      const geojsonCoords: [number, number][] = json.routes[0].geometry.coordinates
      return geojsonCoords.map(c => [c[1], c[0]])
    }
  } catch (err) {
    console.warn('[Routing] Fallback to direct polyline:', err)
  }

  return points
}
