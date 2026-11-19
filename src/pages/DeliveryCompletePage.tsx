import React, { useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useDelivery } from '../context/DeliveryContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { PodEvidence, NoveltyEvidence, DeliveryOrder } from '../types/delivery'
import { PhotoSlot } from '../components/PhotoSlot'
import confetti from 'canvas-confetti'
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  PackageCheck,
  Building2,
  AlertOctagon,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

type OrderWithOcr = DeliveryOrder & {
  ocr?: {
    numero?: string
    total?: string
  }
}

export const DeliveryCompletePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'novedad' ? 'novedad' : 'entrega'

  const navigate = useNavigate()
  const { getOrderById, completeDelivery, reportNovelty, driver } = useDelivery()
  const { coords } = useGeolocation(driver.is_tracking_active)

  const order = getOrderById(id || '')

  const [mode, setMode] = useState<'entrega' | 'novedad'>(initialMode)

  // 3 Fotos de Entrega Exitosa
  const [invoicePhoto, setInvoicePhoto] = useState<string | null>(null)
  const [invoiceBlob, setInvoiceBlob] = useState<Blob | null>(null)

  const [productsPhoto, setProductsPhoto] = useState<string | null>(null)
  const [productsBlob, setProductsBlob] = useState<Blob | null>(null)

  const [proofPhoto, setProofPhoto] = useState<string | null>(null)
  const [proofBlob, setProofBlob] = useState<Blob | null>(null)

  // 3 Fotos de No Conforme
  const [fullProductsPhoto, setFullProductsPhoto] = useState<string | null>(null)
  const [fullProductsBlob, setFullProductsBlob] = useState<Blob | null>(null)

  const [defectPhoto, setDefectPhoto] = useState<string | null>(null)
  const [defectBlob, setDefectBlob] = useState<Blob | null>(null)

  const [additionalPhoto, setAdditionalPhoto] = useState<string | null>(null)
  const [additionalBlob, setAdditionalBlob] = useState<Blob | null>(null)

  const [receivedBy, setReceivedBy] = useState<string>(order?.customer_name || '')
  const [comments, setComments] = useState<string>('')

  // No Conforme campos
  const [noveltyReason, setNoveltyReason] = useState<string>('Producto averiado o con golpe')
  const [noveltyDescription, setNoveltyDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Input refs para fotos de entrega
  const invoiceInputRef = useRef<HTMLInputElement>(null)
  const productsInputRef = useRef<HTMLInputElement>(null)
  const proofInputRef = useRef<HTMLInputElement>(null)

  // Input refs para fotos de no conforme
  const fullProductsInputRef = useRef<HTMLInputElement>(null)
  const defectInputRef = useRef<HTMLInputElement>(null)
  const additionalInputRef = useRef<HTMLInputElement>(null)

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-base font-semibold text-foreground">Pedido no encontrado</h2>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 h-11 px-6 bg-primary text-primary-foreground rounded-xl text-sm font-semibold active:scale-95 transition"
        >
          Volver a la ruta
        </button>
      </div>
    )
  }

  // Comprimir foto en el navegador vía Canvas a 1280/0.82
  const processCapturedPhoto = (
    file: File,
    onSuccess: (previewUrl: string, blob: Blob) => void
  ) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1280
        const MAX_HEIGHT = 1280
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
              const previewUrl = URL.createObjectURL(blob)
              onSuccess(previewUrl, blob)
            }
          },
          'image/jpeg',
          0.82
        )
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleConfirmDelivery = () => {
    if (!invoicePhoto) {
      toast.error('Foto 1 requerida: Captura la factura firmada')
      return
    }
    if (!productsPhoto) {
      toast.error('Foto 2 requerida: Captura los productos entregados')
      return
    }
    if (!proofPhoto) {
      toast.error('Foto 3 requerida: Captura la fachada o constancia de entrega')
      return
    }
    if (!receivedBy.trim()) {
      toast.error('Por favor escribe el nombre de quien recibe el pedido')
      return
    }

    setIsSubmitting(true)

    const pod: PodEvidence = {
      invoice_photo_url: invoicePhoto,
      products_photo_url: productsPhoto,
      proof_photo_url: proofPhoto,
      invoice_blob: invoiceBlob || undefined,
      products_blob: productsBlob || undefined,
      proof_blob: proofBlob || undefined,
      received_by: receivedBy.trim(),
      delivered_at: new Date().toISOString(),
      comments: comments.trim() || undefined,
      driver_coords: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    }

    const prevOrdersJson = localStorage.getItem('only_driver_orders_v3')

    completeDelivery(order.id, pod)

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    })

    const timer = setTimeout(() => {
      navigate('/')
    }, 2500)

    toast.success('Entrega confirmada con éxito', {
      duration: 5000,
      action: {
        label: 'Deshacer',
        onClick: () => {
          clearTimeout(timer)
          setIsSubmitting(false)
          if (prevOrdersJson) {
            localStorage.setItem('only_driver_orders_v3', prevOrdersJson)
          }
          toast.info('Entrega deshecha')
          window.location.href = `/pedido/${order.id}`
        },
      },
    })
  }

  const handleConfirmNovelty = () => {
    if (!fullProductsPhoto) {
      toast.error('Foto 1 requerida: Foto de los productos completos')
      return
    }
    if (!defectPhoto) {
      toast.error('Foto 2 requerida: Foto del detalle de la novedad / no conforme')
      return
    }
    if (!additionalPhoto) {
      toast.error('Foto 3 requerida: Foto adicional de respaldo')
      return
    }
    if (!noveltyDescription.trim() || noveltyDescription.trim().length < 8) {
      toast.error('Ingresa una descripción de lo sucedido (mínimo 8 caracteres)')
      return
    }

    setIsSubmitting(true)

    const noveltyData: NoveltyEvidence = {
      reason: noveltyReason,
      description: noveltyDescription.trim(),
      full_products_photo_url: fullProductsPhoto,
      defect_photo_url: defectPhoto,
      additional_photo_url: additionalPhoto,
      full_products_blob: fullProductsBlob || undefined,
      defect_blob: defectBlob || undefined,
      additional_blob: additionalBlob || undefined,
      reported_at: new Date().toISOString(),
      driver_coords: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    }

    const prevOrdersJson = localStorage.getItem('only_driver_orders_v3')

    reportNovelty(order.id, noveltyData)

    const timer = setTimeout(() => {
      navigate('/')
    }, 2500)

    toast.warning('No conforme registrado', {
      duration: 5000,
      action: {
        label: 'Deshacer',
        onClick: () => {
          clearTimeout(timer)
          setIsSubmitting(false)
          if (prevOrdersJson) {
            localStorage.setItem('only_driver_orders_v3', prevOrdersJson)
          }
          toast.info('Registro de no conforme deshecho')
          window.location.href = `/pedido/${order.id}`
        },
      },
    })
  }

  const deliveryPhotosCount = [invoicePhoto, productsPhoto, proofPhoto].filter(Boolean).length
  const noveltyPhotosCount = [fullProductsPhoto, defectPhoto, additionalPhoto].filter(Boolean).length

  const ocr = (order as OrderWithOcr).ocr

  return (
    <div className="min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] bg-background flex flex-col justify-between font-sans">
      {/* Sub-header de navegación con área táctil >= 44px */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(`/pedido/${order.id}`)}
          className="h-11 px-3 -ml-2 rounded-xl text-foreground hover:bg-secondary flex items-center gap-1.5 text-sm font-semibold active:scale-95 transition"
          aria-label="Volver al detalle del pedido"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <div className="text-center min-w-0 px-2">
          <span className="text-xs text-muted-foreground block truncate">
            Parada #{order.sequence_order}
          </span>
          <h1 className="font-mono text-sm font-semibold text-foreground truncate">
            {order.order_number}
          </h1>
        </div>

        <span className="font-mono text-xs text-muted-foreground font-medium text-right min-w-[56px]">
          {mode === 'entrega' ? `${deliveryPhotosCount}/3 fotos` : `${noveltyPhotosCount}/3 fotos`}
        </span>
      </div>

      {/* Contenido principal */}
      <div className="px-4 py-4 pb-28 space-y-4 flex-1">
        {/* Switch Entrega / No conforme */}
        <div className="h-11 p-1 rounded-xl bg-secondary grid grid-cols-2 gap-1 select-none">
          <button
            type="button"
            onClick={() => setMode('entrega')}
            className={cn(
              'h-full rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.98]',
              mode === 'entrega'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Entrega exitosa</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('novedad')}
            className={cn(
              'h-full rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.98]',
              mode === 'novedad'
                ? 'bg-card text-destructive shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>No conforme</span>
          </button>
        </div>

        {/* Bloque informativo de lectura de factura: oculto si no hay OCR */}
        {ocr && ocr.numero && (
          <div className="bg-secondary rounded-xl px-3 py-2 text-xs text-muted-foreground">
            Factura #{ocr.numero} {ocr.total ? `· ${ocr.total}` : ''}
          </div>
        )}

        {mode === 'entrega' ? (
          <>
            {/* Tres slots de fotos con PhotoSlot */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground block">
                Fotos de evidencia (3 requeridas)
              </span>
              <div className="grid grid-cols-3 gap-3">
                <PhotoSlot
                  etiqueta="Factura firmada"
                  icono={FileCheck2}
                  url={invoicePhoto}
                  obligatoria
                  onCapturar={() => invoiceInputRef.current?.click()}
                  onQuitar={() => {
                    setInvoicePhoto(null)
                    setInvoiceBlob(null)
                    if (invoiceInputRef.current) invoiceInputRef.current.value = ''
                  }}
                />
                <PhotoSlot
                  etiqueta="Productos"
                  icono={PackageCheck}
                  url={productsPhoto}
                  obligatoria
                  onCapturar={() => productsInputRef.current?.click()}
                  onQuitar={() => {
                    setProductsPhoto(null)
                    setProductsBlob(null)
                    if (productsInputRef.current) productsInputRef.current.value = ''
                  }}
                />
                <PhotoSlot
                  etiqueta="Fachada"
                  icono={Building2}
                  url={proofPhoto}
                  obligatoria
                  onCapturar={() => proofInputRef.current?.click()}
                  onQuitar={() => {
                    setProofPhoto(null)
                    setProofBlob(null)
                    if (proofInputRef.current) proofInputRef.current.value = ''
                  }}
                />
              </div>
            </div>

            {/* Inputs de soporte */}
            <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="received-by" className="text-xs font-semibold text-foreground block">
                  Recibe *
                </label>
                <input
                  id="received-by"
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Nombre de quien recibe"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="delivery-comments" className="text-xs font-semibold text-foreground block">
                  Observaciones (opcional)
                </label>
                <textarea
                  id="delivery-comments"
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Notas adicionales sobre la entrega..."
                  className="w-full p-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition resize-none"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Selector de Motivo */}
            <div className="space-y-1.5">
              <label htmlFor="novelty-reason" className="text-xs font-semibold text-foreground block">
                Motivo del no conforme *
              </label>
              <select
                id="novelty-reason"
                value={noveltyReason}
                onChange={(e) => setNoveltyReason(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:border-primary transition"
              >
                <option value="Producto averiado o con golpe">Producto averiado o con golpe</option>
                <option value="Inconformidad del cliente con color / tela / medidas">Inconformidad del cliente con color / tela / medidas</option>
                <option value="Producto incompleto / faltan piezas">Producto incompleto / faltan piezas</option>
                <option value="Cliente rechazó recibir el pedido">Cliente rechazó recibir el pedido</option>
                <option value="Dirección errónea o no se encuentra cliente">Dirección errónea o no se encuentra cliente</option>
                <option value="No cabe por accesos (escaleras / puerta / ascensor)">No cabe por accesos (escaleras / puerta / ascensor)</option>
              </select>
            </div>

            {/* Tres slots de fotos para No Conforme */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground block">
                Fotos de respaldo (3 requeridas)
              </span>
              <div className="grid grid-cols-3 gap-3">
                <PhotoSlot
                  etiqueta="Productos"
                  icono={PackageCheck}
                  url={fullProductsPhoto}
                  obligatoria
                  onCapturar={() => fullProductsInputRef.current?.click()}
                  onQuitar={() => {
                    setFullProductsPhoto(null)
                    setFullProductsBlob(null)
                    if (fullProductsInputRef.current) fullProductsInputRef.current.value = ''
                  }}
                />
                <PhotoSlot
                  etiqueta="Detalle novedad"
                  icono={AlertOctagon}
                  url={defectPhoto}
                  obligatoria
                  onCapturar={() => defectInputRef.current?.click()}
                  onQuitar={() => {
                    setDefectPhoto(null)
                    setDefectBlob(null)
                    if (defectInputRef.current) defectInputRef.current.value = ''
                  }}
                />
                <PhotoSlot
                  etiqueta="Foto adicional"
                  icono={ImageIcon}
                  url={additionalPhoto}
                  obligatoria
                  onCapturar={() => additionalInputRef.current?.click()}
                  onQuitar={() => {
                    setAdditionalPhoto(null)
                    setAdditionalBlob(null)
                    if (additionalInputRef.current) additionalInputRef.current.value = ''
                  }}
                />
              </div>
            </div>

            {/* Descripción Obligatoria */}
            <div className="space-y-1.5">
              <label htmlFor="novelty-description" className="text-xs font-semibold text-foreground block">
                Descripción de lo sucedido *
              </label>
              <textarea
                id="novelty-description"
                rows={3}
                value={noveltyDescription}
                onChange={(e) => setNoveltyDescription(e.target.value)}
                placeholder="Detalla el problema presentado (mínimo 8 caracteres)..."
                className="w-full p-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition resize-none"
              />
            </div>
          </>
        )}
      </div>

      {/* Hidden file inputs para captura nativa */}
      <input
        ref={invoiceInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processCapturedPhoto(file, (url, b) => { setInvoicePhoto(url); setInvoiceBlob(b); })
        }}
        className="hidden"
      />
      <input
        ref={productsInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processCapturedPhoto(file, (url, b) => { setProductsPhoto(url); setProductsBlob(b); })
        }}
        className="hidden"
      />
      <input
        ref={proofInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processCapturedPhoto(file, (url, b) => { setProofPhoto(url); setProofBlob(b); })
        }}
        className="hidden"
      />

      <input
        ref={fullProductsInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processCapturedPhoto(file, (url, b) => { setFullProductsPhoto(url); setFullProductsBlob(b); })
        }}
        className="hidden"
      />
      <input
        ref={defectInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processCapturedPhoto(file, (url, b) => { setDefectPhoto(url); setDefectBlob(b); })
        }}
        className="hidden"
      />
      <input
        ref={additionalInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processCapturedPhoto(file, (url, b) => { setAdditionalPhoto(url); setAdditionalBlob(b); })
        }}
        className="hidden"
      />

      {/* CTA fija al fondo */}
      <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md bg-card/95 backdrop-blur border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        {mode === 'entrega' ? (
          <button
            type="button"
            onClick={handleConfirmDelivery}
            disabled={isSubmitting || deliveryPhotosCount < 3 || !receivedBy.trim()}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar entrega</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirmNovelty}
            disabled={isSubmitting || noveltyPhotosCount < 3 || !noveltyDescription.trim()}
            className="w-full h-12 bg-destructive hover:bg-destructive/90 text-white rounded-xl font-semibold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Registrar no conforme</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default DeliveryCompletePage
