import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DeliveryProvider } from './context/DeliveryContext'
import { DriverHeader } from './components/layout/DriverHeader'
import { BottomNavigation } from './components/layout/BottomNavigation'
import { RouteListPage } from './pages/RouteListPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { DeliveryCompletePage } from './pages/DeliveryCompletePage'
import { DriverProfilePage } from './pages/DriverProfilePage'
import { useWakeLock } from './hooks/useWakeLock'
import { Toaster } from 'sonner'

function AppContent() {
  const { requestLock } = useWakeLock()

  // Mantener pantalla activa para facilitar visualización del conductor mientras maneja
  useEffect(() => {
    requestLock()
  }, [requestLock])

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background relative shadow-2xl overflow-x-hidden font-sans">
      <DriverHeader />
      <main className="min-h-[calc(100vh-120px)]">
        <Routes>
          <Route path="/" element={<RouteListPage />} />
          <Route path="/pedido/:id" element={<OrderDetailPage />} />
          <Route path="/pedido/:id/completar" element={<DeliveryCompletePage />} />
          <Route path="/perfil" element={<DriverProfilePage />} />
        </Routes>
      </main>
      <BottomNavigation />
      <Toaster position="top-center" richColors />
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <DeliveryProvider>
        <AppContent />
      </DeliveryProvider>
    </BrowserRouter>
  )
}

export default App
