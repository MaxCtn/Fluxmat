// repo/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Ces 2 var sont publiques (OK côté client)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !ANON_KEY) {
  // Log non bloquant (évite de throw côté client)
  // eslint-disable-next-line no-console
  console.warn('Supabase client: variables publiques manquantes.');
}

export const sbClient = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
  global: { headers: { 'x-application-name': 'fluxmat-client' } },
});
