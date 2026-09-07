import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { DeliveryOrder, DriverProfile, PodEvidence } from '../types/delivery'
import { useGeolocation } from '../hooks/useGeolocation'
import { telemetryService } from '../lib/telemetry'
import { toast } from 'sonner'

// Pedidos de ruta para Only Home (todos 100% pagos previamente)
const INITIAL_ORDERS: DeliveryOrder[] = [
  {
    id: 'ord-001',
    order_number: 'PED-10492',
    opv: 'OPV-8820',
    invoice_number: 'FE-99321',
    sequence_order: 1,
    customer_name: 'Camila Restrepo Morales',
    customer_phone: '3158942211',
    customer_document: '1020789456',
    customer_email: 'camila.restrepo@example.com',
    address: 'Calle 93B # 13-45 Apto 402',
    neighborhood: 'Chicó Norte',
    city: 'Bogotá D.C.',
    address_notes: 'Edificio Torre Ópalo, dejar en portería o timbrar al 402',
    latitude: 4.6782,
    longitude: -74.0534,
    items: [
      { id: 'it-1', name: 'Montura Oftálmica Carrera Acetato Blue', sku: 'OPT-CAR-882', quantity: 1 },
      { id: 'it-2', name: 'Líquido Limpiador Antireflejo 60ml Only', sku: 'ACC-CLN-060', quantity: 2 }
    ],
    total_units: 3,
    status: 'next'
  },
  {
    id: 'ord-002',
    order_number: 'PED-10495',
    opv: 'OPV-8824',
    invoice_number: 'FE-99325',
    sequence_order: 2,
    customer_name: 'Andrés Felipe Gómez',
    customer_phone: '3007654321',
    customer_document: '80123984',
    customer_email: 'andres.gomez@gmail.com',
    address: 'Carrera 15 # 104-20 Of 301',
    neighborhood: 'Santa Bárbara',
    city: 'Bogotá D.C.',
    address_notes: 'Edificio Empresarial 104, acceso peatonal',
    latitude: 4.6894,
    longitude: -74.0489,
    items: [
      { id: 'it-3', name: 'Gafas de Sol Ray-Ban Polarized Aviator Gold', sku: 'SOL-RAY-AV1', quantity: 1 }
    ],
    total_units: 1,
    status: 'pending'
  },
  {
    id: 'ord-003',
    order_number: 'PED-10501',
    opv: 'OPV-8830',
    invoice_number: 'FE-99330',
    sequence_order: 3,
    customer_name: 'Valentina Soto Jaramillo',
    customer_phone: '3189901234',
    customer_document: '1032456789',
    customer_email: 'valen.soto@hotmail.com',
    address: 'Calle 116 # 19-34 Casa 2',
    neighborhood: 'Pepe Sierra',
    city: 'Bogotá D.C.',
    address_notes: 'Conjunto cerrado Los Cerezos, avisar al vigilante Pedro',
    latitude: 4.6985,
    longitude: -74.0542,
    items: [
      { id: 'it-4', name: 'Lentes de Contacto Acuvue Oasys Quincenales (Caja x6)', sku: 'LEN-ACU-OAS', quantity: 2 },
      { id: 'it-5', name: 'Solución Multipropósito Renu Plus 355ml', sku: 'ACC-SOL-REN', quantity: 1 }
    ],
    total_units: 3,
    status: 'pending'
  },
  {
    id: 'ord-004',
    order_number: 'PED-10512',
    opv: 'OPV-8839',
    invoice_number: 'FE-99341',
    sequence_order: 4,
    customer_name: 'Santiago Méndez Castro',
    customer_phone: '3112345678',
    customer_document: '79845120',
    address: 'Calle 140 # 11-18 Apto 503',
    neighborhood: 'Cedritos',
    city: 'Bogotá D.C.',
    address_notes: 'Frente al parque de Cedritos',
    latitude: 4.7188,
    longitude: -74.0381,
    items: [
      { id: 'it-6', name: 'Montura de Seguridad Graduada Industrial Only Guard', sku: 'SEG-GRD-IND', quantity: 1 }
    ],
    total_units: 1,
    status: 'pending'
  },
  {
    id: 'ord-005',
    order_number: 'PED-10520',
    opv: 'OPV-8845',
    invoice_number: 'FE-99350',
    sequence_order: 5,
    customer_name: 'Diana Patricia Salazar',
    customer_phone: '3208765432',
    customer_document: '52890123',
    address: 'Carrera 58 # 128-40 Torre 2 Apt 1104',
    neighborhood: 'Niza Antigua',
    city: 'Bogotá D.C.',
    address_notes: 'Portería sobre la transversal',
    latitude: 4.7142,
    longitude: -74.0725,
    items: [
      { id: 'it-7', name: 'Gafas de Sol Oakley Holbrook Matte Black', sku: 'SOL-OAK-HLB', quantity: 1 }
    ],
    total_units: 1,
    status: 'pending'
  }
]

