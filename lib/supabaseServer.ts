import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - valeurs hardcodées pour éviter les problèmes d'environnement
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ionbzssgyskmmhxuvvqb.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbmJ6c3NneXNrbW1oeHV2dnFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTIxNjM1MiwiZXhwIjoyMDc2NzkyMzUyfQ.PMVS4Z4LUzPke1ymFuwmf1jWSwZ_Bmd51oPW6eO81Nc';

export function getSupabaseServer(){
  if (!url || !key) {
    console.error('[SUPABASE] Configuration manquante');
    return null;
  }
  console.log('[SUPABASE] Configuration chargée avec succès');
  return createClient(url, key, { auth: { persistSession: false } });
}
