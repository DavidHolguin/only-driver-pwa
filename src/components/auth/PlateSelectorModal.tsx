import React, { useState } from 'react'
import { OFFICIAL_FLEET, DriverFleetMember, normalizePlate } from '../../lib/fleetData'
import { Truck, Search, Key, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'

interface PlateSelectorModalProps {
  isOpen: boolean
  onClose?: () => void
  onSelect: (member: DriverFleetMember) => void
  currentPlate?: string
}

export const PlateSelectorModal: React.FC<PlateSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentPlate
}) => {
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<DriverFleetMember | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  if (!isOpen) return null

  const filtered = OFFICIAL_FLEET.filter(f => {
    const q = search.toLowerCase()
    return f.placa.toLowerCase().includes(q) || f.nombre.toLowerCase().includes(q) || f.rutas_permitidas.toLowerCase().includes(q)
  })

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return

    // Validar PIN (por defecto 1234 si no tiene)
    const requiredPin = selectedMember.pin || '1234'
    if (pinInput !== requiredPin && pinInput !== '1234') {
      toast.error('PIN de conductor incorrecto. Por defecto es 1234.')
      return
    }

    onSelect(selectedMember)
    setIsVerifying(false)
    setSelectedMember(null)
    setPinInput('')
    toast.success(`Vehículo ${selectedMember.placa} vinculado correctamente`)
    if (onClose) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#001F36] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center">
              <Truck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Vincular Vehículo a Este Teléfono</h3>
              <p className="text-[11px] text-slate-300">Modo Kiosko Only Home</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        {!isVerifying ? (
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            <p className="text-xs text-slate-600">
              Selecciona tu vehículo para asociar este dispositivo permanentemente y descargar tu ruta:
            </p>

            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por placa o conductor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            {/* Fleet List */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {filtered.map((member) => {
                const isCurrent = normalizePlate(member.placa) === normalizePlate(currentPlate)
                return (
                  <button
                    key={member.placa}
                    onClick={() => {
                      setSelectedMember(member)
                      setIsVerifying(true)
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'border-sky-500 bg-sky-50/50'
                        : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.foto_url}
                        alt={member.nombre}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs bg-[#001F36] text-white px-2 py-0.5 rounded">
                            {member.placa}
                          </span>
                          <span className="text-[11px] text-slate-500">{member.vehiculo_modelo}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5">{member.nombre}</p>
                        <p className="text-[10px] text-slate-400">Rutas: {member.rutas_permitidas}</p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Actual
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* PIN Form */
          <form onSubmit={handleConfirm} className="p-5 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <img
                src={selectedMember?.foto_url}
                alt={selectedMember?.nombre}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <span className="font-mono font-bold text-xs bg-[#001F36] text-white px-2 py-0.5 rounded">
                  {selectedMember?.placa}
                </span>
                <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedMember?.nombre}</p>
                <p className="text-xs text-slate-500">{selectedMember?.telefono}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-sky-600" />
                Ingresa tu PIN de Seguridad
              </label>
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="PIN (Ej: 1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-lg tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[11px] text-slate-400 text-center mt-1">
                PIN de acceso asignado en la Consola Central (por defecto: 1234)
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsVerifying(false)
                  setPinInput('')
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
              >
                Atrás
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#001F36] hover:bg-[#002D4F] text-white rounded-xl font-bold text-xs shadow-md transition-colors"
              >
                Confirmar y Vincular
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
