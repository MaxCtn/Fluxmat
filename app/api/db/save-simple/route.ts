import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function POST(req: NextRequest){
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 200 });

  const body = await req.json().catch(()=> ({}));
  const rows = body?.rows as any[] || [];
  if (!rows.length) return NextResponse.json({ ok: true, inserted: 0 });

  // Map seulement les colonnes essentielles d'abord
  const payload = rows.map(r => ({
    // BU
    code_entite: r.code_entite || null,
    libelle_entite: r.libelle_entite || null,
    
    // Chantier
    code_project: r.code_project || null,
    code_chantier: r.code_chantier || null,
    libelle_chantier: r.libelle_chantier || null,
    
    // Matériaux/Déchets
    ressource: r.ressource || null,
    libelle_ressource: r.libelle_ressource || null,
    unite: r.unite || null,
    quantite: Number(r.quantite || 0),
    code_dechet: r.code_dechet || null,
    
    // Exutoire
    code_fournisseur: r.code_fournisseur || null,
    libelle_fournisseur: r.libelle_fournisseur || null,
    
    // Traçabilité financière
    date_expedition: r.date_expedition || null,
    num_commande: r.num_commande || null,
    num_reception: r.num_reception || null,
    code_facture: r.code_facture || null,
    code_ecriture: r.code_ecriture || null,
    statut: r.statut || null,
    pu: Number(r.pu || 0),
    montant: Number(r.montant || 0),
    
    // Contexte technique
    code_ouvrage_origine: r.code_ouvrage_origine || null,
    libelle_ouvrage_origine: r.libelle_ouvrage_origine || null,
    code_ouvrage_actuel: r.code_ouvrage_actuel || null,
    libelle_ouvrage_actuel: r.libelle_ouvrage_actuel || null,
    
    // Audit
    origine: r.origine || null,
    auteur_depense: r.auteur_depense || null,
    modifie: r.modifie || null,
    commentaire: r.commentaire || null,
    valide: r.valide || null,
    
    // Métadonnées
    is_materiau: r.is_materiau || false,
    is_exutoire_valide: r.is_exutoire_valide || false
  }));

  const { error } = await supabase.from('depenses_completes').insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, inserted: payload.length });
}
