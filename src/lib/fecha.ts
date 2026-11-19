import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Fechas de pared de la operación: America/Bogota (UTC-5, sin horario de verano).
 *
 * `toISOString()` devuelve el día en UTC: entre las 19:00 y las 23:59 de Bogotá ya es el
 * día siguiente. La fecha de entrega que se escribe en la hoja y en el espejo no puede
 * salir de ahí — un conductor que entrega de noche marcaba la entrega con fecha de mañana.
 */
export function hoyBogota(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Fecha `YYYY-MM-DD` en Bogotá para un instante dado. */
export function fechaBogota(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : hoyBogota(d);
}

/** Formato CRM con date-fns locale es ('5 nov 2026'), nunca ISO. */
export function formatoFechaCRM(value: string | Date = new Date()): string {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : format(d, "d MMM yyyy", { locale: es });
}

