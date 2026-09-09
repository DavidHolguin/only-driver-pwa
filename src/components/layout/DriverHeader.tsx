import React from 'react'
import { useDelivery } from '../../context/DeliveryContext'
import { Truck, Radio, PauseCircle, RefreshCw, ChevronDown } from 'lucide-react'

export const DriverHeader: React.FC = () => {
  const { 
    driver, 
    toggleDriverStatus, 
    stats, 
    setIsPlateModalOpen, 
    reloadAssignedOrders, 
    isLoadingOrders 
  } = useDelivery()

  return (
    <header className="sticky top-0 z-30 bg-[#001F36] text-white border-b border-[#003B66]/50 shadow-md pt-safe">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Brand & Driver Info (Clickable to switch plate/vehicle) */}
        <button 
          onClick={() => setIsPlateModalOpen(true)}
          className="flex items-center gap-3 text-left group hover:opacity-95 transition-opacity"
          title="Toca para cambiar vehículo o conductor"
        >
          <div className="relative">
            {driver.photo_url ? (
              <img 
                src={driver.photo_url} 
                alt={driver.name} 
                className="w-10 h-10 rounded-xl object-cover border-2 border-sky-400 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Truck className="w-5 h-5 text-sky-400" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-sky-500 rounded-full p-0.5 text-white">
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                ONLY <span className="text-sky-400 font-semibold text-xs">DRIVER</span>
              </span>
              <span className="bg-sky-500/20 text-sky-300 font-mono text-[11px] px-2 py-0.5 rounded font-bold border border-sky-400/30">
                {driver.vehicle_plate}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium truncate max-w-[170px]">
              {driver.name}
            </p>
          </div>
        </button>

        {/* Action Controls: Refresh from Cloud & Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => reloadAssignedOrders()}
            disabled={isLoadingOrders}
            aria-label="Recargar pedidos asignados"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sky-300 transition-all border border-white/10"
            title="Recargar ruta desde el servidor"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin text-white' : ''}`} />
          </button>

          {/* GPS Tracking Toggle Button */}
          <button
            onClick={toggleDriverStatus}
            aria-label="Estado de ruta y GPS"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
              driver.is_tracking_active
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30'
            }`}
          >
            {driver.is_tracking_active ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>En Ruta</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Pausado</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subheader Route Stats Strip */}
      <div className="bg-[#001729] px-4 py-2 flex items-center justify-between text-[11px] text-slate-300 border-t border-white/5">
        <span className="font-medium text-slate-300 truncate max-w-[200px]">
          📍 {driver.active_route_name}
        </span>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-emerald-400 font-semibold">{stats.delivered}/{stats.total} listos</span>
          <span className="text-slate-500">|</span>
          <span className="text-sky-300">{stats.progressPercentage}%</span>
        </div>
      </div>
    </header>
  )
}
