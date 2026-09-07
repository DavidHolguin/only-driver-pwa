import { useState, useEffect, useCallback } from 'react'

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false)
  const [wakeLockSentinel, setWakeLockSentinel] = useState<any>(null)

  const requestLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await (navigator as any).wakeLock.request('screen')
        setWakeLockSentinel(lock)
        setIsLocked(true)

        lock.addEventListener('release', () => {
          setIsLocked(false)
          setWakeLockSentinel(null)
        })
      } catch (err) {
        console.warn('WakeLock request error:', err)
      }
    }
  }, [])

  const releaseLock = useCallback(async () => {
    if (wakeLockSentinel) {
      try {
        await wakeLockSentinel.release()
        setWakeLockSentinel(null)
        setIsLocked(false)
      } catch (err) {
        console.warn('WakeLock release error:', err)
      }
    }
  }, [wakeLockSentinel])

  useEffect(() => {
    // Re-acquire lock on tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLocked) {
        requestLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {})
      }
    }
  }, [isLocked, requestLock, wakeLockSentinel])

  return { isLocked, requestLock, releaseLock }
}
