import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { DeliveryOrder, DriverProfile, PodEvidence, NoveltyEvidence } from '../types/delivery'
import { useGeolocation } from '../hooks/useGeolocation'
import { telemetryService } from '../lib/telemetry'
import { syncOrderStatusDual } from '../lib/dualSync'
import { fetchDriverAssignedOrders } from '../lib/driverSync'
import { 
  findFleetMemberByPlate, 
  buildDriverProfileFromFleet, 
  DriverFleetMember, 
  OFFICIAL_FLEET,
  normalizePlate 
} from '../lib/fleetData'
import { toast } from 'sonner'

// Pedidos de fallback inicial para Only Home
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

const DEFAULT_FLEET_MEMBER = OFFICIAL_FLEET[2] // SQF 187 Mauricio Valencia
const INITIAL_DRIVER: DriverProfile = buildDriverProfileFromFleet(DEFAULT_FLEET_MEMBER)

interface DeliveryContextType {
  orders: DeliveryOrder[]
  driver: DriverProfile
  isLoadingOrders: boolean
  isPlateModalOpen: boolean
  setIsPlateModalOpen: (open: boolean) => void
  selectedOrderId: string | null
  setSelectedOrderId: (id: string | null) => void
  setVehiclePlate: (member: DriverFleetMember) => void
  reloadAssignedOrders: () => Promise<void>
  getOrderById: (id: string) => DeliveryOrder | undefined
  markAsInTransit: (id: string) => void
  completeDelivery: (id: string, pod: PodEvidence) => void
  reportNovelty: (id: string, novelty: NoveltyEvidence | string, notes?: string) => void
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
  // Inicialización del perfil del conductor desde Storage o Flota
  const [driver, setDriver] = useState<DriverProfile>(() => {
    const saved = localStorage.getItem('only_driver_profile_v3')
    if (saved) {
      try { return JSON.parse(saved) } catch {}
    }
    // Revisar si hay una placa guardada de sesión kiosko
    const savedPlate = localStorage.getItem('only_driver_assigned_plate')
    if (savedPlate) {
      const found = findFleetMemberByPlate(savedPlate)
      if (found) return buildDriverProfileFromFleet(found)
    }
    return INITIAL_DRIVER
  })

  const [orders, setOrders] = useState<DeliveryOrder[]>(() => {
    const saved = localStorage.getItem('only_driver_orders_v3')
    return saved ? JSON.parse(saved) : INITIAL_ORDERS
  })

  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isPlateModalOpen, setIsPlateModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const { coords } = useGeolocation(driver.is_tracking_active)

  // Función para recargar pedidos asignados desde Supabase
  const reloadAssignedOrders = useCallback(async () => {
    if (!driver.vehicle_plate) return
    setIsLoadingOrders(true)
    try {
      const fetched = await fetchDriverAssignedOrders(driver.vehicle_plate, driver.active_route_name)
      if (fetched && fetched.length > 0) {
        setOrders(fetched)
        localStorage.setItem('only_driver_orders_v3', JSON.stringify(fetched))
        toast.success(`📥 ${fetched.length} pedidos cargados para el vehículo ${driver.vehicle_plate}`)
      } else {
        console.log(`[Delivery] No se encontraron nuevos pedidos en BD para ${driver.vehicle_plate}. Conservando actuales.`)
      }
    } catch (e) {
      console.error('[Delivery] Error al recargar pedidos:', e)
    } finally {
      setIsLoadingOrders(false)
    }
  }, [driver.vehicle_plate, driver.active_route_name])

  // Detección de Enlace Mágico / Parámetros URL al cargar la PWA
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const plateParam = url.searchParams.get('placa')
      const tokenParam = url.searchParams.get('token')

