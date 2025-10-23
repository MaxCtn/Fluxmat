import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function POST(req: NextRequest){
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 200 });

  const body = await req.json().catch(()=> ({}));
  const rows = body?.rows as any[] || [];
  if (!rows.length) return NextResponse.json({ ok: true, inserted: 0 });

  console.log(`[SAVE-MINIMAL] Reçu ${rows.length} lignes à sauvegarder`);

  // Version minimale avec seulement les colonnes essentielles
  const payload = rows.map(r => {
    const cleanValue = (value: any) => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'string' && value.trim() === '') return null;
      return value;
    };

    return {
      // Colonnes essentielles seulement
      code_entite: cleanValue(r.code_entite),
      libelle_entite: cleanValue(r.libelle_entite),
      code_chantier: cleanValue(r.code_chantier),
      libelle_chantier: cleanValue(r.libelle_chantier),
      libelle_ressource: cleanValue(r.libelle_ressource),
      unite: cleanValue(r.unite),
      quantite: Number(r.quantite || 0),
      code_dechet: cleanValue(r.code_dechet),
      libelle_fournisseur: cleanValue(r.libelle_fournisseur),
      date_expedition: cleanValue(r.date_expedition),
      montant: Number(r.montant || 0),
      is_materiau: Boolean(r.is_materiau),
      is_exutoire_valide: Boolean(r.is_exutoire_valide)
    };
  });

  console.log(`[SAVE-MINIMAL] Payload minimal préparé`);
  console.log(`[SAVE-MINIMAL] Colonnes:`, Object.keys(payload[0]));

  const { error } = await supabase.from('depenses_completes').insert(payload);
  
  if (error) {
    console.error(`[SAVE-MINIMAL] Erreur:`, error);
    return NextResponse.json({ 
      error: error.message, 
      code: error.code,
      details: error.details 
    }, { status: 500 });
  }

  console.log(`[SAVE-MINIMAL] Succès: ${payload.length} lignes insérées`);
  return NextResponse.json({ ok: true, inserted: payload.length });
}
