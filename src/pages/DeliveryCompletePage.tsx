import React, { useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useDelivery } from '../context/DeliveryContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { PodEvidence } from '../types/delivery'
import confetti from 'canvas-confetti'
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  UserCheck, 
  FileText, 
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

export const DeliveryCompletePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'novedad' ? 'novedad' : 'entrega'
  
  const navigate = useNavigate()
  const { getOrderById, completeDelivery, reportNovelty, driver } = useDelivery()
  const { coords } = useGeolocation(driver.is_tracking_active)

  const order = getOrderById(id || '')

  const [mode, setMode] = useState<'entrega' | 'novedad'>(initialMode)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [receivedBy, setReceivedBy] = useState<string>(order?.customer_name || '')
  const [comments, setComments] = useState<string>('')
  const [noveltyReason, setNoveltyReason] = useState<string>('Cliente no se encuentra / No responde')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-6">
        <h2 className="text-lg font-bold text-slate-900">Pedido no encontrado</h2>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-[#001F36] text-white rounded-xl text-sm font-bold">
          Volver a la Ruta
        </button>
      </div>
    )
  }

  // Comprimir foto en el navegador vía Canvas para optimizar subida móvil
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setPhotoBlob(blob)
              const previewUrl = URL.createObjectURL(blob)
              setPhotoPreview(previewUrl)
            }
          },
          'image/jpeg',
          0.8
        )
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleClearPhoto = () => {
    setPhotoPreview(null)
    setPhotoBlob(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleConfirmDelivery = () => {
    if (!photoPreview) {
      toast.error('Por favor toma una foto de la factura firmada o entrega como soporte')
      return
    }

    setIsSubmitting(true)

    const pod: PodEvidence = {
      photo_url: photoPreview,
      photo_blob: photoBlob || undefined,
      received_by: receivedBy || order.customer_name,
      delivered_at: new Date().toISOString(),
      comments: comments.trim() || undefined,
      driver_coords: {
        latitude: coords.latitude,
        longitude: coords.longitude
      }
    }

    completeDelivery(order.id, pod)

    // Explosión de confeti celebratoria
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    })

    toast.success(`¡Pedido #${order.order_number} entregado con éxito!`)

    setTimeout(() => {
      navigate('/')
    }, 1200)
  }

  const handleConfirmNovelty = () => {
    setIsSubmitting(true)
    reportNovelty(order.id, noveltyReason, comments.trim() || undefined)
    toast.warning(`Novedad registrada para el pedido #${order.order_number}`)
    setTimeout(() => {
      navigate('/')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#001F36] text-white px-4 py-3 shadow-md pt-safe flex items-center justify-between">
        <button
          onClick={() => navigate(`/pedido/${order.id}`)}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase tracking-wider text-sky-300 font-semibold block">
            Cierre de Parada #{order.sequence_order}
          </span>
          <h1 className="font-mono text-sm font-bold text-white">{order.order_number}</h1>
        </div>

        <div className="w-12"></div>
      </header>

      {/* Mode Switcher (Entrega Exitosa vs Reportar Novedad) */}
      <div className="p-4">
        <div className="grid grid-cols-2 bg-slate-200 p-1 rounded-2xl">
          <button
            onClick={() => setMode('entrega')}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              mode === 'entrega'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Entrega Exitosa</span>
          </button>

          <button
            onClick={() => setMode('novedad')}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              mode === 'novedad'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Reportar Novedad</span>
          </button>
        </div>
      </div>

      {/* Content Form based on Mode */}
      <div className="px-4 space-y-4">
        {mode === 'entrega' ? (
          <>
            {/* Camera / Photo Capture Section */}
            <div className="bg-white rounded-2xl p-4 shadow-subtle border border-border">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-sky-600" />
                Foto de Factura Firmada o Paquete *
              </span>
              <p className="text-xs text-slate-500 mb-3">
                Captura la factura firmada por el cliente como constancia de entrega.
              </p>

              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                  <img
                    src={photoPreview}
                    alt="Soporte de Entrega"
                    className="w-full h-56 object-cover"
                  />
                  <button
                    onClick={handleClearPhoto}
                    className="absolute top-3 right-3 p-2 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-700 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2.5 py-1 rounded-full text-[11px] text-white font-mono">
                    ✓ Imagen optimizada
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.99] p-4 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 mb-2">
                    <Camera className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-bold text-sky-900">Tocar para Tomar Foto</span>
                  <span className="text-xs text-slate-500 mt-0.5">Usa la cámara del teléfono</span>
                </div>
              )}

              {/* Hidden file input for native camera */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </div>

            {/* Recipient Details & Notes */}
            <div className="bg-white rounded-2xl p-4 shadow-subtle border border-border space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  Nombre de Quien Recibe
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Ej: Camila Restrepo o Vigilante Carlos"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B66]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Comentarios u Observaciones (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Ej: Entregado en portería con firma de sello"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B66]"
                />
              </div>
            </div>
          </>
        ) : (
          /* Novelty Mode */
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-rose-200 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-2">
                Motivo de la Novedad *
              </label>
              <select
                value={noveltyReason}
                onChange={(e) => setNoveltyReason(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Cliente no se encuentra / No responde">Cliente no se encuentra / No responde</option>
                <option value="Dirección errónea o incompleta">Dirección errónea o incompleta</option>
                <option value="Cliente rechazó recibir el producto">Cliente rechazó recibir el producto</option>
                <option value="Zona de difícil acceso / Sin paso">Zona de difícil acceso / Sin paso</option>
                <option value="Reprogramado a solicitud del cliente">Reprogramado a solicitud del cliente</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Detalles Adicionales de la Novedad
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Describe qué ocurrió al intentar la entrega..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Submit */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-border shadow-floating pb-safe z-30">
        {mode === 'entrega' ? (
          <button
            onClick={handleConfirmDelivery}
            disabled={isSubmitting}
            className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>Confirmar y Finalizar Entrega</span>
          </button>
        ) : (
          <button
            onClick={handleConfirmNovelty}
            disabled={isSubmitting}
            className="w-full py-4 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-base shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
          >
            <AlertTriangle className="w-5 h-5 text-white" />
            <span>Registrar Novedad</span>
          </button>
        )}
      </div>
    </div>
  )
}
