import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

// API pour obtenir les données groupées par exutoire (Libellé Fournisseur)
export async function GET(){
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 200 });

  const { data, error } = await supabase
    .from('depenses_completes')
    .select('libelle_fournisseur, code_fournisseur, quantite, unite, is_materiau')
    .not('libelle_fournisseur', 'is', null)
    .eq('is_materiau', true); // Seulement les matériaux

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Grouper par exutoire
  const map = new Map<string, { 
    exutoire: string; 
    code_fournisseur: string;
    quantite: number; 
    unite: string;
    nombre_lignes: number;
  }>();

  for (const row of (data||[])) {
    const exutoire = row.libelle_fournisseur || '—';
    const e = map.get(exutoire) || { 
      exutoire, 
      code_fournisseur: row.code_fournisseur || '',
      quantite: 0, 
      unite: row.unite || 'T',
      nombre_lignes: 0
    };
    
    e.quantite += Number(row.quantite || 0);
    e.nombre_lignes += 1;
    
    map.set(exutoire, e);
  }

  const items = [...map.values()].sort((a,b)=> b.quantite - a.quantite);
  return NextResponse.json({ items });
}
