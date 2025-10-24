import { createClient } from '@supabase/supabase-js';

export function getSupabaseServer(){
  try {
    // Utiliser les variables d'environnement Vercel
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    
    if (!url || !serviceKey) {
      console.error('[SUPABASE] Variables d\'environnement manquantes:', {
        url: !!url,
        serviceKey: !!serviceKey
      });
      return null;
    }

    console.log('[SUPABASE] Tentative de connexion...');
    console.log('[SUPABASE] URL:', url);
    console.log('[SUPABASE] Key présent:', serviceKey ? 'OUI' : 'NON');
    
    const supabase = createClient(url, serviceKey, { 
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
