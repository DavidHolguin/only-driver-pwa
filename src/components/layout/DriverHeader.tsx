import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDelivery } from '../../context/DeliveryContext'
import { Avatar } from '../ui/Avatar'

export const DriverHeader: React.FC = () => {
  const { driver } = useDelivery()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const driverName = driver?.name || ''
  const plate = driver?.vehicle_plate || '---'

  return (
    <header
      className="sticky top-0 z-30 bg-brand-deep text-white shadow-sm"
      style={{
        height: 'calc(56px + env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Izquierda: avatar enlazado a perfil con área táctil 44px */}
        <Link
          to="/perfil"
          className="flex items-center justify-center w-11 h-11 -ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Perfil de ${driverName}`}
        >
          <Avatar nombre={driverName} size="sm" className="bg-white/15 text-white ring-1 ring-white/25" />
        </Link>

        {/* Centro: placa */}
        <span className="font-mono text-[20px] font-semibold tracking-tight select-none leading-none">
          {plate}
        </span>

        {/* Derecha: punto de conectividad de 8px sin texto */}
        <div className="flex items-center justify-center w-11 h-11 -mr-1">
          <span
            role="status"
            className="block w-2 h-2 rounded-full"
            style={{
              backgroundColor: isOnline
                ? 'hsl(var(--health-good))'
                : 'hsl(var(--health-warn))',
            }}
            aria-label={isOnline ? 'Conectado' : 'Sin conexión'}
          />
        </div>
      </div>
    </header>
  )
}

export default DriverHeader
