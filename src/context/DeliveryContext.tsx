import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { DeliveryOrder, DriverProfile, PodEvidence, NoveltyEvidence, RutaTrazado } from '../types/delivery'
import { useGeolocation } from '../hooks/useGeolocation'
import { telemetryService } from '../lib/telemetry'
import { syncOrderStatusDual } from '../lib/dualSync'
import { fetchRutaConductor } from '../lib/driverSync'
import { 
  findFleetMemberByPlate, 
  buildDriverProfileFromFleet, 
  DriverFleetMember, 
  OFFICIAL_FLEET
} from '../lib/fleetData'
import { toast } from 'sonner'

const DEFAULT_FLEET_MEMBER = OFFICIAL_FLEET[2] // SQF 187 Mauricio Valencia
const INITIAL_DRIVER: DriverProfile = buildDriverProfileFromFleet(DEFAULT_FLEET_MEMBER)

interface DeliveryContextType {
  orders: DeliveryOrder[]
  driver: DriverProfile
  isLoadingOrders: boolean
  ordersError?: string | null
  trazado: RutaTrazado | null
  route_polyline?: string | null
  route_distance_m?: number | null
  route_duration_s?: number | null
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

  // Pedidos del viaje activo (inicialmente vacío)
  const [orders, setOrders] = useState<DeliveryOrder[]>(() => {
    const saved = localStorage.getItem('only_driver_orders_v3')
    return saved ? JSON.parse(saved) : []
  })

  // Trazado de ruta devuelto por el servidor
  const [trazado, setTrazado] = useState<RutaTrazado | null>(() => {
    const saved = localStorage.getItem('only_driver_trazado_v3')
    if (saved) {
      try { return JSON.parse(saved) } catch {}
    }
    return null
  })

  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [isPlateModalOpen, setIsPlateModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const { coords } = useGeolocation(driver.is_tracking_active)

  // La identidad del conductor manda el servidor: la flota local solo sirve de respaldo visual.
  const sincronizarConductor = useCallback((res: any) => {
    const viaje = res?.viaje
    const nombre = viaje?.conductor?.nombre
    if (!nombre) return
    setDriver(prev => {
      if (prev.name === nombre && (!viaje.placa || prev.vehicle_plate === viaje.placa)) return prev
      const next = {
        ...prev,
        name: nombre,
        // Teléfono y tipo de vehículo solo si el servidor los entrega: nada de datos de la flota demo.
        phone: viaje.conductor?.telefono || '',
        vehicle_type: undefined,
        vehicle_plate: viaje.placa || prev.vehicle_plate
      }
      localStorage.setItem('only_driver_profile_v3', JSON.stringify(next))
      return next
    })
  }, [])

  // Recargar pedidos asignados desde la API oficial de logística
  const reloadAssignedOrders = useCallback(async () => {
    if (!driver.vehicle_plate) return
    setIsLoadingOrders(true)
    setOrdersError(null)
    try {
      const res = await fetchRutaConductor(driver.vehicle_plate)
      const fetched = res.orders || res
      sincronizarConductor(res)
      setOrders(fetched)
      setTrazado(res.trazado ?? null)
      localStorage.setItem('only_driver_orders_v3', JSON.stringify(fetched))
      if (res.trazado) {
        localStorage.setItem('only_driver_trazado_v3', JSON.stringify(res.trazado))
      } else {
        localStorage.removeItem('only_driver_trazado_v3')
      }
      if (fetched.length > 0) {
        toast.success(`📥 ${fetched.length} pedidos cargados para el vehículo ${driver.vehicle_plate}`)
      } else {
        console.log(`[Delivery] No se encontraron pedidos para ${driver.vehicle_plate}.`)
      }
    } catch (e: any) {
      console.error('[Delivery] Error al recargar pedidos:', e)
      setOrdersError(e?.message || 'Error al recargar pedidos')
      throw e
    } finally {
      setIsLoadingOrders(false)
    }
  }, [driver.vehicle_plate])

  // Detección de Enlace Mágico / Parámetros URL al cargar la PWA
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const plateParam = url.searchParams.get('placa')
      const tokenParam = url.searchParams.get('token')
      const rutaParam = url.searchParams.get('ruta')

      if (plateParam) {
        const found = findFleetMemberByPlate(plateParam)
        if (found) {
          const newProfile = buildDriverProfileFromFleet(found)
          if (tokenParam) newProfile.token = tokenParam
          if (rutaParam) newProfile.active_route_name = rutaParam

          setDriver(newProfile)
          localStorage.setItem('only_driver_assigned_plate', found.placa)
          localStorage.setItem('only_driver_profile_v3', JSON.stringify(newProfile))
          toast.success(`Vehículo ${found.placa} vinculado`, { duration: 4000 })

          setIsLoadingOrders(true)
          fetchRutaConductor(found.placa).then(res => {
            const fetched = res.orders || res
            sincronizarConductor(res)
            setOrders(fetched)
            setTrazado(res.trazado ?? null)
            localStorage.setItem('only_driver_orders_v3', JSON.stringify(fetched))
            if (res.trazado) {
              localStorage.setItem('only_driver_trazado_v3', JSON.stringify(res.trazado))
            } else {
              localStorage.removeItem('only_driver_trazado_v3')
            }
          }).catch(err => {
            console.warn('[Delivery] Error cargando ruta de enlace mágico:', err)
          }).finally(() => {
            setIsLoadingOrders(false)
          })
        }
      } else {
        const currentPlate = localStorage.getItem('only_driver_assigned_plate') || driver.vehicle_plate
        if (currentPlate) {
          setIsLoadingOrders(true)
          fetchRutaConductor(currentPlate).then(res => {
            const fetched = res.orders || res
            sincronizarConductor(res)
            if (fetched && fetched.length > 0) {
              setOrders(fetched)
              setTrazado(res.trazado ?? null)
              localStorage.setItem('only_driver_orders_v3', JSON.stringify(fetched))
              if (res.trazado) {
                localStorage.setItem('only_driver_trazado_v3', JSON.stringify(res.trazado))
              } else {
                localStorage.removeItem('only_driver_trazado_v3')
              }
            }
          }).catch(err => {
            console.warn('[Delivery] Error cargando ruta inicial:', err)
          }).finally(() => {
            setIsLoadingOrders(false)
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

    setIsLoadingOrders(true)
    fetchRutaConductor(member.placa).then(res => {
      const fetched = res.orders || res
      setOrders(fetched)
      setTrazado(res.trazado ?? null)
      localStorage.setItem('only_driver_orders_v3', JSON.stringify(fetched))
      if (res.trazado) {
        localStorage.setItem('only_driver_trazado_v3', JSON.stringify(res.trazado))
      } else {
        localStorage.removeItem('only_driver_trazado_v3')
      }
    }).catch(err => {
      console.warn('[Delivery] Error cambiando vehículo:', err)
    }).finally(() => {
      setIsLoadingOrders(false)
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
        ordersError,
        trazado,
        route_polyline: trazado?.polyline ?? null,
        route_distance_m: trazado?.distancia_m ?? null,
        route_duration_s: trazado?.duracion_s ?? null,
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
