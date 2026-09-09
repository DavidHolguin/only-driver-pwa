export type DeliveryStatus = 
  | 'pending'       // En espera en la ruta
  | 'next'          // Siguiente parada prioritaria
  | 'in_transit'    // Conductor en camino hacia este destino
  | 'approaching'   // En zona de proximidad (< 1 km o < 5 min)
  | 'at_door'       // Conductor en la puerta
  | 'delivered'     // Entregado exitosamente
  | 'failed'        // Novedad / no entregado

export interface OrderItem {
  id: string
  name: string
  sku: string
  quantity: number
  category?: string
}

export interface PodEvidence {
  // 3 Fotos obligatorias de entrega exitosa
  invoice_photo_url: string        // 1. Factura firmada
  products_photo_url: string       // 2. Productos entregados
  proof_photo_url: string          // 3. Fachada / Soporte adicional
  
  invoice_blob?: Blob
  products_blob?: Blob
  proof_blob?: Blob
  
  received_by: string
  recipient_id?: string
  recipient_phone?: string
  delivered_at: string
  comments?: string
  driver_coords?: {
    latitude: number
    longitude: number
  }
}

export interface NoveltyEvidence {
  reason: string
  description: string              // Nota o descripción detallada obligatoria
  
  // 3 Fotos obligatorias para No Conforme
  full_products_photo_url: string  // 1. Foto de los productos completos
  defect_photo_url: string         // 2. Foto del detalle de la novedad / no conforme
  additional_photo_url: string     // 3. Foto que considere adicional
  
  full_products_blob?: Blob
  defect_blob?: Blob
  additional_blob?: Blob
  
  reported_at: string
  driver_coords?: {
    latitude: number
    longitude: number
  }
}

export interface DeliveryOrder {
  id: string
  order_number: string
  opv?: string
  invoice_number?: string
  sequence_order: number // 1, 2, 3...
  
  // Cliente
  customer_name: string
  customer_phone: string
  customer_document?: string
  customer_email?: string
  
  // Destino
  address: string
  neighborhood: string
  city: string
  address_notes?: string
  latitude: number
  longitude: number
  
  // Pedido (100% Pago y Facturado)
  items: OrderItem[]
  total_units: number
  
  // Estado & Trazabilidad
  status: DeliveryStatus
  estimated_arrival?: string
  distance_meters?: number
  duration_seconds?: number
  
  // Prueba de entrega / Novedad
  pod?: PodEvidence
  novelty?: NoveltyEvidence
  novelty_reason?: string
  novelty_notes?: string
  updated_at?: string
}

export interface DriverProfile {
  id: string
  name: string
  phone: string
  vehicle_type: 'moto' | 'furgon' | 'camion'
  vehicle_plate: string
  active_route_name: string
  city: string
  is_tracking_active: boolean
}

export interface TelemetryPoint {
  latitude: number
  longitude: number
  accuracy: number
  heading: number | null
  speed: number | null
  timestamp: number
  battery_level?: number
}
