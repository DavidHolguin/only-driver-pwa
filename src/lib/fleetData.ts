import { DriverProfile } from '../types/delivery'

export interface DriverFleetMember {
  id: string
  placa: string
  nombre: string
  telefono: string
  whatsapp: string
  foto_url: string
  vehiculo_modelo: string
  capacidad: number
  rutas_permitidas: string
  estado: string
  pin: string
}

export const OFFICIAL_FLEET: DriverFleetMember[] = [
  { id: "drv-1", placa: "ESU013", nombre: "Carlos Mendoza", telefono: "3124567890", whatsapp: "573124567890", foto_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200", vehiculo_modelo: "Chevrolet N300 Panel", capacidad: 20, rutas_permitidas: "BOGOTA,IBAGUE", estado: "ACTIVO", pin: "1234" },
  { id: "drv-2", placa: "ESV081", nombre: "Javier Silva", telefono: "3109876543", whatsapp: "573109876543", foto_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", vehiculo_modelo: "Renault Kangoo Maxi", capacidad: 20, rutas_permitidas: "BOGOTA,IBAGUE", estado: "ACTIVO", pin: "1234" },
  { id: "drv-3", placa: "SQF 187", nombre: "Mauricio Valencia", telefono: "3201122334", whatsapp: "573201122334", foto_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", vehiculo_modelo: "Camión Isuzu Blanco Only", capacidad: 13, rutas_permitidas: "TODAS", estado: "ACTIVO", pin: "1234" },
  { id: "drv-4", placa: "SQF 177", nombre: "Andrés Castro", telefono: "3157788990", whatsapp: "573157788990", foto_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200", vehiculo_modelo: "Furgón Logístico Only", capacidad: 13, rutas_permitidas: "TODAS", estado: "ACTIVO", pin: "1234" },
  { id: "drv-5", placa: "TJB 434", nombre: "Fabián Rincón", telefono: "3182233445", whatsapp: "573182233445", foto_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200", vehiculo_modelo: "Furgón Logístico Only", capacidad: 13, rutas_permitidas: "TODAS", estado: "ACTIVO", pin: "1234" },
  { id: "drv-6", placa: "SQE 647", nombre: "Héctor Ramírez", telefono: "3113344556", whatsapp: "573113344556", foto_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", vehiculo_modelo: "Furgón Logístico Only", capacidad: 13, rutas_permitidas: "TODAS", estado: "ACTIVO", pin: "1234" },
  { id: "drv-7", placa: "SQE 646", nombre: "Jorge Pineda", telefono: "3145566778", whatsapp: "573145566778", foto_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200", vehiculo_modelo: "Furgón Logístico Only", capacidad: 13, rutas_permitidas: "TODAS", estado: "ACTIVO", pin: "1234" },
  { id: "drv-8", placa: "ESV079", nombre: "Diego Morales", telefono: "3166677889", whatsapp: "573166677889", foto_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200", vehiculo_modelo: "Furgón Logístico Only", capacidad: 13, rutas_permitidas: "TODAS", estado: "ACTIVO", pin: "1234" },
  { id: "drv-9", placa: "TRI 148", nombre: "Luis Arango", telefono: "3178899001", whatsapp: "573178899001", foto_url: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200", vehiculo_modelo: "Furgón Logístico Only", capacidad: 13, rutas_permitidas: "TODAS", estado: "ACTIVO", pin: "1234" },
  { id: "drv-10", placa: "ESV 288", nombre: "Gustavo Cárdenas", telefono: "3190011223", whatsapp: "573190011223", foto_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200", vehiculo_modelo: "Furgón Logístico Only", capacidad: 13, rutas_permitidas: "TODAS", estado: "ACTIVO", pin: "1234" },
  { id: "drv-11", placa: "WNE098", nombre: "Felipe Orozco", telefono: "3131122334", whatsapp: "573131122334", foto_url: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=200", vehiculo_modelo: "DFSK C35 Cargo", capacidad: 13, rutas_permitidas: "ARMENIA", estado: "ACTIVO", pin: "1234" },
  { id: "drv-12", placa: "TSI 608", nombre: "Mario Botero", telefono: "3104455667", whatsapp: "573104455667", foto_url: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=200", vehiculo_modelo: "Furgón Logístico Only", capacidad: 13, rutas_permitidas: "VALLE DEL CAUCA,PUEBLOS VALLE,ARMENIA,PEREIRA", estado: "ACTIVO", pin: "1234" },
  { id: "drv-13", placa: "CLO 504", nombre: "Hernán Cortés", telefono: "3127788991", whatsapp: "573127788991", foto_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200", vehiculo_modelo: "Camión Turbo 4.5T", capacidad: 20, rutas_permitidas: "VALLE DEL CAUCA,PUEBLOS VALLE", estado: "ACTIVO", pin: "1234" },
  { id: "drv-14", placa: "USD 576", nombre: "Wilson Cañas", telefono: "3158899002", whatsapp: "573158899002", foto_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", vehiculo_modelo: "Camión Turbo 4.5T", capacidad: 20, rutas_permitidas: "VALLE DEL CAUCA,PUEBLOS VALLE", estado: "ACTIVO", pin: "1234" },
  { id: "drv-15", placa: "PEE 369", nombre: "Camilo Torres", telefono: "3179900113", whatsapp: "573179900113", foto_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", vehiculo_modelo: "Camión Turbo 5T", capacidad: 20, rutas_permitidas: "BUENAVENTURA", estado: "ACTIVO", pin: "1234" },
  { id: "drv-16", placa: "JRG 511", nombre: "Víctor Hurtado", telefono: "3200011224", whatsapp: "573200011224", foto_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", vehiculo_modelo: "Camión Turbo 5T", capacidad: 20, rutas_permitidas: "BUENAVENTURA", estado: "ACTIVO", pin: "1234" },
]

export function normalizePlate(p?: string | null): string {
  if (!p) return ''
  return p.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function findFleetMemberByPlate(plate: string): DriverFleetMember | undefined {
  const norm = normalizePlate(plate)
  return OFFICIAL_FLEET.find(f => normalizePlate(f.placa) === norm)
}

export function buildDriverProfileFromFleet(member: DriverFleetMember): DriverProfile {
  return {
    id: member.id,
    name: member.nombre,
    phone: member.telefono,
    vehicle_type: member.capacidad > 15 ? 'camion' : 'furgon',
    vehicle_plate: member.placa,
    active_route_name: member.rutas_permitidas.includes('TODAS') ? 'Rutas Nacionales Only' : `Ruta ${member.rutas_permitidas.split(',')[0]}`,
    city: 'Colombia',
    is_tracking_active: true,
    photo_url: member.foto_url,
    pin: member.pin,
    rutas_permitidas: member.rutas_permitidas
  }
}
