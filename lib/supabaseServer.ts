// repo/lib/supabaseServer.ts
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Forcer le chargement de .env.local (pour Next.js qui ne le charge parfois pas)
// @ts-ignore - dotenv peut ne pas avoir de types pour cette syntaxe
if (typeof process !== 'undefined') {
  try {
    config({ path: resolve(process.cwd(), '.env.local') });
  } catch (e) {
    // Ignorer si le fichier n'existe pas
  }
}

// ⚠️ Variables d'env attendues (ne mets jamais la service key côté client)
// Note: En Next.js, les variables doivent être chargées au démarrage
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

let _admin: SupabaseClient | null = null;

/** Client admin (service role) – usage exclusif côté serveur (API routes / RSC). */
function getSbAdmin(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return null;
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

/** Alias pour compatibilité avec le code existant. Retourne null si les variables d'environnement sont manquantes. */
export function getSupabaseServer(): SupabaseClient | null {
  return getSbAdmin();
}

/** Sanity check optionnel pour tes routes (à supprimer si inutile). */
export async function pingSupabase() {
  const sb = getSbAdmin();
  if (!sb) return false;
  
  // petite requête inoffensive pour vérifier la connexion
  try {
    const { error } = await sb.rpc('pg_sleep', { seconds: 0 });
    return !error;
  } catch {
    return false;
  }
}
