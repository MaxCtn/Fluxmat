import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createServerSupabase() {
  const url = process.env.SUPABASE_URL as string;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !key) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('chantiers_imports_resume')
      .select('*')
      .order('libelle_entite', { ascending: true })
      .order('date_dernier_import', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ rows: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur inconnue' }, { status: 500 });
  }
}






