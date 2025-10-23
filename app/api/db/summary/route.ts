import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET(){
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 200 });

  // Aggregate by exutoire (libelle_fournisseur) with totals
  const { data, error } = await supabase
    .from('depenses_completes')
    .select('libelle_fournisseur, quantite, unite')
    .eq('is_materiau', true)
    .not('libelle_fournisseur', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map = new Map<string, { exutoire: string; quantite: number; nombreLignes: number; unite: string }>();
  for (const row of (data||[])) {
    const exo = row.libelle_fournisseur || '—';
    const e = map.get(exo) || { exutoire: exo, quantite: 0, nombreLignes: 0, unite: row.unite || 'T' };
    e.quantite += Number(row.quantite || 0);
    e.nombreLignes += 1;
    map.set(exo, e);
  }
  const items = [...map.values()].sort((a,b)=> b.quantite - a.quantite);
  return NextResponse.json({ items });
}
