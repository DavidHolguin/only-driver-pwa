import React, { useState, useMemo } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  Search,
  X,
  Check,
  ChevronDown,
  List,
  Map,
  Truck,
  AlertTriangle,
} from 'lucide-react'
import { useDelivery } from '../context/DeliveryContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { StopCard } from '../components/orders/StopCard'
import { GoogleRouteMap } from '../components/maps/GoogleRouteMap'
import { OfflineBanner } from '../components/ui/OfflineBanner'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { formatoFechaCRM } from '../lib/fecha'
import { cn } from '../lib/utils'

type FilterType = 'all' | 'pending' | 'delivered'

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'Todas',
  pending: 'Pendientes',
  delivered: 'Entregadas',
}

export const RouteListPage: React.FC = () => {
  const { orders, driver, stats, isLoadingOrders, reloadAssignedOrders } = useDelivery()
  const { coords } = useGeolocation(driver.is_tracking_active)

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [hasError, setHasError] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const hasActiveFilter = search.trim() !== '' || filter !== 'all'

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await reloadAssignedOrders()
      setHasError(false)
    } catch {
      setHasError(true)
    } finally {
      setIsRetrying(false)
    }
  }

  // Filtrado de paradas
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Estado
      const st = order.status.toLowerCase()
      const isDelivered = st === 'delivered' || st === 'entregado' || st === 'entregada'
      const isFailed = st === 'failed' || st === 'no_conforme' || st === 'no conforme'

      if (filter === 'pending' && (isDelivered || isFailed)) return false
      if (filter === 'delivered' && !isDelivered) return false

      // Buscador
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const matchName = order.customer_name?.toLowerCase().includes(q)
        const matchAddress = order.address?.toLowerCase().includes(q)
        const matchNeighborhood = order.neighborhood?.toLowerCase().includes(q)
        const matchOrderNumber = order.order_number?.toLowerCase().includes(q)
        const matchSeq = order.sequence_order?.toString() === q
        return matchName || matchAddress || matchNeighborhood || matchOrderNumber || matchSeq
      }

      return true
    })
  }, [orders, filter, search])

  // Parada activa siguiente
  const currentStop = orders.find(
    (o) => o.status === 'in_transit' || o.status === 'next'
  )

  // 1. Estado de carga: 4 skeletons
  if (isLoadingOrders) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20">
        <OfflineBanner />
        <div className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden" />
          <Skeleton className="w-8 h-3 rounded" />
        </div>
        <div className="px-4 py-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // 2. Estado de error: tarjeta con AlertTriangle y botón Reintentar
  if (hasError) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20">
        <OfflineBanner />
        <div className="px-4 py-8 flex flex-col items-center">
          <div className="w-full max-w-sm rounded-2xl border border-destructive/20 bg-card p-6 flex flex-col items-center text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-destructive stroke-[1.5]" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">No pudimos cargar tu ruta</h3>
              <p className="text-sm text-muted-foreground">Ocurrió un error al obtener tus pedidos asignados.</p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="mt-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition"
            >
              {isRetrying ? 'Reintentando...' : 'Reintentar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 3. Estado vacío: EmptyState con Truck
  if (orders.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20">
        <OfflineBanner />
        <div className="px-4 py-16 flex items-center justify-center">
          <EmptyState
            icon={Truck}
            titulo="No tenés ruta asignada hoy"
            detalle="Cuando operación te asigne un cargue, aparecerá acá"
          />
        </div>
      </div>
    )
  }

  // 4. Estado normal
  const progressRatio = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Banner de conectividad si está offline */}
      <OfflineBanner />

      {/* Entrada: barra de progreso de 4 px pegada bajo el header con entregadas/total a la derecha */}
      <div
        className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between gap-3 select-none"
        title={`Ruta del ${formatoFechaCRM()}`}
      >
        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progressRatio}%` }}
            role="progressbar"
            aria-valuenow={stats.delivered}
            aria-valuemin={0}
            aria-valuemax={stats.total}
          />
        </div>
        <span className="font-mono text-xs font-medium text-muted-foreground shrink-0">
          {stats.delivered}/{stats.total}
        </span>
      </div>

      {/* Fila única de filtros: [buscador flex-1][DropdownMenu Estado][botón X si hay filtro] + [Lista | Mapa] */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        {/* Buscador flex-1 con icono Search */}
        <div className="relative flex-1 min-w-0 h-10 rounded-xl border border-border bg-card flex items-center px-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full h-full bg-transparent pl-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            aria-label="Buscar parada"
          />
        </div>

        {/* DropdownMenu Estado */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="h-10 px-3 rounded-xl border border-border bg-card flex items-center gap-1 text-sm font-medium text-foreground outline-none active:scale-[0.98] transition shrink-0"
              aria-label="Filtrar por estado"
            >
              <span>{FILTER_LABELS[filter]}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[130px] bg-card border border-border rounded-xl p-1 shadow-lg text-sm text-foreground animate-in fade-in-50"
              sideOffset={4}
              align="end"
            >
              {(['all', 'pending', 'delivered'] as const).map((key) => (
                <DropdownMenu.Item
                  key={key}
                  onSelect={() => setFilter(key)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary outline-none text-sm select-none"
                >
                  <span>{FILTER_LABELS[key]}</span>
                  {filter === key && <Check className="w-4 h-4 text-primary ml-2" />}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Botón X solo si hay filtro activo */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setFilter('all')
            }}
            aria-label="Limpiar filtros"
            className="h-10 w-10 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Segmented control Lista | Mapa a la derecha */}
        <div className="h-10 p-0.5 rounded-xl border border-border bg-card flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="Vista Lista"
            className={cn(
              'h-full px-1.5 min-[380px]:px-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition',
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="w-4 h-4" />
            <span className="hidden min-[380px]:inline">Lista</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            aria-label="Vista Mapa"
            className={cn(
              'h-full px-1.5 min-[380px]:px-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition',
              viewMode === 'map'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Map className="w-4 h-4" />
            <span className="hidden min-[380px]:inline">Mapa</span>
          </button>
        </div>
      </div>

      {/* Contenido principal: Lista o Mapa */}
      <div className="px-4 py-3 flex-1">
        {viewMode === 'map' ? (
          <div className="flex flex-col gap-3">
            <GoogleRouteMap
              driverCoords={coords}
              orders={orders}
              height="60vh"
            />
            {currentStop && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Siguiente parada en ruta
                </p>
                <StopCard order={currentStop} driverCoords={coords} isActive />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border bg-card space-y-1">
                <p className="text-sm font-semibold text-foreground">Sin resultados</p>
                <p className="text-xs text-muted-foreground">
                  No hay paradas que coincidan con la búsqueda o filtro.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <StopCard
                  key={order.id}
                  order={order}
                  driverCoords={coords}
                  isActive={order.id === currentStop?.id}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RouteListPage
