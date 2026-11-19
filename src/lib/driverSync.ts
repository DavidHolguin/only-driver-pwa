import { DeliveryOrder, DeliveryStatus, RutaTrazado } from '../types/delivery'

export interface ServerParada {
  id: string
  secuencia: number
  numero_pedido: string
  cliente?: string | null
  telefono?: string | null
  direccion?: string | null
  ciudad?: string | null
  unidades?: number | null
  estado?: string | null
  observacion?: string | null
  lat?: number | null
  lng?: number | null
  precision?: string | null
  entregado_at?: string | null
}

export interface ServerViaje {
  id: string
  fecha: string
  estado: string
  ruta: string
  placa: string
  conductor?: {
    id: string
    nombre: string
    telefono?: string
  } | null
}

export interface RutaApiResponse {
  viaje?: ServerViaje | null
  paradas: ServerParada[]
  trazado: RutaTrazado | null
  sin_ubicacion: number
}

export type FetchRutaResult = DeliveryOrder[] & {
  orders: DeliveryOrder[]
  paradas: DeliveryOrder[]
  trazado: RutaTrazado | null
  viaje?: ServerViaje | null
  sin_ubicacion: number
}

/**
 * Consulta la ruta asignada al conductor según su placa en el endpoint oficial:
 * GET /api/v1/logistica/ruta con Bearer OH_<placa sin espacios>.
 * Mapea las paradas a DeliveryOrder con estados normalizados y almacena el trazado.
 */
export async function fetchRutaConductor(placa: string): Promise<FetchRutaResult> {
  const cleanPlate = (placa || '').replace(/\s+/g, '').toUpperCase()
  const emptyResult = Object.assign([] as DeliveryOrder[], {
    orders: [] as DeliveryOrder[],
    paradas: [] as DeliveryOrder[],
    trazado: null,
    viaje: null,
    sin_ubicacion: 0
  }) as FetchRutaResult

  if (!cleanPlate) {
    return emptyResult
  }

  const baseUrl = (import.meta.env.VITE_API_URL ?? 'https://crm.prometheuslabs.com.co').replace(/\/+$/, '')
  const url = `${baseUrl}/api/v1/logistica/ruta`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer OH_${cleanPlate}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`[driverSync] Sin viaje abierto para el vehículo ${cleanPlate}`)
      } else {
        console.warn(`[driverSync] Error al consultar ruta (${res.status}): ${res.statusText}`)
      }
      return emptyResult
    }

    const data: RutaApiResponse = await res.json()
    const paradas = Array.isArray(data.paradas) ? data.paradas : []

    let hasNextAssigned = false
    const orders: DeliveryOrder[] = paradas.map((parada, idx) => {
      const rawEstado = (parada.estado || 'PENDIENTE').trim().toUpperCase()
      let status: DeliveryStatus

      if (rawEstado === 'ENTREGADO') {
        status = 'delivered'
      } else if (rawEstado === 'NO_CONFORME' || rawEstado === 'DEVUELTO') {
        status = 'failed'
      } else if (rawEstado === 'EN_RUTA') {
        status = 'in_transit'
        hasNextAssigned = true
      } else {
        if (!hasNextAssigned) {
          status = 'next'
          hasNextAssigned = true
        } else {
          status = 'pending'
        }
      }

      const lat = parada.lat !== null && parada.lat !== undefined ? Number(parada.lat) : null
      const lng = parada.lng !== null && parada.lng !== undefined ? Number(parada.lng) : null
      const units = Number(parada.unidades) || 1

      return {
        id: String(parada.id || `parada-${idx}`),
        order_number: String(parada.numero_pedido || `PED-${idx + 1}`),
        sequence_order: Number(parada.secuencia) || (idx + 1),
        customer_name: parada.cliente || '',
        customer_phone: parada.telefono || '',
        address: parada.direccion || '',
        neighborhood: '',
        city: parada.ciudad || '',
        address_notes: parada.observacion || undefined,
        latitude: lat,
        longitude: lng,
        // La parada no trae el detalle de productos: no se inventa. Solo unidades.
        items: [],
        total_units: units,
        status,
        updated_at: parada.entregado_at || undefined
      }
    })

    return Object.assign([...orders], {
      orders,
      paradas: orders,
      trazado: data.trazado ?? null,
      viaje: data.viaje ?? null,
      sin_ubicacion: typeof data.sin_ubicacion === 'number' ? data.sin_ubicacion : 0
    }) as FetchRutaResult
  } catch (err) {
    console.error('[driverSync] Error al obtener ruta del conductor:', err)
    return emptyResult
  }
}

export const fetchDriverAssignedOrders = fetchRutaConductor
