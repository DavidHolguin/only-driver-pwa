export function getNavigationUrls(latitude: number, longitude: number, label?: string) {
  const encodedLabel = encodeURIComponent(label || 'Destino de Entrega Only')
  return {
    // Google Maps Navigation Intent directo (inicia guiado por voz en celular)
    googleMapsApp: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving&dir_action=navigate`,
    wazeApp: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
    appleMaps: `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d&q=${encodedLabel}`,
    coordsQuery: `${latitude},${longitude}`
  }
}

export function openExternalNavigation(latitude: number, longitude: number, app: 'google' | 'waze' | 'apple' = 'google', label?: string) {
  const urls = getNavigationUrls(latitude, longitude, label)
  let targetUrl = urls.googleMapsApp

  if (app === 'waze') {
    targetUrl = urls.wazeApp
  } else if (app === 'apple') {
    targetUrl = urls.appleMaps
  }

  window.open(targetUrl, '_blank')
}
