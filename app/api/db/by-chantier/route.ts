import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

// API pour obtenir les données groupées par chantier
export async function GET(){
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 200 });

  const { data, error } = await supabase
    .from('depenses_completes')
    .select('code_chantier, libelle_chantier, code_entite, libelle_entite, quantite, montant, is_materiau')
    .not('code_chantier', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Grouper par chantier
  const map = new Map<string, { 
    code_chantier: string; 
    libelle_chantier: string;
    code_entite: string;
    libelle_entite: string;
    total_quantite: number; 
    total_montant: number; 
    nb_lignes: number;
    nb_materiaux: number;
  }>();

  for (const row of (data||[])) {
    const key = row.code_chantier || 'Sans code';
    const e = map.get(key) || { 
      code_chantier: row.code_chantier || '', 
      libelle_chantier: row.libelle_chantier || '',
      code_entite: row.code_entite || '',
      libelle_entite: row.libelle_entite || '',
      total_quantite: 0, 
      total_montant: 0, 
      nb_lignes: 0,
      nb_materiaux: 0
    };
    
    e.total_quantite += Number(row.quantite || 0);
    e.total_montant += Number(row.montant || 0);
    e.nb_lignes += 1;
    if (row.is_materiau) e.nb_materiaux += 1;
    
    map.set(key, e);
  }

  const items = [...map.values()].sort((a,b)=> b.total_montant - a.total_montant);
  return NextResponse.json({ items });
}
