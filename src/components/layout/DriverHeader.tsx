import React from 'react'
import { useDelivery } from '../../context/DeliveryContext'
import { Truck, ShieldCheck, Radio, PauseCircle, PlayCircle } from 'lucide-react'

export const DriverHeader: React.FC = () => {
  const { driver, toggleDriverStatus, stats } = useDelivery()

  return (
    <header className="sticky top-0 z-30 bg-[#001F36] text-white border-b border-[#003B66]/50 shadow-md pt-safe">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Brand & Driver Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Truck className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                ONLY <span className="text-sky-400 font-semibold text-xs">DRIVER</span>
              </span>
              <span className="bg-sky-500/20 text-sky-300 font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold border border-sky-400/30">
                {driver.vehicle_plate}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium truncate max-w-[180px]">
              {driver.name}
            </p>
          </div>
        </div>

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
