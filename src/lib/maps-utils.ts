export function getNavigationUrls(latitude: number, longitude: number, label?: string) {
  const encodedLabel = encodeURIComponent(label || 'Destino de Entrega Only')
  return {
    googleMapsApp: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`,
    wazeApp: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
    appleMaps: `maps://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodedLabel}`,
    coordsQuery: `${latitude},${longitude}`
  }
}

export function openExternalNavigation(latitude: number, longitude: number, app: 'google' | 'waze' | 'apple' = 'google') {
  const urls = getNavigationUrls(latitude, longitude)
  let targetUrl = urls.googleMapsApp

  if (app === 'waze') {
    targetUrl = urls.wazeApp
  } else if (app === 'apple') {
    targetUrl = urls.appleMaps
  }

  window.open(targetUrl, '_blank')
}
