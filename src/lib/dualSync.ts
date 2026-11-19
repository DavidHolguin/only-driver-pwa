import { supabase } from '../lib/supabase'
import { hoyBogota } from './fecha'

export interface DualSyncResult {
  ok: boolean;
  supabase: boolean;
  googleSheets: boolean;
  error: string | null;
}

/**
 * Sincroniza el cambio de estado de un pedido en la base de datos Supabase.
 */
export async function syncOrderStatusDual(
  numeroPedido: string,
  nuevoEstado: 'EN RUTA' | 'ENTREGADO' | 'DEVUELTO' | 'NO CONFORME',
  _observaciones: string,
  _usuario: string = 'Conductor PWA'
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

  // Espejo en Supabase (base del ecosistema)
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
    } else {
      results.error = supaErr.message;
    }
  } catch (err: any) {
    console.warn('[syncOrderStatusDual] Error actualizando Supabase:', err);
    results.error = err?.message || String(err);
  }

  return results;
}
