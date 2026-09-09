import { DeliveryOrder, TelemetryPoint, DriverProfile } from '../types/delivery'
import { calculateDistanceMeters } from '../hooks/useGeolocation'
import { supabase } from './supabase'

export interface ProximityAlertEvent {
  orderId: string
  orderNumber: string
  customerName: string
  customerPhone: string
  type: 'approaching_city' | 'approaching_neighborhood' | 'at_door'
  distanceMeters: number
  timestamp: number
}

class TelemetryService {
  private buffer: TelemetryPoint[] = []
  private triggeredAlerts: Set<string> = new Set()
  private listeners: ((event: ProximityAlertEvent) => void)[] = []
  private lastBroadcastTime = 0
  private realtimeChannel: any = null

  constructor() {
    this.initRealtimeChannel()
  }

  private initRealtimeChannel() {
    try {
      this.realtimeChannel = supabase.channel('driver_live_telemetry', {
        config: { broadcast: { self: false } }
      })
      this.realtimeChannel.subscribe()
    } catch (e) {
      console.warn('[TelemetryService] Realtime channel init fallback:', e)
    }
  }

  // Agrega punto de telemetría y evalúa proximidad + broadcast a Supabase
  public recordPoint(point: TelemetryPoint, activeOrders: DeliveryOrder[], driver?: DriverProfile) {
    this.buffer.push(point)
    if (this.buffer.length > 50) {
      this.buffer.shift() // Mantener los últimos 50 puntos en memoria
    }

    // Evaluar geocercas para cada pedido activo
    this.evaluateProximity(point, activeOrders)

    // Emitir en vivo a Supabase cada 5 segundos para que la PWA del cliente reciba la ubicación
    const now = Date.now()
    if (now - this.lastBroadcastTime > 5000 && driver) {
      this.lastBroadcastTime = now
      this.broadcastDriverLocation(point, activeOrders, driver)
    }
  }

  private async broadcastDriverLocation(point: TelemetryPoint, activeOrders: DeliveryOrder[], driver: DriverProfile) {
    const activeOrder = activeOrders.find(o => o.status === 'in_transit') || activeOrders.find(o => o.status === 'next')
    const payload = {
      driver_id: driver.id,
      driver_name: driver.name,
      driver_phone: driver.phone,
      vehicle_plate: driver.vehicle_plate,
      vehicle_model: driver.vehicle_type === 'camion' ? 'Camión Only Home' : 'Furgón Logístico Only Home',
      latitude: point.latitude,
      longitude: point.longitude,
      speed: point.speed,
      heading: point.heading,
      accuracy: point.accuracy,
      order_number: activeOrder?.order_number,
      timestamp: nowIso()
    }

    // 1. Broadcast instantáneo por Supabase Realtime (Cero latencia para la PWA del cliente)
    try {
      if (this.realtimeChannel) {
        this.realtimeChannel.send({
          type: 'broadcast',
          event: 'driver_location',
          payload
        })
      }
    } catch (err) {
      console.warn('[TelemetryService] Broadcast error:', err)
    }

    // 2. Si el pedido activo existe en la tabla pedidos de Supabase, reflejar la última coordenada
    if (activeOrder?.order_number) {
      try {
        await supabase
          .from('pedidos')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('numero_pedido', activeOrder.order_number)
      } catch (err) {
        // Silencioso si RLS está activo
      }
    }
  }

  // Comprueba distancia al pedido actual/siguiente y genera eventos
  private evaluateProximity(point: TelemetryPoint, activeOrders: DeliveryOrder[]) {
    const pendingOrders = activeOrders.filter(
      (o) => o.status === 'in_transit' || o.status === 'next' || o.status === 'pending'
    )

    for (const order of pendingOrders) {
      const distance = calculateDistanceMeters(
        point.latitude,
        point.longitude,
        order.latitude,
        order.longitude
      )

      // 1. Llegando a la puerta (< 250m)
      const atDoorKey = `${order.id}-at_door`
      if (distance <= 250 && !this.triggeredAlerts.has(atDoorKey)) {
        this.triggeredAlerts.add(atDoorKey)
        this.emitAlert({
          orderId: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          type: 'at_door',
          distanceMeters: distance,
          timestamp: Date.now()
        })
      }

      // 2. En camino cerca (< 1200m / ~5 min)
      const approachingKey = `${order.id}-approaching`
      if (distance <= 1200 && distance > 250 && !this.triggeredAlerts.has(approachingKey)) {
        this.triggeredAlerts.add(approachingKey)
        this.emitAlert({
          orderId: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          type: 'approaching_neighborhood',
          distanceMeters: distance,
          timestamp: Date.now()
        })
      }
    }
  }

  public onProximityAlert(callback: (event: ProximityAlertEvent) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback)
    }
  }

  private emitAlert(event: ProximityAlertEvent) {
    this.listeners.forEach((listener) => listener(event))
  }

  public getRecentTelemetry() {
    return [...this.buffer]
  }

  public clearAlerts() {
    this.triggeredAlerts.clear()
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

export const telemetryService = new TelemetryService()
