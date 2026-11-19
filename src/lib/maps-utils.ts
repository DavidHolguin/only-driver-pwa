export interface ParadaNavegacion {
  latitude?: number | null
  longitude?: number | null
  lat?: number | null
  lng?: number | null
  address?: string
  direccion?: string
  city?: string
  ciudad?: string
}

/**
 * Genera el enlace de navegación para una parada:
 * - Si tiene coordenadas válidas: ruta directa a destino (Google Maps Dir).
 * - Si no tiene coordenadas: búsqueda por dirección y ciudad en Colombia (Google Maps Search).
 * Nunca devuelve coordenadas ni puntos inventados.
 */
export function enlaceNavegacion(parada: ParadaNavegacion): string {
  const lat = parada.latitude ?? parada.lat
  const lng = parada.longitude ?? parada.lng

  if (
    lat !== null &&
    lat !== undefined &&
    lng !== null &&
    lng !== undefined &&
    !Number.isNaN(Number(lat)) &&
    !Number.isNaN(Number(lng))
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  }

  const direccion = (parada.address ?? parada.direccion ?? '').trim()
  const ciudad = (parada.city ?? parada.ciudad ?? '').trim()
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}, ${ciudad}, Colombia`
}

/**
 * Abre la navegación externa en una pestaña o app nativa.
 * Compatible tanto pasando el objeto de la parada/pedido como pasando coordenadas sueltas.
 */
export function openExternalNavigation(
  orderOrLat?: ParadaNavegacion | number | null,
  lngOrApp?: number | null | string,
  _app?: string,
  _label?: string
): void {
  let url: string

  if (typeof orderOrLat === 'object' && orderOrLat !== null) {
    url = enlaceNavegacion(orderOrLat)
  } else if (typeof orderOrLat === 'number' && typeof lngOrApp === 'number') {
    url = enlaceNavegacion({ latitude: orderOrLat, longitude: lngOrApp })
  } else {
    url = enlaceNavegacion({
      latitude: null,
      longitude: null,
      address: _label || (typeof lngOrApp === 'string' ? lngOrApp : '')
    })
  }

  window.open(url, '_blank')
}
