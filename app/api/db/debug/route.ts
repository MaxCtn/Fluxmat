import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

// API de debug pour voir les données dans Supabase
export async function GET(){
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 200 });

  // Récupérer toutes les données pour debug
  const { data, error } = await supabase
    .from('depenses_completes')
    .select('*')
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ 
    count: data?.length || 0,
    sample: data || [],
    message: "Données de debug"
  });
}
