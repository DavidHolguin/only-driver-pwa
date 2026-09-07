import React, { useState } from 'react'
import { useDelivery } from '../context/DeliveryContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { StopCard } from '../components/orders/StopCard'
import { GoogleRouteMap } from '../components/maps/GoogleRouteMap'
import { Map, List, CheckCircle2, Clock, Navigation, AlertCircle, Package } from 'lucide-react'

export const RouteListPage: React.FC = () => {
  const { orders, driver, stats } = useDelivery()
  const { coords } = useGeolocation(driver.is_tracking_active)
  
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered'>('all')

  const filteredOrders = orders.filter((order) => {
    if (filter === 'pending') return order.status !== 'delivered' && order.status !== 'failed'
    if (filter === 'delivered') return order.status === 'delivered'
    return true
  })

  // Siguiente parada activa
  const currentStop = orders.find((o) => o.status === 'in_transit' || o.status === 'next')

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9FC] pb-24">
      {/* Route Summary Card */}
      <div className="p-4">
        <div className="bg-white rounded-2xl p-4 shadow-subtle border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Progreso de Entregas
            </span>
            <span className="font-mono text-xs font-bold text-[#001F36]">
              {stats.delivered} de {stats.total} Paradas ({stats.progressPercentage}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3 border border-slate-200/60">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${stats.progressPercentage}%` }}
            />
          </div>

          {/* Operational Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[11px]">Pendientes:</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {stats.pending} paradas
                </span>
              </div>
            </div>
            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-emerald-700 block text-[11px]">Completados:</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  {stats.delivered} entregados
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher (Lista vs Mapa) & Filters */}
      <div className="px-4 mb-3 flex items-center justify-between gap-2">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#001F36] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-border hover:bg-slate-50'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'pending'
                ? 'bg-[#001F36] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-border hover:bg-slate-50'
            }`}
          >
            Pendientes ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'delivered'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-border hover:bg-slate-50'
            }`}
          >
            Entregados ({stats.delivered})
          </button>
        </div>

        {/* View Toggle (List / Map) */}
        <div className="flex bg-slate-200/80 p-0.5 rounded-xl shrink-0 border border-slate-300/60">
          <button
            onClick={() => setViewMode('list')}
            aria-label="Vista Lista"
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'list'
                ? 'bg-white text-[#001F36] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            aria-label="Vista Mapa"
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'map'
                ? 'bg-white text-[#001F36] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Map or List */}
      <div className="px-4 flex-1">
        {viewMode === 'map' ? (
          <div className="flex flex-col gap-3">
            <GoogleRouteMap
              driverCoords={coords}
              orders={orders}
              height="60vh"
            />
            {currentStop && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Siguiente Parada en Ruta:
                </p>
                <StopCard order={currentStop} driverCoords={coords} isActive />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h4 className="font-bold text-slate-800 text-sm">No hay paradas en esta categoría</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Revisa los demás filtros o continúa con tus entregas pendientes.
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
