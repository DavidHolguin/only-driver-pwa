import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDelivery } from '../context/DeliveryContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { formatDistance, formatPhoneForWhatsApp } from '../lib/utils'
import { openExternalNavigation } from '../lib/maps-utils'
import { GoogleRouteMap } from '../components/maps/GoogleRouteMap'
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  Navigation, 
  MapPin, 
  User, 
  Package, 
  Camera, 
  ExternalLink,
  CheckCircle2, 
  AlertTriangle,
  ShieldCheck
} from 'lucide-react'

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getOrderById, driver, markAsInTransit } = useDelivery()
  const { coords } = useGeolocation(driver.is_tracking_active)

  const order = getOrderById(id || '')

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Pedido no encontrado</h2>
        <p className="text-xs text-slate-500 mb-4">El pedido solicitado no existe o fue completado.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[#001F36] text-white rounded-xl text-sm font-bold"
        >
          Volver a la Ruta
        </button>
      </div>
    )
  }

  const isDelivered = order.status === 'delivered'
  const isFailed = order.status === 'failed'

  const handleWhatsApp = () => {
    const cleanPhone = formatPhoneForWhatsApp(order.customer_phone)
    const message = `Hola ${order.customer_name}, te saludamos de Only Home 👓. Nuestro conductor ${driver.name} se encuentra en camino con tu pedido #${order.order_number} hacia ${order.address}. ¿Te encuentras disponible en la dirección?`
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleCall = () => {
    window.location.href = `tel:${order.customer_phone}`
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col pb-32">
      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#001F36] text-white px-4 py-3 shadow-md pt-safe flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          aria-label="Volver a la ruta"
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ruta</span>
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase tracking-wider text-sky-300 font-semibold block">
            Parada #{order.sequence_order} de Ruta
          </span>
          <h1 className="font-mono text-sm font-bold text-white">{order.order_number}</h1>
        </div>

        <div className="w-12 text-right">
          {order.opv && (
            <span className="font-mono text-[10px] text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">
              {order.opv}
            </span>
          )}
        </div>
      </header>

      {/* Main Details Body */}
      <div className="p-4 space-y-4">
        {/* Status Alert Banner */}
        {isDelivered && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-emerald-900 text-sm">Pedido Entregado con Éxito</h4>
              <p className="text-xs text-emerald-700">
                Registrado {order.pod?.delivered_at ? new Date(order.pod.delivered_at).toLocaleTimeString() : 'hoy'}
              </p>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-bold text-rose-900 text-sm">Entrega No Realizada (Novedad)</h4>
              <p className="text-xs text-rose-700">{order.novelty_reason}</p>
            </div>
          </div>
        )}

        {/* Action Hub: Quick Communication Buttons */}
        <div className="bg-white rounded-2xl p-4 shadow-subtle border border-border">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Contacto Inmediato con Cliente
          </span>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* WhatsApp Big Button */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-98"
            >
              <MessageSquare className="w-5 h-5 text-white" />
              <span>WhatsApp</span>
            </button>

            {/* Direct Call Big Button */}
            <button
              onClick={handleCall}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[#003B66] hover:bg-[#001F36] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-98"
            >
              <Phone className="w-5 h-5 text-sky-300" />
              <span>Llamar</span>
            </button>
          </div>

          {/* GPS Navigation Deep Links */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => openExternalNavigation(order.latitude, order.longitude, 'google')}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200"
            >
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Google Maps</span>
            </button>
            <button
              onClick={() => openExternalNavigation(order.latitude, order.longitude, 'waze')}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200"
            >
              <ExternalLink className="w-4 h-4 text-sky-600" />
              <span>Waze App</span>
            </button>
          </div>
        </div>

        {/* Customer & Address Details */}
        <div className="bg-white rounded-2xl p-4 shadow-subtle border border-border">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Datos de Entrega y Destino
          </span>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Cliente</span>
                <span className="font-bold text-slate-900">{order.customer_name}</span>
                {order.customer_document && (
                  <span className="text-xs text-slate-500 font-mono block">C.C. {order.customer_document}</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-100">
              <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Dirección</span>
                <span className="font-bold text-slate-900">{order.address}</span>
                <span className="text-xs text-slate-600 block">{order.neighborhood}, {order.city}</span>
                {order.address_notes && (
                  <div className="mt-1 p-2 bg-amber-50 rounded-lg text-xs text-amber-900 border border-amber-200">
                    <strong>Referencia:</strong> {order.address_notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mini Route Map Preview */}
        <div className="bg-white rounded-2xl p-3 shadow-subtle border border-border">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 px-1">
            Ubicación en Mapa
          </span>
          <GoogleRouteMap
            driverCoords={coords}
            orders={[order]}
            selectedOrderId={order.id}
            height="180px"
          />
        </div>

        {/* Order Items List */}
        <div className="bg-white rounded-2xl p-4 shadow-subtle border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-400" />
              Productos a Entregar ({order.items.length})
            </span>
            {order.invoice_number && (
              <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Factura {order.invoice_number}
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block text-sm">{item.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">SKU: {item.sku}</span>
                </div>
                <div className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Cant: {item.quantity}
                </div>
              </div>
            ))}
          </div>

          {/* Verification Badge */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Package className="w-4 h-4 text-slate-400" />
              <span>Total unidades: <strong>{order.total_units}</strong></span>
            </div>

            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Pagado
            </span>
          </div>
        </div>

        {/* Existing POD Evidence if delivered */}
        {order.pod && (
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-emerald-200">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-2">
              Evidencia de Entrega Registrada
            </span>
            {order.pod.photo_url && (
              <img
                src={order.pod.photo_url}
                alt="Foto de Entrega"
                className="w-full h-48 object-cover rounded-xl border border-slate-200 mb-2"
              />
            )}
            <div className="text-xs space-y-1 text-slate-600">
              <p><strong>Recibido por:</strong> {order.pod.received_by || 'Cliente'}</p>
              {order.pod.comments && <p><strong>Comentarios:</strong> {order.pod.comments}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      {!isDelivered && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-border shadow-floating pb-safe z-30 flex items-center gap-3">
          <button
            onClick={() => navigate(`/pedido/${order.id}/completar`)}
            className="flex-1 py-3.5 px-4 bg-[#001F36] hover:bg-[#003B66] text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Camera className="w-5 h-5 text-sky-300" />
            <span>Completar Entrega</span>
          </button>

          <button
            onClick={() => navigate(`/pedido/${order.id}/completar?mode=novedad`)}
            className="py-3.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl font-bold text-xs active:scale-98 transition-all"
          >
            Novedad
          </button>
        </div>
      )}
    </div>
  )
}
