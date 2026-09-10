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

  const handleLaunchGoogleMapsNavigation = () => {
    if (order.status === 'pending' || order.status === 'next') {
      markAsInTransit(order.id)
    }
    openExternalNavigation(order.latitude, order.longitude, 'google', order.address)
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

        {/* 🚀 BOTÓN PRINCIPAL DE NAVEGACIÓN GUIADA POR CARRETERA (Google Maps) */}
        {!isDelivered && !isFailed && (
          <button
            onClick={handleLaunchGoogleMapsNavigation}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-sky-600 to-[#1a73e8] hover:from-sky-700 hover:to-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-sky-500/25 active:scale-98 transition-all"
          >
            <Navigation className="w-5 h-5 fill-current" />
            <span>Iniciar Navegación Guiada en Google Maps</span>
          </button>
        )}

        {/* Action Hub: Quick Communication with Customer (WhatsApp Oficial & Llamada de Conductor) */}
        <div className="bg-white rounded-2xl p-4 shadow-subtle border border-border">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Contacto Inmediato con Cliente
          </span>

          <div className="grid grid-cols-2 gap-3">
            {/* WhatsApp Oficial Button */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-98"
            >
              <svg className="w-5 h-5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-4.282 0-7.766 3.483-7.766 7.766 0 1.37.357 2.656.98 3.774l-1.042 3.805 3.904-1.024c1.077.587 2.316.92 3.633.92 4.282 0 7.766-3.483 7.766-7.766 0-4.282-3.484-7.765-7.767-7.765zm0 14.122c-1.168 0-2.285-.316-3.255-.87l-.233-.134-2.316.607.618-2.257-.148-.236c-.615-.98-.94-2.115-.94-3.284 0-3.504 2.851-6.354 6.355-6.354 3.503 0 6.354 2.85 6.354 6.354 0 3.504-2.851 6.354-6.354 6.354z"/>
              </svg>
              <span>WhatsApp</span>
            </button>

            {/* Direct Call Button */}
            <button
              onClick={handleCall}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[#001F36] hover:bg-[#003B66] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-98"
            >
              <Phone className="w-5 h-5 text-sky-400" />
              <span>Llamar</span>
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

        {/* Google Maps Interactivo con Vista Pantalla Completa / Minimizado */}
        <div className="bg-white rounded-2xl p-3 shadow-subtle border border-border">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Navegación Google Maps en Vivo
            </span>
            <span className="text-[11px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded-md">
              Toca para ampliar
            </span>
          </div>
          <GoogleRouteMap
            driverCoords={coords}
            orders={[order]}
            selectedOrderId={order.id}
            height="220px"
            allowFullscreenToggle={true}
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

            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Facturado
            </span>
          </div>
        </div>

        {/* Evidencia de Entrega si ya fue realizada */}
        {order.pod && (
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-emerald-200 space-y-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Evidencia de Entrega Registrada (3 Fotos)
            </span>
            
            <div className="grid grid-cols-3 gap-2">
              {order.pod.invoice_photo_url && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 truncate">1. Factura</span>
                  <img
                    src={order.pod.invoice_photo_url}
                    alt="Factura firmada"
                    className="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                </div>
              )}

              {order.pod.products_photo_url && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 truncate">2. Productos</span>
                  <img
                    src={order.pod.products_photo_url}
                    alt="Productos entregados"
                    className="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                </div>
              )}

              {order.pod.proof_photo_url && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 truncate">3. Fachada</span>
                  <img
                    src={order.pod.proof_photo_url}
                    alt="Constancia de entrega"
                    className="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="text-xs space-y-1 text-slate-600 pt-2 border-t border-slate-100">
              <p><strong>Recibido por:</strong> {order.pod.received_by || 'Cliente'}</p>
              {order.pod.comments && <p><strong>Comentarios:</strong> {order.pod.comments}</p>}
            </div>
          </div>
        )}

        {/* Evidencia de Novedad / No Conforme si ocurrió */}
        {order.novelty && (
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-rose-200 space-y-3">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
              Evidencia de No Conforme (3 Fotos)
            </span>

            <div className="grid grid-cols-3 gap-2">
              {order.novelty.full_products_photo_url && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 truncate">1. Productos</span>
                  <img
                    src={order.novelty.full_products_photo_url}
                    alt="Productos completos"
                    className="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                </div>
              )}

              {order.novelty.defect_photo_url && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 truncate">2. Novedad</span>
                  <img
                    src={order.novelty.defect_photo_url}
                    alt="Detalle de novedad"
                    className="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                </div>
              )}

              {order.novelty.additional_photo_url && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 truncate">3. Adicional</span>
                  <img
                    src={order.novelty.additional_photo_url}
                    alt="Soporte adicional"
                    className="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="text-xs space-y-1 text-slate-700 pt-2 border-t border-slate-100">
              <p><strong>Motivo:</strong> {order.novelty.reason}</p>
              <p><strong>Detalle del conductor:</strong> {order.novelty.description}</p>
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
