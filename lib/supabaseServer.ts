import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const url = "https://ionbzssgyskmmhxuvvqb.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbmJ6c3NneXNrbW1oeHV2dnFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTIxNjM1MiwiZXhwIjoyMDc2NzkyMzUyfQ.PMVS4Z4LUzPke1ymFuwmf1jWSwZ_Bmd51oPW6eO81Nc";

export function getSupabaseServer(){
  return createClient(url, key, { auth: { persistSession: false } });
}