      if (plateParam) {
        const found = findFleetMemberByPlate(plateParam)
        if (found) {
          const newProfile = buildDriverProfileFromFleet(found)
          if (tokenParam) newProfile.token = tokenParam

          setDriver(newProfile)
          localStorage.setItem('only_driver_assigned_plate', found.placa)
          localStorage.setItem('only_driver_profile_v3', JSON.stringify(newProfile))
          toast.success(`👋 ¡Bienvenido ${found.nombre}! Vehículo ${found.placa} vinculado exitosamente`, {
            duration: 6000
          })

          // Cargar inmediatamente los pedidos asignados a esta placa
          fetchDriverAssignedOrders(found.placa, found.rutas_permitidas).then(fetched => {
            if (fetched && fetched.length > 0) {
              setOrders(fetched)
              localStorage.setItem('only_driver_orders_v3', JSON.stringify(fetched))
            }
          })
        }
      } else {
        // Si no viene en URL pero existe placa previa en localStorage, chequear pedidos en BD
        const currentPlate = localStorage.getItem('only_driver_assigned_plate')
        if (currentPlate) {
          fetchDriverAssignedOrders(currentPlate, driver.active_route_name).then(fetched => {
            if (fetched && fetched.length > 0) {
              setOrders(fetched)
              localStorage.setItem('only_driver_orders_v3', JSON.stringify(fetched))
            }
          })
        }
      }
    } catch (err) {
      console.warn('[Delivery] Error procesando enlace mágico:', err)
    }
  }, [])

  // Cambiar vehículo manualmente (Kiosko)
  const setVehiclePlate = useCallback((member: DriverFleetMember) => {
    const newProfile = buildDriverProfileFromFleet(member)
    setDriver(newProfile)
    localStorage.setItem('only_driver_assigned_plate', member.placa)
    localStorage.setItem('only_driver_profile_v3', JSON.stringify(newProfile))

    // Cargar pedidos para el nuevo vehículo
    fetchDriverAssignedOrders(member.placa, member.rutas_permitidas).then(fetched => {
      if (fetched && fetched.length > 0) {
        setOrders(fetched)
        localStorage.setItem('only_driver_orders_v3', JSON.stringify(fetched))
      }
    })
  }, [])

  // Guardar en storage local para persistencia offline
  useEffect(() => {
    localStorage.setItem('only_driver_orders_v3', JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem('only_driver_profile_v3', JSON.stringify(driver))
  }, [driver])

  // Telemetría periódica y geocercas
  useEffect(() => {
    if (driver.is_tracking_active && coords) {
      telemetryService.recordPoint(coords, orders, driver)
    }
  }, [coords, driver, orders])

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
    const targetOrder = orders.find(o => o.id === id)
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

    if (targetOrder?.order_number) {
      syncOrderStatusDual(
        targetOrder.order_number,
        'EN RUTA',
        `Conductor ${driver.name} en camino (${driver.vehicle_plate})`,
        driver.name
      ).then(res => {
        if (res.supabase || res.googleSheets) {
          console.log(`[Delivery] Pedido #${targetOrder.order_number} sincronizado en ruta`)
        }
      })
    }
  }, [orders, driver])

  const completeDelivery = useCallback((id: string, pod: PodEvidence) => {
    const targetOrder = orders.find(o => o.id === id)
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

      const nextPending = updated.find((o) => o.status === 'pending')
      if (nextPending) {
        nextPending.status = 'next'
      }

      return updated
    })

    if (targetOrder?.order_number) {
      syncOrderStatusDual(
        targetOrder.order_number,
        'ENTREGADO',
        `Entrega exitosa a ${pod.received_by}. 3 fotos de evidencia registradas.`,
        driver.name
      ).then(() => {
        toast.success(`Pedido #${targetOrder.order_number} marcado como ENTREGADO en el sistema`)
      })
    }
  }, [orders, driver])

  const reportNovelty = useCallback((id: string, noveltyData: NoveltyEvidence | string, notes?: string) => {
    const targetOrder = orders.find(o => o.id === id)
    const isObject = typeof noveltyData !== 'string'
    const reason = isObject ? noveltyData.reason : noveltyData
    const description = isObject ? noveltyData.description : (notes || '')
    const noveltyObj = isObject ? noveltyData : undefined

    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            status: 'failed' as const,
            novelty: noveltyObj,
            novelty_reason: reason,
            novelty_notes: description,
            updated_at: new Date().toISOString()
          }
        }
        return o
      })
      return updated
    })

    if (targetOrder?.order_number) {
      syncOrderStatusDual(
        targetOrder.order_number,
        'NO CONFORME',
        `Novedad reportada: [${reason}] ${description}`,
        driver.name
      ).then(() => {
        toast.info(`Novedad del pedido #${targetOrder.order_number} registrada en el sistema`)
      })
    }
    toast.warning('Novedad de entrega reportada con evidencia')
  }, [orders, driver])

  const toggleDriverStatus = useCallback(() => {
    setDriver((prev) => {
      const nextActive = !prev.is_tracking_active
      toast(nextActive ? '🟢 Rastreo GPS y Ruta Activa' : '⏸️ Ruta en Pausa')
      return { ...prev, is_tracking_active: nextActive }
    })
  }, [])

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
        isLoadingOrders,
        isPlateModalOpen,
        setIsPlateModalOpen,
        selectedOrderId,
        setSelectedOrderId,
        setVehiclePlate,
        reloadAssignedOrders,
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
