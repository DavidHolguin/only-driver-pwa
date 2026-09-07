import { useState, useEffect, useCallback, useRef } from 'react'
import { TelemetryPoint } from '../types/delivery'

// Coordenadas default (Bogotá centro/norte Only Home operaciones)
const DEFAULT_COORDS = {
  latitude: 4.6758,
  longitude: -74.0583,
  accuracy: 10,
  heading: 0,
  speed: 0,
  timestamp: Date.now()
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c)
}

export function useGeolocation(autoStart = true) {
  const [coords, setCoords] = useState<TelemetryPoint>(DEFAULT_COORDS)
  const [error, setError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  
  const watchIdRef = useRef<number | null>(null)

  const handlePositionSuccess = useCallback((pos: GeolocationPosition) => {
    const point: TelemetryPoint = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp
    }
    setCoords(point)
    setError(null)
    setPermissionState('granted')
  }, [])

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    let msg = 'Error obteniendo ubicación GPS'
    if (err.code === err.PERMISSION_DENIED) {
      msg = 'Permiso de ubicación denegado por el usuario'
      setPermissionState('denied')
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      msg = 'Señal GPS no disponible'
    } else if (err.code === err.TIMEOUT) {
      msg = 'Tiempo de espera de GPS agotado'
    }
    setError(msg)
  }, [])

  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocalización no soportada en este navegador')
      return
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    setIsTracking(true)

    // First instant query
    navigator.geolocation.getCurrentPosition(handlePositionSuccess, handlePositionError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3000
    })

    // Continuous watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 2000
      }
    )
  }, [handlePositionSuccess, handlePositionError])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }, [])

  useEffect(() => {
    if (autoStart) {
      startTracking()
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [autoStart, startTracking])

  return {
    coords,
    error,
    isTracking,
    permissionState,
    startTracking,
    stopTracking,
    calculateDistance: (targetLat: number, targetLng: number) =>
      calculateDistanceMeters(coords.latitude, coords.longitude, targetLat, targetLng)
  }
}
