import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ListOrdered, MapPin, User, ShieldCheck } from 'lucide-react'

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // No mostrar en la pantalla de cierre de entrega o detalle de pedido para dejar espacio a los CTAs de acción
  if (location.pathname.includes('/pedido/')) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-border shadow-floating pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {/* Tab 1: Ruta */}
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center w-20 h-full py-1 transition-colors ${
            location.pathname === '/' ? 'text-[#003B66]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ListOrdered className={`w-5 h-5 ${location.pathname === '/' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1">Mi Ruta</span>
        </button>

        {/* Tab 2: Perfil / Rendimiento */}
        <button
          onClick={() => navigate('/perfil')}
          className={`flex flex-col items-center justify-center w-20 h-full py-1 transition-colors ${
            location.pathname === '/perfil' ? 'text-[#003B66]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className={`w-5 h-5 ${location.pathname === '/perfil' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1">Conductor</span>
        </button>
      </div>
    </nav>
  )
}
