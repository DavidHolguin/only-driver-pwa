import React, { useEffect, useRef, useState, useMemo } from 'react'
import L from 'leaflet'
import { DeliveryOrder, TelemetryPoint, RutaTrazado } from '../../types/delivery'
import { decodePolyline } from '../../lib/routing'
import { useDelivery } from '../../context/DeliveryContext'
import { LocateFixed, Layers, Maximize2, Minimize2, Compass } from 'lucide-react'

export interface RouteMapProps {
  driverCoords: TelemetryPoint
  orders: DeliveryOrder[]
  trazado?: RutaTrazado | null
  selectedOrderId?: string
  onSelectOrder?: (orderId: string) => void
  interactive?: boolean
  className?: string
  height?: string
  allowFullscreenToggle?: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export const RouteMap: React.FC<RouteMapProps> = ({
  driverCoords,
  orders,
  trazado: propsTrazado,
  selectedOrderId,
  onSelectOrder,
  interactive = true,
  className = '',
  height = '350px',
  allowFullscreenToggle = true,
  isExpanded: externalIsExpanded,
  onToggleExpand: externalOnToggleExpand
}) => {
  const { trazado: contextTrazado } = useDelivery()
  const effectiveTrazado = propsTrazado !== undefined ? propsTrazado : contextTrazado

  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalExpanded
  const handleToggleExpand = externalOnToggleExpand || (() => setInternalExpanded(prev => !prev))

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const driverMarkerRef = useRef<L.Marker | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const routePolylineRef = useRef<L.Polyline | null>(null)

  // Filtrar paradas con coordenadas válidas
  const ordersWithCoords = useMemo(() => {
    return orders.filter(
      (o): o is DeliveryOrder & { latitude: number; longitude: number } =>
        o.latitude !== null &&
        o.longitude !== null &&
        !Number.isNaN(Number(o.latitude)) &&
        !Number.isNaN(Number(o.longitude))
    )
  }, [orders])

  const hasCoords = ordersWithCoords.length > 0
  const hasPolyline = Boolean(effectiveTrazado?.polyline)

  // Inicializar mapa si existen coordenadas
  useEffect(() => {
    if (!hasCoords || !mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = ordersWithCoords[0]
        ? [ordersWithCoords[0].latitude, ordersWithCoords[0].longitude]
        : [driverCoords.latitude, driverCoords.longitude]

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 14,
        zoomControl: false,
        attributionControl: true
      })

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
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
  }, [hasCoords])

  // Invalidar tamaño al alternar pantalla completa
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [isExpanded])

  // Actualizar marcador del conductor en tiempo real
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !hasCoords) return

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
  }, [driverCoords, hasCoords])

  // Renderizar marcadores y trazado según disponibilidad
  useEffect(() => {
    const map = mapInstanceRef.current
    const layer = markersLayerRef.current
    if (!map || !layer || !hasCoords) return

    layer.clearLayers()

    // 1. Dibujar marcadores usando tokens de tailwind.config.ts
    // Entregado: driver.success (#10B981)
    // Siguiente / En ruta: driver.accent (#0284C7) / driver.warning (#F59E0B)
    // Pendiente: driver.blue (#003B66)
    // Fallido: driver.danger (#EF4444)
    ordersWithCoords.forEach((order) => {
      const isSelected = order.id === selectedOrderId
      const isDelivered = order.status === 'delivered'
      const isFailed = order.status === 'failed'
      const isNext = order.status === 'next' || order.status === 'in_transit'

      let bgBadge = 'bg-[#003B66]' // driver.blue
      let ringStyle = ''
      if (isDelivered) {
        bgBadge = 'bg-[#10B981]' // driver.success
      } else if (isFailed) {
        bgBadge = 'bg-[#EF4444]' // driver.danger
      } else if (isNext) {
        bgBadge = 'bg-[#0284C7] text-white font-extrabold' // driver.accent
        ringStyle = 'ring-4 ring-[#0284C7]/50 animate-pulse'
      }

      if (isSelected) {
        ringStyle += ' scale-125 ring-4 ring-sky-400'
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

    // 2. Limpiar trazado anterior
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current)
      routePolylineRef.current = null
    }

    // 3. Pinta el trazado del servidor cuando existe
    if (effectiveTrazado?.polyline) {
      const polyCoords = decodePolyline(effectiveTrazado.polyline)
      if (polyCoords.length > 0) {
        routePolylineRef.current = L.polyline(polyCoords, {
          color: '#003B66', // driver.blue
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map)

        // fitBounds al trazado
        const bounds = L.latLngBounds(polyCoords)
        map.fitBounds(bounds, { padding: [40, 40] })
        return
      }
    }

    // 4. Si no hay trazado pero sí paradas con coordenadas:
    // Une las paradas con una línea punteada y fitBounds a lo que haya
    const sorted = [...ordersWithCoords].sort((a, b) => a.sequence_order - b.sequence_order)
    const points: [number, number][] = [
      [driverCoords.latitude, driverCoords.longitude],
      ...sorted.map(o => [o.latitude, o.longitude] as [number, number])
    ]

    if (points.length >= 2) {
      routePolylineRef.current = L.polyline(points, {
        color: '#0284C7', // driver.accent
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(map)
    }

    // fitBounds a los puntos disponibles
    if (points.length > 1) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [ordersWithCoords, selectedOrderId, driverCoords, onSelectOrder, effectiveTrazado, hasCoords])

  // Si ninguna parada tiene coordenadas, mostrar estado vacío
  if (!hasCoords) {
    return (
      <div
        className={`relative w-full rounded-2xl overflow-hidden border border-border shadow-card bg-slate-100 flex flex-col items-center justify-center p-6 text-center ${className}`}
        style={{ height }}
      >
        <div className="flex flex-col items-center justify-center gap-2 max-w-xs">
          <div className="p-3 bg-white rounded-full shadow-sm border border-border">
            <Compass className="w-6 h-6 text-slate-500" />
          </div>
          <p className="font-semibold text-slate-800 text-sm">Sin ubicación en este viaje</p>
          <p className="text-xs text-slate-500">Ninguna de las paradas tiene coordenadas asignadas</p>
        </div>
      </div>
    )
  }

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
    if (!mapInstanceRef.current) return
    const points: L.LatLngExpression[] = [
      [driverCoords.latitude, driverCoords.longitude],
      ...ordersWithCoords.map((o) => [o.latitude, o.longitude] as [number, number])
    ]
    const bounds = L.latLngBounds(points)
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] })
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

      {/* Controles de mapa flotantes */}
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

      {/* Pill indicador de estado del trazado */}
      <div className="absolute bottom-3 left-3 z-[400] bg-[#001F36]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg flex items-center gap-2 text-white">
        {hasPolyline ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold tracking-tight text-slate-100">
              Ruta trazada
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-[11px] font-semibold tracking-tight text-slate-100">
              Trazado no disponible
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export const GoogleRouteMap = RouteMap
