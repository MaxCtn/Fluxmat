// src/lib/supabase.server.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

declare global {
  // eslint-disable-next-line no-var
  var __fluxmat_sb_admin__: SupabaseClient | undefined
}

/** Client Supabase (service role) — serveur uniquement */
export function getSupabaseAdmin(): SupabaseClient {
  if (!global.__fluxmat_sb_admin__) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE
    if (!url || !serviceKey) throw new Error('SUPABASE URL/ROLE manquants')
    global.__fluxmat_sb_admin__ = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return global.__fluxmat_sb_admin__!
}

// alias backward-compat
export const supaAdmin = getSupabaseAdmin
