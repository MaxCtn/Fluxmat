import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function POST(req: NextRequest){
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 200 });

  const body = await req.json().catch(()=> ({}));
  const rows = body?.rows as any[] || [];
  if (!rows.length) return NextResponse.json({ ok: true, inserted: 0 });

  console.log(`[SAVE-CORRECTED] Reçu ${rows.length} lignes à sauvegarder`);

  // Map SEULEMENT les colonnes qui existent dans Supabase
  const payload = rows.map(r => {
    const cleanValue = (value: any) => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'string' && value.trim() === '') return null;
      return value;
    };

    return {
      // BU
      code_entite: cleanValue(r.code_entite),
      libelle_entite: cleanValue(r.libelle_entite),
      
      // Chantier
      code_project: cleanValue(r.code_project),
      code_chantier: cleanValue(r.code_chantier),
      libelle_chantier: cleanValue(r.libelle_chantier),
      
      // Matériaux/Déchets
      ressource: cleanValue(r.ressource),
      libelle_ressource: cleanValue(r.libelle_ressource),
      unite: cleanValue(r.unite),
      quantite: Number(r.quantite || 0),
      code_dechet: cleanValue(r.code_dechet),
      
      // Exutoire
      code_fournisseur: cleanValue(r.code_fournisseur),
      libelle_fournisseur: cleanValue(r.libelle_fournisseur),
      
      // Traçabilité financière
      date_expedition: cleanValue(r.date_expedition),
      num_commande: cleanValue(r.num_commande),
      num_reception: cleanValue(r.num_reception),
      code_facture: cleanValue(r.code_facture),
      code_ecriture: cleanValue(r.code_ecriture),
      statut: cleanValue(r.statut),
      pu: Number(r.pu || 0),
      montant: Number(r.montant || 0),
      
      // Contexte technique
      code_ouvrage_origine: cleanValue(r.code_ouvrage_origine),
      libelle_ouvrage_origine: cleanValue(r.libelle_ouvrage_origine),
      code_ouvrage_actuel: cleanValue(r.code_ouvrage_actuel),
      libelle_ouvrage_actuel: cleanValue(r.libelle_ouvrage_actuel),
      
      // Comptabilité/Gestion (seulement les colonnes qui existent)
      code_rubrique_comptable: cleanValue(r.code_rubrique_comptable),
      libelle_rubrique_comptable: cleanValue(r.libelle_rubrique_comptable),
      nature_depense_comptable: cleanValue(r.nature_depense_comptable),
      
      code_rubrique_gestion: cleanValue(r.code_rubrique_gestion),
      libelle_rubrique_gestion: cleanValue(r.libelle_rubrique_gestion),
      nature_depense_gestion: cleanValue(r.nature_depense_gestion),
      
      // Audit (seulement les colonnes qui existent)
      origine: cleanValue(r.origine),
      auteur_depense: cleanValue(r.auteur_depense),
      modifie: cleanValue(r.modifie),
      auteur_commentaire: cleanValue(r.auteur_commentaire),
      commentaire: cleanValue(r.commentaire),
      valide: cleanValue(r.valide),
      auteur_valide: cleanValue(r.auteur_valide),
      
      // Métadonnées
      is_materiau: Boolean(r.is_materiau)
    };
  });

  console.log(`[SAVE-CORRECTED] Payload préparé avec ${payload.length} éléments`);
  console.log(`[SAVE-CORRECTED] Colonnes utilisées:`, Object.keys(payload[0]));

  const { error } = await supabase.from('depenses_completes').insert(payload);
  
  if (error) {
    console.error(`[SAVE-CORRECTED] Erreur Supabase:`, error);
    return NextResponse.json({ 
      error: error.message, 
      code: error.code,
      details: error.details 
    }, { status: 500 });
  }

  console.log(`[SAVE-CORRECTED] Succès: ${payload.length} lignes insérées`);
  return NextResponse.json({ ok: true, inserted: payload.length });
}
