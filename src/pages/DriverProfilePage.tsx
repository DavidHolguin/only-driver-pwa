import React from 'react'
import { useDelivery } from '../context/DeliveryContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { formatCurrency } from '../lib/utils'
import { 
  User, 
  Truck, 
  MapPin, 
  Phone, 
  Shield, 
  RotateCcw, 
  Zap, 
  Award, 
  CheckCircle2, 
  Radio 
} from 'lucide-react'
import { toast } from 'sonner'

export const DriverProfilePage: React.FC = () => {
  const { driver, stats, orders } = useDelivery()
  const { coords, permissionState } = useGeolocation(driver.is_tracking_active)

  const handleResetDemoData = () => {
    localStorage.removeItem('only_driver_orders')
    toast.success('Ruta reiniciada a valores iniciales')
    setTimeout(() => {
      window.location.href = '/'
    }, 500)
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col pb-24">
      {/* Profile Header */}
      <div className="bg-[#001F36] text-white p-6 pt-safe">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center font-bold text-xl text-sky-300">
            {driver.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h2 className="text-lg font-bold">{driver.name}</h2>
            <p className="text-xs text-sky-300 font-medium">Conductor Logístico Only Home</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded text-slate-200">
                Placa: {driver.vehicle_plate}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Performance Metrics */}
        <div className="bg-white rounded-2xl p-4 shadow-subtle border border-border">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Rendimiento del Turno de Hoy
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 block">Total Paradas</span>
              <span className="font-mono font-bold text-lg text-slate-800">{stats.total}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <span className="text-xs text-emerald-600 block">Entregados</span>
              <span className="font-mono font-bold text-lg text-emerald-800">{stats.delivered}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
              <span className="text-xs text-amber-600 block">Pendientes</span>
              <span className="font-mono font-bold text-lg text-amber-800">{stats.pending}</span>
            </div>
          </div>
        </div>

        {/* Live GPS Telemetry Diagnostics */}
        <div className="bg-white rounded-2xl p-4 shadow-subtle border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              Telemetría y GPS en Vivo
            </span>
            <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {permissionState === 'granted' ? 'GPS Conectado' : 'Simulación Activa'}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 font-mono text-xs space-y-1 text-slate-600 border border-slate-200">
            <div className="flex justify-between">
              <span>Latitud:</span>
              <span className="font-bold text-slate-900">{coords.latitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span>Longitud:</span>
              <span className="font-bold text-slate-900">{coords.longitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span>Precisión GPS:</span>
              <span className="font-bold text-emerald-700">±{Math.round(coords.accuracy)} metros</span>
            </div>
            <div className="flex justify-between">
              <span>Velocidad actual:</span>
              <span className="font-bold text-slate-800">{coords.speed ? `${(coords.speed * 3.6).toFixed(1)} km/h` : '0 km/h (Detenido)'}</span>
            </div>
          </div>
        </div>

        {/* Vehicle & Zone Info */}
        <div className="bg-white rounded-2xl p-4 shadow-subtle border border-border space-y-2 text-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Asignación de Operación
          </span>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Vehículo:</span>
            <span className="font-semibold text-slate-800 capitalize">{driver.vehicle_type} · {driver.vehicle_plate}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Zona / Ciudad:</span>
            <span className="font-semibold text-slate-800">{driver.city}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Teléfono Conductor:</span>
            <span className="font-semibold text-slate-800 font-mono">{driver.phone}</span>
          </div>
        </div>

        {/* Reset / Reset Route Button for Testing */}
        <div className="pt-2">
          <button
            onClick={handleResetDemoData}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reiniciar Ruta y Datos de Prueba</span>
          </button>
        </div>
      </div>
    </div>
  )
}
