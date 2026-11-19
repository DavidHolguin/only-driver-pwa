import React, { useState, useRef } from 'react'
import { useDelivery } from '../context/DeliveryContext'
import { Avatar } from '../components/ui/Avatar'
import { Phone, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export const DriverProfilePage: React.FC = () => {
  const { driver, stats } = useDelivery()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Vista previa local de foto de perfil. No se persiste: en la fase 4 esta imagen
  // se sube al bucket y el perfil la lee desde el servidor.
  const [localAvatar, setLocalAvatar] = useState<string | null>(null)

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setLocalAvatar(reader.result as string)
        toast.success('Foto de perfil actualizada')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCerrarSesion = () => {
    const claves = ['only_driver_orders_v3', 'only_driver_profile_v3', 'only_driver_assigned_plate']
    const respaldo = claves.map((k) => [k, localStorage.getItem(k)] as const)

    claves.forEach((k) => localStorage.removeItem(k))
    setLocalAvatar(null)

    // Acción destructiva con deshacer: si nadie la revierte, se sale de la sesión.
    toast('¿Cerrar sesión en este teléfono?', {
      duration: 6000,
      action: {
        label: 'Deshacer',
        onClick: () => {
          respaldo.forEach(([k, v]) => v !== null && localStorage.setItem(k, v))
          toast.info('Sesión restaurada')
        },
      },
      onDismiss: () => {
        window.location.href = '/'
      },
      onAutoClose: () => {
        window.location.href = '/'
      },
    })
  }

  const driverName = driver?.name || ''
  const plate = driver?.vehicle_plate || '---'

  return (
    <div className="min-h-screen bg-background pb-24 font-sans">
      <div className="px-4 py-4 space-y-4">
        {/* Tarjeta de perfil: Avatar, cambiar foto, nombre, placa, teléfono */}
        <div className="bg-card rounded-2xl p-6 border border-border flex flex-col items-center text-center space-y-3">
          <Avatar
            nombre={driverName}
            size="lg"
            fotoUrl={localAvatar || undefined}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold text-primary hover:underline min-h-[44px] px-3 flex items-center justify-center active:scale-95 transition"
          >
            Cambiar foto
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFotoChange}
          />

          <div className="space-y-1">
            <h1 className="text-[20px]/[1.3] font-semibold text-foreground">
              {driverName}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-sm bg-secondary px-2.5 py-0.5 rounded-lg text-foreground font-semibold border border-border">
                {plate}
              </span>
              {driver?.vehicle_type && (
                <span className="capitalize text-xs text-muted-foreground">
                  · {driver.vehicle_type}
                </span>
              )}
            </div>
          </div>

          {driver?.phone && (
            <div className="pt-1">
              <a
                href={`tel:${driver.phone}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-mono text-sm transition min-h-[44px]"
                aria-label={`Llamar a ${driver.phone}`}
              >
                <Phone className="w-4 h-4 text-primary" />
                <span>{driver.phone}</span>
              </a>
            </div>
          )}
        </div>

        {/* Métricas del turno en dos columnas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <span className="font-mono text-2xl font-semibold text-foreground block">
              {stats.total}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Paradas
            </span>
          </div>

          <div className="bg-card rounded-2xl p-4 border border-border">
            <span className="font-mono text-2xl font-semibold text-foreground block">
              {stats.delivered}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Entregadas
            </span>
          </div>
        </div>

        {/* Botón Cerrar sesión */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCerrarSesion}
            className="w-full h-11 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DriverProfilePage
