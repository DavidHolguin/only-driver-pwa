import React from 'react'
import { LucideIcon, X } from 'lucide-react'
import * as Progress from '@radix-ui/react-progress'
import { cn } from '../lib/utils'

export type Props = {
  etiqueta: string
  icono: LucideIcon
  url?: string | null
  onCapturar: () => void
  onQuitar: () => void
  obligatoria?: boolean
  subiendo?: boolean
  progreso?: number // 0-100, opcional
  className?: string
}

export type PhotoSlotProps = Props

export const PhotoSlot: React.FC<Props> = ({
  etiqueta,
  icono: Icon,
  url,
  onCapturar,
  onQuitar,
  obligatoria = false,
  subiendo = false,
  progreso,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center w-full select-none', className)}>
      {/* Contenedor cuadrado 1:1 */}
      {url ? (
        <div className="w-full aspect-square rounded-2xl border border-border bg-card relative overflow-hidden">
          {/* Miniatura object-cover */}
          <img
            src={url}
            alt={etiqueta}
            className="w-full h-full object-contain bg-secondary/30"
          />

          {/* Botón ✕ de 32 px en la esquina (área táctil ampliada a 44 px con padding) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onQuitar()
            }}
            aria-label={`Quitar foto de ${etiqueta}`}
            className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center p-1.5 active:scale-95 transition z-10"
          >
            <span className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition">
              <X className="w-4 h-4" />
            </span>
          </button>

          {/* Velo blanco al 60% + anillo de progreso si está subiendo */}
          {subiendo && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-20">
              <Progress.Root
                value={progreso ?? 0}
                className="relative flex items-center justify-center"
                aria-label={`Subiendo ${etiqueta}`}
              >
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-secondary stroke-current"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary stroke-current transition-all duration-200"
                    strokeDasharray={`${progreso ?? 0}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                {typeof progreso === 'number' && (
                  <span className="absolute font-mono text-[10px] font-bold text-foreground">
                    {Math.round(progreso)}%
                  </span>
                )}
              </Progress.Root>
            </div>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={onCapturar}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onCapturar()
            }
          }}
          className="w-full aspect-square rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] transition p-2 relative"
          aria-label={`Capturar foto de ${etiqueta}`}
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-1 text-muted-foreground/80">
            <Icon className="w-5 h-5 stroke-[1.75]" />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground text-center">
            Tocar para capturar
          </span>

          {/* Velo blanco al 60% + anillo de progreso si está subiendo sin url previa */}
          {subiendo && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center z-20">
              <Progress.Root
                value={progreso ?? 0}
                className="relative flex items-center justify-center"
                aria-label={`Subiendo ${etiqueta}`}
              >
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-secondary stroke-current"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary stroke-current transition-all duration-200"
                    strokeDasharray={`${progreso ?? 0}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                {typeof progreso === 'number' && (
                  <span className="absolute font-mono text-[10px] font-bold text-foreground">
                    {Math.round(progreso)}%
                  </span>
                )}
              </Progress.Root>
            </div>
          )}
        </div>
      )}

      {/* Etiqueta debajo en text-xs font-medium, y un punto ámbar si es obligatoria y está vacía */}
      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-center px-1 max-w-full">
        {obligatoria && !url && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: 'hsl(var(--health-warn))' }}
            title="Obligatoria"
            aria-label="Foto obligatoria"
          />
        )}
        <span className="text-[11px] leading-tight font-medium text-foreground text-center">
          {etiqueta}
        </span>
      </div>
    </div>
  )
}

export default PhotoSlot
