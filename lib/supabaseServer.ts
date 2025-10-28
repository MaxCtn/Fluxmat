// repo/lib/supabaseServer.ts
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ⚠️ Variables d'env attendues (ne mets jamais la service key côté client)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let _admin: SupabaseClient | null = null;

/** Client admin (service role) – usage exclusif côté serveur (API routes / RSC). */
function getSbAdmin(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL manquante. Configure .env.local');
  }
  if (!SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante. Configure .env.local');
  }

  if (_admin) return _admin;

  _admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-application-name': 'fluxmat-server' } },
  });

  return _admin;
}

/** Export de getSbAdmin pour usage direct. */
export { getSbAdmin };

/** Alias pour compatibilité avec le code existant. */
export function getSupabaseServer(): SupabaseClient {
  return getSbAdmin();
}

/** Sanity check optionnel pour tes routes (à supprimer si inutile). */
export async function pingSupabase() {
  const sb = getSbAdmin();
  // petite requête inoffensive pour vérifier la connexion
  try {
    const { error } = await sb.rpc('pg_sleep', { seconds: 0 });
    return !error;
  } catch {
    return false;
  }
}
