import React from 'react'
import { useNavigate } from 'react-router-dom'
import { DeliveryOrder, TelemetryPoint } from '../../types/delivery'
import { calculateDistanceMeters } from '../../hooks/useGeolocation'
import { formatDistance, formatPhoneForWhatsApp } from '../../lib/utils'
import { openExternalNavigation } from '../../lib/maps-utils'
import { 
  Phone, 
  MessageSquare, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  Package, 
  MapPin 
} from 'lucide-react'

interface StopCardProps {
  order: DeliveryOrder
  driverCoords: TelemetryPoint
  isActive?: boolean
}

export const StopCard: React.FC<StopCardProps> = ({ order, driverCoords, isActive = false }) => {
  const navigate = useNavigate()

  // Calcular distancia en tiempo real al pedido
  const distanceMeters = calculateDistanceMeters(
    driverCoords.latitude,
    driverCoords.longitude,
    order.latitude,
    order.longitude
  )

  const isDelivered = order.status === 'delivered'
  const isFailed = order.status === 'failed'
  const isNext = order.status === 'next' || order.status === 'in_transit'

  // Mensaje preformateado para WhatsApp del conductor
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    const cleanPhone = formatPhoneForWhatsApp(order.customer_phone)
    const text = `Hola ${order.customer_name}, te saludamos de Only Home 👓. Nuestro conductor se encuentra en ruta con tu pedido #${order.order_number} hacia ${order.address}. ¿Te encuentras en la dirección para recibirlo?`
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.location.href = `tel:${order.customer_phone}`
  }

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation()
    openExternalNavigation(order.latitude, order.longitude, 'google')
  }

  // Estilos según estado
  let cardBorder = 'border-border hover:border-slate-300'
  let sequenceBg = 'bg-[#003B66] text-white'
  let statusBadge = (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Pendiente
    </span>
  )

  if (isDelivered) {
    cardBorder = 'border-emerald-200 bg-emerald-50/30'
    sequenceBg = 'bg-emerald-600 text-white'
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Entregado
      </span>
    )
  } else if (isFailed) {
    cardBorder = 'border-rose-200 bg-rose-50/30'
    sequenceBg = 'bg-rose-600 text-white'
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
        <AlertTriangle className="w-3 h-3" /> Novedad
      </span>
    )
  } else if (isNext) {
    cardBorder = 'border-amber-400 bg-amber-50/20 shadow-md ring-2 ring-amber-400/20'
    sequenceBg = 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full animate-pulse border border-amber-300">
        <Navigation className="w-3 h-3 text-amber-800" /> Siguiente Parada
      </span>
    )
  }

  return (
    <div
      onClick={() => navigate(`/pedido/${order.id}`)}
      className={`relative rounded-2xl bg-white p-4 transition-all duration-200 cursor-pointer shadow-subtle border ${cardBorder} active:scale-[0.99]`}
    >
      {/* Top Header: Sequence # + Order Number + Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-bold ${sequenceBg}`}>
            {isDelivered ? '✓' : `#${order.sequence_order}`}
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-[#001F36]">{order.order_number}</span>
            {order.opv && (
              <span className="ml-1 text-[10px] text-slate-400 font-mono">({order.opv})</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusBadge}
        </div>
      </div>

      {/* Customer & Address Information */}
      <div className="mb-3">
        <h3 className="font-bold text-slate-900 text-sm leading-snug">
          {order.customer_name}
        </h3>
        <p className="text-xs text-slate-600 flex items-start gap-1 mt-0.5 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>{order.address}, <strong className="text-slate-700">{order.neighborhood}</strong></span>
        </p>
        {order.address_notes && (
          <p className="text-[11px] text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded-md mt-1 border border-amber-200/50">
            💬 {order.address_notes}
          </p>
        )}
      </div>

      {/* Package Info and Distance Strip */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs mb-3">
        {/* Units / Packages count */}
        <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
          <Package className="w-3.5 h-3.5 text-slate-400" />
          <span>{order.total_units} {order.total_units === 1 ? 'producto' : 'productos'}</span>
          <span className="text-slate-300">·</span>
          <span className="text-emerald-700 font-semibold">100% Pago</span>
        </div>

        {/* Real-time Distance Indicator */}
        <div className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
          <span>🚗</span>
          <span>{formatDistance(distanceMeters)}</span>
        </div>
      </div>

      {/* Action Buttons: WhatsApp, Call, GPS Nav */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {/* WhatsApp Direct Chat con logo oficial */}
        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-1.5 py-2 px-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs rounded-xl border border-emerald-200 transition-colors active:scale-95"
        >
          <svg className="w-4 h-4 fill-current text-[#25D366] shrink-0" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-4.282 0-7.766 3.483-7.766 7.766 0 1.37.357 2.656.98 3.774l-1.042 3.805 3.904-1.024c1.077.587 2.316.92 3.633.92 4.282 0 7.766-3.483 7.766-7.766 0-4.282-3.484-7.765-7.767-7.765zm0 14.122c-1.168 0-2.285-.316-3.255-.87l-.233-.134-2.316.607.618-2.257-.148-.236c-.615-.98-.94-2.115-.94-3.284 0-3.504 2.851-6.354 6.355-6.354 3.503 0 6.354 2.85 6.354 6.354 0 3.504-2.851 6.354-6.354 6.354z"/>
          </svg>
          <span>WhatsApp</span>
        </button>

        {/* Call Driver Phone */}
        <button
          type="button"
          onClick={handleCall}
          className="flex items-center justify-center gap-1.5 py-2 px-2 bg-sky-50 text-sky-800 hover:bg-sky-100 font-semibold text-xs rounded-xl border border-sky-200 transition-colors active:scale-95"
        >
          <Phone className="w-3.5 h-3.5 text-sky-600" />
          <span>Llamar</span>
        </button>

        {/* GPS Navigation Map */}
        <button
          type="button"
          onClick={handleNavigate}
          className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#001F36] text-white hover:bg-[#003B66] font-semibold text-xs rounded-xl transition-all shadow-sm active:scale-95"
        >
          <Navigation className="w-3.5 h-3.5 text-sky-400" />
          <span>GPS</span>
        </button>
      </div>
    </div>
  )
}
