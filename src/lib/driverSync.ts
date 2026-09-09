import { supabase } from './supabase'
import { DeliveryOrder } from '../types/delivery'

export async function fetchDriverAssignedOrders(plate: string, activeRoute?: string): Promise<DeliveryOrder[]> {
  const cleanPlate = (plate || '').trim().toUpperCase().replace(/\s+/g, '')
  if (!cleanPlate) return []

  try {
    // 1. Consultar pedidos asignados a esta placa o ruta en estados operativos
    // Estados: 'en_ruta', 'facturado', 'prog._cargue', 'listo_para_despacho'
    let query = supabase
      .from('pedidos')
      .select('*')

    // Si tiene placa o ruta
    if (activeRoute && activeRoute !== 'TODAS' && !activeRoute.includes('Nacionales')) {
      query = query.or(`placa.ilike.%${cleanPlate}%,ruta.ilike.%${activeRoute}%`)
    } else {
      query = query.ilike('placa', `%${cleanPlate}%`)
    }

    const { data, error } = await query
      .in('estado', ['en_ruta', 'facturado', 'prog._cargue', 'asignado', 'pendiente'])
      .order('id', { ascending: true })
      .limit(50)

    if (error) {
      console.warn('[driverSync] Error al consultar pedidos por placa:', error.message)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Mapear filas de Supabase a DeliveryOrder de la PWA
    const mapped: DeliveryOrder[] = data.map((row: any, idx: number) => {
      // Coordenadas aproximadas según ciudad o aleatorias si faltan
      const baseLat = 4.6782 + (idx * 0.006)
      const baseLng = -74.0534 - (idx * 0.004)

      return {
        id: String(row.id || `supa-${idx}`),
        order_number: String(row.numero_pedido || `PED-${idx + 1000}`),
        opv: row.opv ? String(row.opv) : undefined,
        invoice_number: row.numero_factura || undefined,
        sequence_order: idx + 1,
        customer_name: row.cliente || row.nombre_cliente || 'Cliente Only Home',
        customer_phone: row.telefono_contacto || row.telefono || '3000000000',
        customer_document: row.cedula || row.documento_cliente || undefined,
        customer_email: row.email || undefined,
        address: row.direccion || 'Dirección de entrega Only Home',
        neighborhood: row.barrio || row.localidad || 'Zona Urbana',
        city: row.ciudad || 'Bogotá D.C.',
        address_notes: row.observaciones || row.notas_entrega || 'Entregar en portería o en mano',
        latitude: Number(row.latitud) || baseLat,
        longitude: Number(row.longitud) || baseLng,
        items: [
          {
            id: `item-${idx}`,
            name: row.descripcion_producto || 'Producto Óptico / Only Home',
            sku: row.sku || 'OPT-CAT-001',
            quantity: Number(row.cantidad) || 1
          }
        ],
        total_units: Number(row.cantidad) || 1,
        status: idx === 0 ? 'next' : 'pending'
      }
    })

    return mapped
  } catch (err: any) {
    console.error('[driverSync] Exception al cargar pedidos:', err)
    return []
  }
}