const INITIAL_DRIVER: DriverProfile = {
  id: 'drv-01',
  name: 'Juan Carlos Benítez',
  phone: '3104567890',
  vehicle_type: 'furgon',
  vehicle_plate: 'EQZ-459',
  active_route_name: 'Ruta Norte Express — Bogotá',
  city: 'Bogotá D.C.',
  is_tracking_active: true
}

interface DeliveryContextType {
  orders: DeliveryOrder[]
  driver: DriverProfile
  selectedOrderId: string | null
  setSelectedOrderId: (id: string | null) => void
  getOrderById: (id: string) => DeliveryOrder | undefined
  markAsInTransit: (id: string) => void
  completeDelivery: (id: string, pod: PodEvidence) => void
  reportNovelty: (id: string, reason: string, notes?: string) => void
  toggleDriverStatus: () => void
  stats: {
    total: number
    delivered: number
    pending: number
    failed: number
    totalUnits: number
    deliveredUnits: number
    progressPercentage: number
  }
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined)

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<DeliveryOrder[]>(() => {
    const saved = localStorage.getItem('only_driver_orders_v2')
    return saved ? JSON.parse(saved) : INITIAL_ORDERS
  })

  const [driver, setDriver] = useState<DriverProfile>(() => {
    const saved = localStorage.getItem('only_driver_profile_v2')
    return saved ? JSON.parse(saved) : INITIAL_DRIVER
  })

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const { coords } = useGeolocation(driver.is_tracking_active)

  // Guardar en storage local para persistencia offline
  useEffect(() => {
    localStorage.setItem('only_driver_orders_v2', JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem('only_driver_profile_v2', JSON.stringify(driver))
  }, [driver])

  // Telemetría periódica y escucha de geocercas
  useEffect(() => {
    if (driver.is_tracking_active && coords) {
      telemetryService.recordPoint(coords, orders)
    }
  }, [coords, driver.is_tracking_active, orders])

  // Escuchar alertas de proximidad para feedback en vivo
  useEffect(() => {
    const unsubscribe = telemetryService.onProximityAlert((alert) => {
      if (alert.type === 'at_door') {
        toast.info(`📍 Estás a menos de 250m de la entrega #${alert.orderNumber} (${alert.customerName})`, {
          duration: 5000
        })
      } else if (alert.type === 'approaching_neighborhood') {
        toast.info(`🔔 Llegando a la zona de ${alert.customerName} (${alert.orderNumber})`, {
          duration: 4000
        })
      }
    })
    return unsubscribe
  }, [])

  const getOrderById = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders]
  )

  const markAsInTransit = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          return { ...o, status: 'in_transit', updated_at: new Date().toISOString() }
        }
        if (o.status === 'in_transit') {
          return { ...o, status: 'next' }
        }
        return o
      })
    )
    toast.success('Ruta iniciada hacia este destino')
  }, [])

  const completeDelivery = useCallback((id: string, pod: PodEvidence) => {
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            status: 'delivered' as const,
            pod,
            updated_at: new Date().toISOString()
          }
        }
        return o
      })

      // Marcar automáticamente el siguiente pedido pendiente como 'next'
      const nextPending = updated.find((o) => o.status === 'pending')
      if (nextPending) {
        nextPending.status = 'next'
      }

      return updated
    })
  }, [])

  const reportNovelty = useCallback((id: string, reason: string, notes?: string) => {
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            status: 'failed' as const,
            novelty_reason: reason,
            novelty_notes: notes,
            updated_at: new Date().toISOString()
          }
        }
        return o
      })

      // Activar siguiente pedido disponible
      const nextPending = updated.find((o) => o.status === 'pending')
      if (nextPending) {
        nextPending.status = 'next'
      }

      return updated
    })
    toast.warning('Novedad de entrega reportada')
  }, [])

  const toggleDriverStatus = useCallback(() => {
    setDriver((prev) => {
      const nextActive = !prev.is_tracking_active
      toast(nextActive ? '🟢 Rastreo GPS y Ruta Activa' : '⏸️ Ruta en Pausa')
      return { ...prev, is_tracking_active: nextActive }
    })
  }, [])

  // Estadísticas operativas calculadas
  const total = orders.length
  const delivered = orders.filter((o) => o.status === 'delivered').length
  const failed = orders.filter((o) => o.status === 'failed').length
  const pending = total - delivered - failed
  const progressPercentage = total > 0 ? Math.round((delivered / total) * 100) : 0

  const totalUnits = orders.reduce((sum, o) => sum + (o.total_units || 1), 0)
  const deliveredUnits = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total_units || 1), 0)

  return (
    <DeliveryContext.Provider
      value={{
        orders,
        driver,
        selectedOrderId,
        setSelectedOrderId,
        getOrderById,
        markAsInTransit,
        completeDelivery,
        reportNovelty,
        toggleDriverStatus,
        stats: {
          total,
          delivered,
          pending,
          failed,
          totalUnits,
          deliveredUnits,
          progressPercentage
        }
      }}
    >
      {children}
    </DeliveryContext.Provider>
  )
}

export const useDelivery = () => {
  const context = useContext(DeliveryContext)
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider')
  }
  return context
}
