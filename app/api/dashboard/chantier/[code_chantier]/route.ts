import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createServerSupabase() {
  const url = process.env.SUPABASE_URL as string;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !key) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ code_chantier: string }> }
) {
  try {
    const { code_chantier } = await context.params;
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('depenses_dechets')
      .select('*')
      .eq('code_chantier', code_chantier)
      .order('date_depense', { ascending: false })
      .limit(5000);
    if (error) throw error;
    return NextResponse.json({ code_chantier, rows: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur inconnue' }, { status: 500 });
  }
}


