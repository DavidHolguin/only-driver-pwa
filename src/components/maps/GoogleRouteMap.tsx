import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { DeliveryOrder, TelemetryPoint } from '../../types/delivery'
import { fetchRoadRouteGeometry } from '../../lib/routing'
import { LocateFixed, Layers, Maximize2, Minimize2, Navigation, Compass } from 'lucide-react'

interface GoogleRouteMapProps {
  driverCoords: TelemetryPoint
  orders: DeliveryOrder[]
  selectedOrderId?: string
  onSelectOrder?: (orderId: string) => void
  interactive?: boolean
  className?: string
  height?: string
  allowFullscreenToggle?: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export const GoogleRouteMap: React.FC<GoogleRouteMapProps> = ({
  driverCoords,
  orders,
  selectedOrderId,
  onSelectOrder,
  interactive = true,
  className = '',
  height = '350px',
  allowFullscreenToggle = true,
  isExpanded: externalIsExpanded,
  onToggleExpand: externalOnToggleExpand
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalExpanded
  const handleToggleExpand = externalOnToggleExpand || (() => setInternalExpanded(prev => !prev))

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const driverMarkerRef = useRef<L.Marker | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const routePolylineRef = useRef<L.Polyline | null>(null)
  const [isNavigatingRoad, setIsNavigatingRoad] = useState(false)

  // Inicializar mapa interactivo (Estilo Google Maps Vectorial Clean)
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [driverCoords.latitude, driverCoords.longitude],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      })

