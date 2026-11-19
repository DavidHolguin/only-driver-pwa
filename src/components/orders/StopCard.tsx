import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigation } from 'lucide-react'
import { DeliveryOrder, TelemetryPoint } from '../../types/delivery'
import { openExternalNavigation } from '../../lib/maps-utils'
import { cn } from '../../lib/utils'

export interface StopCardProps {
  order: DeliveryOrder
  driverCoords?: TelemetryPoint
  isActive?: boolean
  className?: string
}

function obtenerEtiquetaEstado(status: string): string {
  const normal = status.toLowerCase()
  switch (normal) {
    case 'pending':
    case 'en_cola':
    case 'en cola':
      return 'En cola'
    case 'next':
    case 'siguiente':
      return 'Siguiente'
    case 'in_transit':
    case 'en_camino':
    case 'en camino':
      return 'En camino'
    case 'approaching':
    case 'cerca':
      return 'Cerca'
    case 'at_door':
    case 'en_puerta':
    case 'en puerta':
      return 'En puerta'
    case 'delivered':
    case 'entregado':
    case 'entregada':
      return 'Entregada'
    case 'failed':
    case 'no_conforme':
    case 'no conforme':
    case 'no_entregado':
    case 'no entregada':
      return 'No conforme'
    default:
      return status.replace(/_/g, ' ')
  }
}

function obtenerEstiloEstado(status: string): string {
  const normal = status.toLowerCase()
  if (normal === 'delivered' || normal === 'entregado' || normal === 'entregada') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
  if (normal === 'failed' || normal === 'no_conforme' || normal === 'no conforme') {
    return 'bg-red-50 text-destructive border-red-200/60'
  }
  if (['in_transit', 'next', 'approaching', 'at_door'].includes(normal)) {
    return 'bg-blue-50 text-primary border-blue-200/60'
  }
  return 'bg-secondary text-muted-foreground border-border/50'
}

export const StopCard: React.FC<StopCardProps> = ({ order, className }) => {
  const navigate = useNavigate()

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation()
    openExternalNavigation(order)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/pedido/${order.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/pedido/${order.id}`)
        }
      }}
      className={cn(
        'rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 cursor-pointer select-none active:scale-[.99] transition duration-150',
        className
      )}
    >
      {/* Línea 1: badge número de parada + nombre cliente (subheading, truncate) */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 w-7 h-7 rounded-lg bg-secondary text-foreground flex items-center justify-center font-mono text-xs font-semibold">
          {order.sequence_order}
        </span>
        <h3 className="text-base font-semibold text-foreground truncate min-w-0">
          {order.customer_name}
        </h3>
      </div>

      {/* Línea 2: dirección (text-sm text-muted-foreground, truncate) */}
      <p className="text-sm text-muted-foreground truncate -mt-0.5">
        {order.address}{order.neighborhood ? `, ${order.neighborhood}` : ''}
      </p>

      {/* Línea 3: badge estado + botón navegar (área 44px) */}
      <div className="flex items-center justify-between -mt-0.5">
        <span
          className={cn(
            'inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border',
            obtenerEstiloEstado(order.status)
          )}
        >
          {obtenerEtiquetaEstado(order.status)}
        </span>

        <button
          type="button"
          onClick={handleNavigate}
          aria-label={`Navegar hacia ${order.customer_name}`}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-secondary hover:bg-secondary/80 text-foreground active:scale-95 transition"
        >
          <Navigation className="w-5 h-5 text-primary" />
        </button>
      </div>
    </div>
  )
}

export default StopCard
