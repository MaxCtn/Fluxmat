import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - valeurs hardcodées pour éviter les problèmes d'environnement
const SUPABASE_URL = 'https://ionbzssgyskmmhxuvvqb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbmJ6c3NneXNrbW1oeHV2dnFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTIxNjM1MiwiZXhwIjoyMDc2NzkyMzUyfQ.PMVS4Z4LUzPke1ymFuwmf1jWSwZ_Bmd51oPW6eO81Nc';

export function getSupabaseServer(){
  try {
    console.log('[SUPABASE] Tentative de connexion...');
    console.log('[SUPABASE] URL:', SUPABASE_URL);
    console.log('[SUPABASE] Key présent:', SUPABASE_SERVICE_KEY ? 'OUI' : 'NON');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { 
      auth: { persistSession: false },
      db: { schema: 'public' },
      global: { headers: { 'x-my-custom-header': 'my-app-name' } }
    });
    
    console.log('[SUPABASE] Client Supabase créé avec succès');
    return supabase;
  } catch (error) {
    console.error('[SUPABASE] Erreur lors de la création du client:', error);
    return null;
  }
}