      // Tile layer de alta definición inspirado en la paleta oficial de Google Maps
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd'
      }).addTo(map)

      markersLayerRef.current = L.layerGroup().addTo(map)
      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Invalidar tamaño al expandir / minimizar para redibujar el canvas
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [isExpanded])

  // Actualizar marcador del conductor en tiempo real con brújula/dirección
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const driverIcon = L.divIcon({
      className: 'driver-live-marker',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10">
          <div class="absolute w-10 h-10 bg-sky-500/30 rounded-full animate-ping"></div>
          <div class="relative flex items-center justify-center w-8 h-8 bg-[#001F36] border-2 border-white rounded-full shadow-2xl text-white">
            <svg class="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L19 21L12 17L5 21L12 2Z" style="transform: rotate(${driverCoords.heading || 0}deg); transform-origin: center;"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker([driverCoords.latitude, driverCoords.longitude], {
        icon: driverIcon,
        zIndexOffset: 1000
      }).addTo(map)
    } else {
      driverMarkerRef.current.setLatLng([driverCoords.latitude, driverCoords.longitude])
      driverMarkerRef.current.setIcon(driverIcon)
    }
  }, [driverCoords])

  // Actualizar marcadores de pedidos y trazado real por carretera (Google Maps Driving)
  useEffect(() => {
    const map = mapInstanceRef.current
    const layer = markersLayerRef.current
    if (!map || !layer) return

    layer.clearLayers()

    // Waypoints ordenados por secuencia
    const pendingOrders = orders
      .filter(o => o.status !== 'delivered' && o.status !== 'failed')
      .sort((a, b) => a.sequence_order - b.sequence_order)

    const waypoints: [number, number][] = [
      [driverCoords.latitude, driverCoords.longitude],
      ...pendingOrders.map(o => [o.latitude, o.longitude] as [number, number])
    ]

    orders.forEach((order) => {
      const isSelected = order.id === selectedOrderId
      const isDelivered = order.status === 'delivered'
      const isFailed = order.status === 'failed'
      const isNext = order.status === 'next' || order.status === 'in_transit'

      let bgBadge = 'bg-[#003B66]'
      let ringStyle = ''
      if (isDelivered) bgBadge = 'bg-emerald-600'
      else if (isFailed) bgBadge = 'bg-rose-600'
      else if (isNext) {
        bgBadge = 'bg-amber-500 text-slate-950 font-extrabold'
        ringStyle = 'ring-4 ring-amber-300/80 animate-pulse'
      }

      if (isSelected) {
        ringStyle += ' scale-125 ring-4 ring-sky-500'
      }

      const pinIcon = L.divIcon({
        className: 'order-stop-marker',
        html: `
          <div class="flex flex-col items-center cursor-pointer transition-transform duration-200">
            <div class="flex items-center justify-center w-8 h-8 ${bgBadge} ${ringStyle} text-white rounded-full shadow-lg font-mono text-xs font-bold border-2 border-white">
              ${isDelivered ? '✓' : order.sequence_order}
            </div>
            <div class="w-1.5 h-1.5 bg-[#001F36] rounded-full mt-0.5 opacity-60"></div>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 38]
      })

      const marker = L.marker([order.latitude, order.longitude], { icon: pinIcon })

      marker.on('click', () => {
        if (onSelectOrder) {
          onSelectOrder(order.id)
        }
      })

      layer.addLayer(marker)
    })

    // Consultar geometría de carretera real por OSRM
    if (waypoints.length > 1) {
      setIsNavigatingRoad(true)
      fetchRoadRouteGeometry(waypoints).then((roadCoords) => {
        if (routePolylineRef.current && map) {
          map.removeLayer(routePolylineRef.current)
        }

        // Trazado estilo navegación asistida Google Maps (Línea azul brillante de alta visibilidad)
        routePolylineRef.current = L.polyline(roadCoords as L.LatLngExpression[], {
          color: '#1a73e8', // Google Maps Primary Blue
          weight: 6,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map)

        setIsNavigatingRoad(false)
      }).catch(() => {
        setIsNavigatingRoad(false)
      })
    } else {
      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current)
      }
    }
  }, [orders, selectedOrderId, driverCoords, onSelectOrder])

  // Centrar mapa en conductor
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([driverCoords.latitude, driverCoords.longitude], 16, {
        duration: 0.8
      })
    }
  }

  // Ajustar vista para encuadrar toda la ruta
  const handleFitRoute = () => {
    if (!mapInstanceRef.current || orders.length === 0) return
    const points: L.LatLngExpression[] = [
      [driverCoords.latitude, driverCoords.longitude],
      ...orders.map((o) => [o.latitude, o.longitude] as [number, number])
    ]
    const bounds = L.latLngBounds(points)
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
  }

  const containerHeight = isExpanded ? 'calc(100vh - 120px)' : height

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-border shadow-card bg-slate-100 transition-all duration-300 ${
        isExpanded ? 'fixed inset-x-2 top-16 z-50 h-[calc(100vh-80px)] shadow-2xl' : ''
      } ${className}`}
      style={{ height: isExpanded ? 'calc(100vh - 90px)' : containerHeight }}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls for Driver */}
      {interactive && (
        <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
          {allowFullscreenToggle && (
            <button
              onClick={handleToggleExpand}
              aria-label={isExpanded ? 'Minimizar mapa' : 'Ampliar mapa a pantalla completa'}
              className="p-3 bg-white/95 backdrop-blur shadow-lg rounded-2xl text-[#001F36] hover:bg-slate-50 active:scale-95 transition-all border border-border flex items-center justify-center"
            >
              {isExpanded ? (
                <Minimize2 className="w-5 h-5 text-slate-800" />
              ) : (
                <Maximize2 className="w-5 h-5 text-[#001F36]" />
              )}
            </button>
          )}

          <button
            onClick={handleRecenter}
            aria-label="Centrar en mi ubicación"
            className="p-3 bg-white/95 backdrop-blur shadow-lg rounded-2xl text-[#001F36] hover:bg-slate-50 active:scale-95 transition-all border border-border"
          >
            <LocateFixed className="w-5 h-5 text-sky-600" />
          </button>

          <button
            onClick={handleFitRoute}
            aria-label="Ver toda la ruta"
            className="p-3 bg-white/95 backdrop-blur shadow-lg rounded-2xl text-[#001F36] hover:bg-slate-50 active:scale-95 transition-all border border-border"
          >
            <Layers className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      )}

      {/* Driver GPS Status Pill Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-[#001F36]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg flex items-center gap-2 text-white">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-semibold font-mono tracking-tight text-slate-100">
          {isNavigatingRoad ? 'Calculando carreteras...' : 'Ruta por Carretera Activa'}
        </span>
      </div>
    </div>
  )
}
