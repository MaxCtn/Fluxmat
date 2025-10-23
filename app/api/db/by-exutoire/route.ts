import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET(req: NextRequest){
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ rows: [] });

  const name = new URL(req.url).searchParams.get('name') || '';
  const { data, error } = await supabase
    .from('depenses_completes')
    .select('*')
    .eq('libelle_fournisseur', name)
    .eq('is_materiau', true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rows: data || [] });
}
