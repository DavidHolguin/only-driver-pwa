import React, { useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useDelivery } from '../context/DeliveryContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { PodEvidence, NoveltyEvidence } from '../types/delivery'
import confetti from 'canvas-confetti'
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  UserCheck, 
  FileText, 
  Check,
  FileCheck2,
  PackageCheck,
  Building2,
  AlertOctagon,
  Image as ImageIcon
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
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-6">
        <h2 className="text-lg font-bold text-slate-900">Pedido no encontrado</h2>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-[#001F36] text-white rounded-xl text-sm font-bold">
          Volver a la Ruta
        </button>
      </div>
    )
  }

  // Comprimir foto en el navegador vía Canvas para optimizar subida móvil
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
        longitude: coords.longitude
      }
    }

    completeDelivery(order.id, pod)

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 }
    })

    toast.success(`¡Entrega exitosa completada con las 3 fotos de soporte!`)

    setTimeout(() => {
      navigate('/')
    }, 1200)
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
      toast.error('Ingresa una descripción o nota detallada de lo sucedido (mínimo 8 caracteres)')
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
        longitude: coords.longitude
      }
    }

    reportNovelty(order.id, noveltyData)
    toast.warning(`No conforme registrado con las 3 fotografías de respaldo`)
    setTimeout(() => {
      navigate('/')
    }, 1000)
  }

  // Componente de ranura de foto individual
  const PhotoSlotCard = ({
    title,
    subtitle,
    badgeText,
    icon: Icon,
    previewUrl,
    inputRef,
    onCapture,
    onClear
  }: {
    title: string
    subtitle: string
    badgeText: string
    icon: React.ElementType
    previewUrl: string | null
    inputRef: React.RefObject<HTMLInputElement | null>
    onCapture: (e: React.ChangeEvent<HTMLInputElement>) => void
    onClear: () => void
  }) => (
    <div className="bg-white rounded-2xl p-4 shadow-subtle border border-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
          <Icon className="w-4 h-4 text-sky-600" />
          {title}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
          previewUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
        }`}>
          {previewUrl ? '✓ Capturada' : badgeText}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-3">{subtitle}</p>

      {previewUrl ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50">
          <img src={previewUrl} alt={title} className="w-full h-44 object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2.5 right-2.5 p-2 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-700 active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-emerald-950/80 backdrop-blur px-2.5 py-0.5 rounded-full text-[10px] text-white font-mono flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" /> Foto procesada
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="w-full h-36 border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/40 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.99] p-3 text-center"
        >
          <div className="w-11 h-11 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 mb-1.5">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-[#001F36]">Tocar para Tomar Foto</span>
          <span className="text-[11px] text-slate-500 mt-0.5">Cámara de conductor</span>
        </div>
      )}

      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onCapture}
        className="hidden"
      />
    </div>
  )

  const deliveryPhotosCount = [invoicePhoto, productsPhoto, proofPhoto].filter(Boolean).length
  const noveltyPhotosCount = [fullProductsPhoto, defectPhoto, additionalPhoto].filter(Boolean).length

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col pb-36 font-sans">
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
            Cierre de Entrega #{order.sequence_order}
          </span>
          <h1 className="font-mono text-sm font-bold text-white">{order.order_number}</h1>
        </div>

        <div className="w-16 text-right text-[11px] font-mono text-sky-300 font-semibold">
          {mode === 'entrega' ? `${deliveryPhotosCount}/3 fotos` : `${noveltyPhotosCount}/3 fotos`}
        </div>
      </header>

      {/* Mode Switcher */}
      <div className="p-4">
        <div className="grid grid-cols-2 bg-slate-200 p-1 rounded-2xl">
          <button
            onClick={() => setMode('entrega')}
            className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              mode === 'entrega'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Entrega Exitosa (3 Fotos)</span>
          </button>

          <button
            onClick={() => setMode('novedad')}
            className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              mode === 'novedad'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>No Conforme (3 Fotos)</span>
          </button>
        </div>
      </div>

      {/* Content based on Mode */}
      <div className="px-4 space-y-4">
        {mode === 'entrega' ? (
          <>
            {/* Aviso 3 Fotos */}
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 flex items-center gap-3">
              <FileCheck2 className="w-5 h-5 text-sky-700 shrink-0" />
              <p className="text-xs text-sky-900 leading-snug">
                Para finalizar la entrega debes registrar obligatoriamente las <strong>3 fotografías de respaldo</strong>.
              </p>
            </div>

            {/* FOTO 1: Factura Firmada */}
            <PhotoSlotCard
              title="Foto 1: Factura Firmada"
              subtitle="Captura la factura en físico firmada y con sello/cédula por quien recibe."
              badgeText="Requerida *"
              icon={FileCheck2}
              previewUrl={invoicePhoto}
              inputRef={invoiceInputRef}
              onCapture={(e) => {
                const file = e.target.files?.[0]
                if (file) processCapturedPhoto(file, (url, b) => { setInvoicePhoto(url); setInvoiceBlob(b); })
              }}
              onClear={() => { setInvoicePhoto(null); setInvoiceBlob(null); if (invoiceInputRef.current) invoiceInputRef.current.value = '' }}
            />

            {/* FOTO 2: Productos Entregados */}
            <PhotoSlotCard
              title="Foto 2: Productos Entregados"
              subtitle="Captura los productos completos organizados en el lugar del cliente."
              badgeText="Requerida *"
              icon={PackageCheck}
              previewUrl={productsPhoto}
              inputRef={productsInputRef}
              onCapture={(e) => {
                const file = e.target.files?.[0]
                if (file) processCapturedPhoto(file, (url, b) => { setProductsPhoto(url); setProductsBlob(b); })
              }}
              onClear={() => { setProductsPhoto(null); setProductsBlob(null); if (productsInputRef.current) productsInputRef.current.value = '' }}
            />

            {/* FOTO 3: Fachada / Soporte */}
            <PhotoSlotCard
              title="Foto 3: Fachada o Soporte de Entrega"
              subtitle="Captura la fachada del predio, portería o entorno de la dirección."
              badgeText="Requerida *"
              icon={Building2}
              previewUrl={proofPhoto}
              inputRef={proofInputRef}
              onCapture={(e) => {
                const file = e.target.files?.[0]
                if (file) processCapturedPhoto(file, (url, b) => { setProofPhoto(url); setProofBlob(b); })
              }}
              onClear={() => { setProofPhoto(null); setProofBlob(null); if (proofInputRef.current) proofInputRef.current.value = '' }}
            />

            {/* Datos del Receptor */}
            <div className="bg-white rounded-2xl p-4 shadow-subtle border border-border space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  Nombre Completo de Quien Recibe *
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Ej: Camila Restrepo (Cliente) o Carlos (Portero)"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B66]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Observaciones de Entrega (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Ej: Entrega realizada en piso 4 sin ascensor, cliente satisfecho."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B66]"
                />
              </div>
            </div>
          </>
        ) : (
          /* MODO NO CONFORME CON FOTOS EXPLICITAS */
          <>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-700 shrink-0" />
              <p className="text-xs text-rose-900 leading-snug">
                El reporte de <strong>No Conforme</strong> requiere 3 fotografías explícitas y una descripción detallada del conductor.
              </p>
            </div>

            {/* Selector de Motivo */}
            <div className="bg-white rounded-2xl p-4 shadow-subtle border border-rose-200 space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                Motivo del No Conforme *
              </label>
              <select
                value={noveltyReason}
                onChange={(e) => setNoveltyReason(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Producto averiado o con golpe">Producto averiado o con golpe</option>
                <option value="Inconformidad del cliente con color / tela / medidas">Inconformidad del cliente con color / tela / medidas</option>
                <option value="Producto incompleto / faltan piezas">Producto incompleto / faltan piezas</option>
                <option value="Cliente rechazó recibir el pedido">Cliente rechazó recibir el pedido</option>
                <option value="Dirección errónea o no se encuentra cliente">Dirección errónea o no se encuentra cliente</option>
                <option value="No cabe por accesos (escaleras / puerta / ascensor)">No cabe por accesos (escaleras / puerta / ascensor)</option>
              </select>
            </div>

            {/* FOTO 1 NO CONFORME: Productos Completos */}
            <PhotoSlotCard
              title="Foto 1: Productos Completos"
              subtitle="Captura panorámica de todos los productos del pedido tal como se presentaron."
              badgeText="Obligatoria *"
              icon={PackageCheck}
              previewUrl={fullProductsPhoto}
              inputRef={fullProductsInputRef}
              onCapture={(e) => {
                const file = e.target.files?.[0]
                if (file) processCapturedPhoto(file, (url, b) => { setFullProductsPhoto(url); setFullProductsBlob(b); })
              }}
              onClear={() => { setFullProductsPhoto(null); setFullProductsBlob(null); if (fullProductsInputRef.current) fullProductsInputRef.current.value = '' }}
            />

            {/* FOTO 2 NO CONFORME: Detalle de la Novedad */}
            <PhotoSlotCard
              title="Foto 2: Detalle de la Novedad / Daño"
              subtitle="Primer plano cercano donde se aprecie claramente el motivo o problema reportado."
              badgeText="Obligatoria *"
              icon={AlertOctagon}
              previewUrl={defectPhoto}
              inputRef={defectInputRef}
              onCapture={(e) => {
                const file = e.target.files?.[0]
                if (file) processCapturedPhoto(file, (url, b) => { setDefectPhoto(url); setDefectBlob(b); })
              }}
              onClear={() => { setDefectPhoto(null); setDefectBlob(null); if (defectInputRef.current) defectInputRef.current.value = '' }}
            />

            {/* FOTO 3 NO CONFORME: Adicional */}
            <PhotoSlotCard
              title="Foto 3: Foto Adicional que Considere"
              subtitle="Ángulo complementario, fachada del predio, o soporte adicional relevante."
              badgeText="Obligatoria *"
              icon={ImageIcon}
              previewUrl={additionalPhoto}
              inputRef={additionalInputRef}
              onCapture={(e) => {
                const file = e.target.files?.[0]
                if (file) processCapturedPhoto(file, (url, b) => { setAdditionalPhoto(url); setAdditionalBlob(b); })
              }}
              onClear={() => { setAdditionalPhoto(null); setAdditionalBlob(null); if (additionalInputRef.current) additionalInputRef.current.value = '' }}
            />

            {/* Descripción Obligatoria */}
            <div className="bg-white rounded-2xl p-4 shadow-subtle border border-rose-200">
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Descripción o Detalles del No Conforme *
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Explica con claridad lo ocurrido para que el área de operaciones y servicio al cliente proceda.
              </p>
              <textarea
                rows={3}
                value={noveltyDescription}
                onChange={(e) => setNoveltyDescription(e.target.value)}
                placeholder="Describe los detalles del no conforme..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </>
        )}
      </div>

      {/* Fixed Bottom Submit Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-border shadow-floating pb-safe z-30 max-w-md mx-auto">
        {mode === 'entrega' ? (
          <button
            onClick={handleConfirmDelivery}
            disabled={isSubmitting || deliveryPhotosCount < 3}
            className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>Finalizar Entrega ({deliveryPhotosCount}/3 fotos)</span>
          </button>
        ) : (
          <button
            onClick={handleConfirmNovelty}
            disabled={isSubmitting || noveltyPhotosCount < 3}
            className="w-full py-4 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AlertTriangle className="w-5 h-5 text-white" />
            <span>Registrar No Conforme ({noveltyPhotosCount}/3 fotos)</span>
          </button>
        )}
      </div>
    </div>
  )
}
