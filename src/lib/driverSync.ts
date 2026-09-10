import { supabase } from './supabase'
import { DeliveryOrder } from '../types/delivery'

// Coordenadas base por ciudad / región en Colombia para georreferenciación realista
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'MANIZALES': { lat: 5.0689, lng: -75.5174 },
  'BOGOTA': { lat: 4.6782, lng: -74.0534 },
  'PEREIRA': { lat: 4.8133, lng: -75.6961 },
  'ARMENIA': { lat: 4.5339, lng: -75.6811 },
  'VALLE DEL CAUCA': { lat: 3.4516, lng: -76.5320 },
  'CALI': { lat: 3.4516, lng: -76.5320 },
  'IBAGUE': { lat: 4.4389, lng: -75.2322 },
  'NEIVA': { lat: 2.9273, lng: -75.2819 },
  'POPAYAN': { lat: 2.4419, lng: -76.6063 },
  'BUENAVENTURA': { lat: 3.8801, lng: -77.0312 },
  'PALMIRA': { lat: 3.5394, lng: -76.3036 },
  'ANTIOQUIA': { lat: 6.2442, lng: -75.5812 },
  'MEDELLIN': { lat: 6.2442, lng: -75.5812 },
  'PUEBLOS VALLE': { lat: 3.9000, lng: -76.3000 }
}

function getCityBaseCoords(city?: string, ruta?: string): { lat: number; lng: number } {
  const c = (city || '').trim().toUpperCase()
  const r = (ruta || '').trim().toUpperCase()

  for (const key of Object.keys(CITY_COORDS)) {
    if (c.includes(key) || r.includes(key)) {
      return CITY_COORDS[key]
    }
  }
  return { lat: 4.6782, lng: -74.0534 } // Default Bogotá
}

export async function fetchDriverAssignedOrders(
  plate: string, 
  activeRoute?: string,
  pedidosList?: string[]
): Promise<DeliveryOrder[]> {
  const cleanPlate = (plate || '').trim().toUpperCase()
  const cleanList = (pedidosList || []).map(p => String(p).trim().replace(/^#/, '')).filter(Boolean)
  const routeWords = (activeRoute || '').split(',').map(s => s.trim().toUpperCase()).filter(s => s && s !== 'TODAS' && !s.includes('NACIONALES'))

  try {
    // 1. Revisar si hay un manifiesto despachado en localStorage (desde la Consola)
    const localManifestStr = localStorage.getItem('only_current_dispatch_manifest')
    if (localManifestStr) {
      try {
        const manifest = JSON.parse(localManifestStr)
        if (manifest && Array.isArray(manifest.pedidos) && manifest.pedidos.length > 0) {
          // Si el manifiesto corresponde a esta placa o no tiene placa restrictiva
          if (!manifest.placa || manifest.placa.replace(/\s+/g, '') === cleanPlate.replace(/\s+/g, '')) {
            console.log('[driverSync] Cargando pedidos desde manifiesto local despachado:', manifest.pedidos.length)
            return manifest.pedidos
          }
        }
      } catch (e) {
        console.warn('[driverSync] Error leyendo manifiesto local:', e)
      }
    }

    // 2. Consultar pedidos en Supabase
    let data: any[] = []

    // Si tenemos una lista explícita de pedidos (proveniente de Enlace Mágico / QR)
    if (cleanList.length > 0) {
      const { data: exactData, error: exactErr } = await supabase
        .from('pedidos')
        .select('*')
        .in('numero_pedido', cleanList)

      if (!exactErr && exactData && exactData.length > 0) {
        // Ordenar en la secuencia que venían en el enlace
        data = cleanList
          .map(num => exactData.find((r: any) => String(r.numero_pedido).trim() === num))
          .filter(Boolean)
      }
    }

    // Si no hubo lista explícita o no retornó datos, buscar por ruta / estado
    if (data.length === 0) {
      let query = supabase
        .from('pedidos')
        .select('*')

      // Si tiene ruta específica asignada a la placa
      if (routeWords.length > 0) {
        const orFilter = routeWords.map(w => `ruta.ilike.%${w}%`).join(',')
        query = query.or(orFilter)
      }

      const { data: queryData, error: queryErr } = await query
        .in('estado', ['en_ruta', 'prog._cargue', 'facturado'])
        .order('id', { ascending: true })
        .limit(30)

      if (queryErr) {
        console.warn('[driverSync] Supabase query notice:', queryErr.message)
      } else if (queryData) {
        data = queryData
      }
    }

    if (!data || data.length === 0) {
      return []
    }

    // Mapear filas a DeliveryOrder con georreferenciación por cuadrantes urbanos
    const mapped: DeliveryOrder[] = data.map((row: any, idx: number) => {
      const base = getCityBaseCoords(row.ciudad, row.ruta)
      // Dispersión urbana realista (~500m - 2km)
      const latOffset = ((idx % 5) - 2) * 0.007 + ((idx * 7) % 11) * 0.0012
      const lngOffset = (((idx + 2) % 5) - 2) * 0.007 - ((idx * 3) % 13) * 0.0011

      const lat = Number(row.latitud) || (base.lat + latOffset)
      const lng = Number(row.longitud) || (base.lng + lngOffset)

      let itemsParsed: any[] = []
      if (Array.isArray(row.items)) {
        itemsParsed = row.items.map((it: any, itIdx: number) => ({
          id: `it-${row.id || idx}-${itIdx}`,
          name: it.referencia || it.titulo_catalogo || 'Producto Only Home',
          sku: it.sku || it.codigo || `SKU-${itIdx + 1}`,
          quantity: Number(it.cantidad || 1)
        }))
      } else {
        itemsParsed = [{
          id: `it-${row.id || idx}-0`,
          name: 'Mueble / Producto Only Home',
          sku: 'OPT-ONLY-01',
          quantity: Number(row.cantidad) || 1
        }]
      }

      const totalUnits = itemsParsed.reduce((acc, it) => acc + (it.quantity || 1), 0)

      return {
        id: String(row.id || `ped-${row.numero_pedido || idx}`),
        order_number: String(row.numero_pedido || `PED-${idx + 1000}`),
        opv: row.opv ? String(row.opv) : undefined,
        invoice_number: row.numero_factura || undefined,
        sequence_order: idx + 1,
        customer_name: row.cliente || 'Cliente Only Home',
        customer_phone: row.telefono1 || row.telefono2 || '3000000000',
        customer_document: row.documento || undefined,
        customer_email: row.email || undefined,
        address: row.direccion || 'Dirección de Entrega',
        neighborhood: row.ciudad || 'Zona Urbana',
        city: row.ciudad || 'Colombia',
        address_notes: row.observaciones || 'Entregar en dirección registrada',
        latitude: lat,
        longitude: lng,
        items: itemsParsed,
        total_units: totalUnits,
        status: idx === 0 ? 'next' : 'pending'
      }
    })

    return mapped
  } catch (err: any) {
    console.error('[driverSync] Error en fetchDriverAssignedOrders:', err)
    return []
  }
}
