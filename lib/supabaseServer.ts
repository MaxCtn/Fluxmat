import { createClient } from '@supabase/supabase-js';

// Configuration Supabase via variables d'environnement
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

export function getSupabaseServer(){
  if (!url || !key) {
    console.error('[SUPABASE] Variables d\'environnement manquantes');
    console.error('[SUPABASE] URL:', url ? 'PRESENT' : 'MISSING');
    console.error('[SUPABASE] KEY:', key ? 'PRESENT' : 'MISSING');
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
