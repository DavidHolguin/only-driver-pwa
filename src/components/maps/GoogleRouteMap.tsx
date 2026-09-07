import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import { DeliveryOrder, TelemetryPoint } from '../../types/delivery'
import { Compass, Navigation2, Layers, LocateFixed } from 'lucide-react'

interface GoogleRouteMapProps {
  driverCoords: TelemetryPoint
  orders: DeliveryOrder[]
  selectedOrderId?: string
  onSelectOrder?: (orderId: string) => void
  interactive?: boolean
  className?: string
  height?: string
}

export const GoogleRouteMap: React.FC<GoogleRouteMapProps> = ({
  driverCoords,
  orders,
  selectedOrderId,
  onSelectOrder,
  interactive = true,
  className = '',
  height = '350px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const driverMarkerRef = useRef<L.Marker | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const routePolylineRef = useRef<L.Polyline | null>(null)

  // Inicializar mapa Leaflet con estilo minimalista
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [driverCoords.latitude, driverCoords.longitude],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      })

      // CartoDB Positron: Map tile ultra limpio, minimalista, ideal para apps de logística
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
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

  // Actualizar marcador del conductor en tiempo real
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const driverIcon = L.divIcon({
      className: 'driver-live-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
          <div class="relative flex items-center justify-center w-7 h-7 bg-[#001F36] border-2 border-white rounded-full shadow-lg text-white">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L19 21L12 17L5 21L12 2Z" style="transform: rotate(${driverCoords.heading || 0}deg); transform-origin: center;"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
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

  // Actualizar marcadores de pedidos y polilínea de ruta
  useEffect(() => {
    const map = mapInstanceRef.current
    const layer = markersLayerRef.current
    if (!map || !layer) return

    layer.clearLayers()

    const routeLatLngs: L.LatLngExpression[] = [
      [driverCoords.latitude, driverCoords.longitude]
    ]

    orders.forEach((order) => {
      const isSelected = order.id === selectedOrderId
      const isDelivered = order.status === 'delivered'
      const isFailed = order.status === 'failed'
      const isNext = order.status === 'next' || order.status === 'in_transit'

      // Color coding según estado
      let bgBadge = 'bg-[#003B66]' // Only navy default
      let ringStyle = ''
      if (isDelivered) bgBadge = 'bg-emerald-600'
      else if (isFailed) bgBadge = 'bg-rose-600'
      else if (isNext) {
        bgBadge = 'bg-amber-500 text-slate-950 font-extrabold'
        ringStyle = 'ring-4 ring-amber-300/60 animate-bounce'
      }

      if (isSelected) {
        ringStyle += ' scale-125 ring-4 ring-blue-500'
      }

      const pinIcon = L.divIcon({
        className: 'order-stop-marker',
        html: `
          <div class="flex flex-col items-center cursor-pointer transition-transform duration-200">
            <div class="flex items-center justify-center w-7 h-7 ${bgBadge} ${ringStyle} text-white rounded-full shadow-md font-mono text-xs border-2 border-white">
              ${isDelivered ? '✓' : order.sequence_order}
            </div>
            <div class="w-1.5 h-1.5 bg-[#001F36] rounded-full mt-0.5 opacity-60"></div>
          </div>
        `,
        iconSize: [28, 36],
        iconAnchor: [14, 34]
      })

      const marker = L.marker([order.latitude, order.longitude], { icon: pinIcon })

      marker.on('click', () => {
        if (onSelectOrder) {
          onSelectOrder(order.id)
        }
      })

      layer.addLayer(marker)

      if (!isDelivered && !isFailed) {
        routeLatLngs.push([order.latitude, order.longitude])
      }
    })

    // Dibujar trazo de ruta
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current)
    }

    if (routeLatLngs.length > 1) {
      routePolylineRef.current = L.polyline(routeLatLngs, {
        color: '#003B66',
        weight: 3.5,
        opacity: 0.75,
        dashArray: '6, 8',
        lineJoin: 'round'
      }).addTo(map)
    }
  }, [orders, selectedOrderId, driverCoords, onSelectOrder])

  // Centrar mapa en conductor
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([driverCoords.latitude, driverCoords.longitude], 15, {
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
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] })
  }

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-border shadow-card bg-slate-100 ${className}`} style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls for Driver */}
      {interactive && (
        <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
          <button
            onClick={handleRecenter}
            aria-label="Centrar en mi ubicación"
            className="p-2.5 bg-white/95 backdrop-blur shadow-md rounded-xl text-[#001F36] hover:bg-slate-50 active:scale-95 transition-all border border-border"
          >
            <LocateFixed className="w-5 h-5 text-blue-600" />
          </button>
          <button
            onClick={handleFitRoute}
            aria-label="Ver toda la ruta"
            className="p-2.5 bg-white/95 backdrop-blur shadow-md rounded-xl text-[#001F36] hover:bg-slate-50 active:scale-95 transition-all border border-border"
          >
            <Layers className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      )}

      {/* Driver GPS Status Pill Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/80 shadow-sm flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-medium text-slate-700 font-mono">
          GPS Activo (±{Math.round(driverCoords.accuracy || 5)}m)
        </span>
      </div>
    </div>
  )
}
