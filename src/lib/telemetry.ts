import { DeliveryOrder, TelemetryPoint } from '../types/delivery'
import { calculateDistanceMeters } from '../hooks/useGeolocation'

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

  // Agrega punto de telemetría y evalúa proximidad
  public recordPoint(point: TelemetryPoint, activeOrders: DeliveryOrder[]) {
    this.buffer.push(point)
    if (this.buffer.length > 50) {
      this.buffer.shift() // Mantener los últimos 50 puntos en memoria
    }

    // Evaluar geocercas para cada pedido activo
    this.evaluateProximity(point, activeOrders)
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

export const telemetryService = new TelemetryService()
