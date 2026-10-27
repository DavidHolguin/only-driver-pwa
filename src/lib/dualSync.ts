import { supabase } from '../lib/supabase'
import { hoyBogota } from './fecha'

const GAS_URL = "https://script.google.com/macros/s/AKfycbx8pHOHRVkE7G170ZFBSkXcuv-IuQPzk8x52IVfZ1EKOhIQ8F7RXd-8ZjKg1duD8r0qYQ/exec";
const GAS_TOKEN = "OH_SECRET_AGY_2026";

export interface DualSyncResult {
  ok: boolean;
  supabase: boolean;
  googleSheets: boolean;
  error: string | null;
}

/**
 * Sincroniza el cambio de estado de un pedido en ambas fuentes:
 * 1. Supabase (tabla 'pedidos' del ecosistema)
 * 2. Google Sheets (hoja 'PEDIDOS' mediante Apps Script doPost)
 */
export async function syncOrderStatusDual(
  numeroPedido: string,
  nuevoEstado: 'EN RUTA' | 'ENTREGADO' | 'DEVUELTO' | 'NO CONFORME',
  observaciones: string,
  usuario: string = 'Conductor PWA'
): Promise<DualSyncResult> {
  const cleanNumber = String(numeroPedido || '').trim().replace(/^#/, '');
  if (!cleanNumber) {
    return { ok: false, supabase: false, googleSheets: false, error: 'Número de pedido requerido' };
  }

  const results: DualSyncResult = {
    ok: true,
    supabase: false,
    googleSheets: false,
    error: null
  };

  // 1. Espejo en Supabase (base del ecosistema)
  try {
    const estadoSupa = nuevoEstado === 'EN RUTA' 
      ? 'en_ruta' 
      : nuevoEstado === 'ENTREGADO' 
      ? 'entregado' 
      : 'devuelto';

    const updatePayload: any = {
      estado: estadoSupa,
      updated_at: new Date().toISOString()
    };

    if (nuevoEstado === 'ENTREGADO') {
      // Fecha de pared en Bogotá: con `toISOString()` una entrega hecha después de las
      // 7 p.m. quedaba con la fecha del día siguiente.
      updatePayload.fecha_entrega_real = hoyBogota();
    }

    const { error: supaErr } = await supabase
      .from('pedidos')
      .update(updatePayload)
      .eq('numero_pedido', cleanNumber);

    if (!supaErr) {
      results.supabase = true;
    }
  } catch (err) {
    console.warn('[syncOrderStatusDual] Error actualizando Supabase:', err);
  }

  // 2. Espejo en Google Sheets (Hoja de Reservas y Logística)
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: GAS_TOKEN,
        action: 'cambiarEstadoPedido',
        args: {
          numero: cleanNumber,
          nuevoEstado: nuevoEstado === 'NO CONFORME' ? 'DEVUELTO' : nuevoEstado,
          observaciones,
          usuario
        }
      })
    });
    const json = await res.json().catch(() => ({}));
    if (json?.ok) {
      results.googleSheets = true;
    } else {
      results.error = json?.error;
    }
  } catch (err: any) {
    console.warn('[syncOrderStatusDual] Error actualizando Google Sheets:', err);
    results.error = err?.message || String(err);
  }

  return results;
}
