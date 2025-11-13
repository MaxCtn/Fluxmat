import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function POST(req: NextRequest){
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ 
        error: "Supabase non configuré. Veuillez configurer NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env.local",
        type: 'missing_env_vars'
      }, { status: 500 });
    }

    const body = await req.json().catch(()=> ({}));
    const rows = body?.rows as any[] || [];
    if (!rows.length) return NextResponse.json({ ok: true, inserted: 0 });

    console.log(`[SAVE] Reçu ${rows.length} lignes à sauvegarder`);
    console.log(`[SAVE] Première ligne exemple:`, JSON.stringify(rows[0], null, 2));

    // Map TOUTES les données, même les colonnes vides
    const payload = rows.map(r => {
    // Fonction helper pour nettoyer les valeurs
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
      
      // Compléments
      code_complement_origine: cleanValue(r.code_complement_origine),
      libelle_complement_origine: cleanValue(r.libelle_complement_origine),
      code_complement_actuel: cleanValue(r.code_complement_actuel),
      libelle_complement_actuel: cleanValue(r.libelle_complement_actuel),
      auteur_ouvrage_modifie: cleanValue(r.auteur_ouvrage_modifie),
      
      // Comptabilité/Gestion
      code_rubrique_comptable: cleanValue(r.code_rubrique_comptable),
      libelle_rubrique_comptable: cleanValue(r.libelle_rubrique_comptable),
      code_chapitre_comptable: cleanValue(r.code_chapitre_comptable),
      libelle_chapitre_comptable: cleanValue(r.libelle_chapitre_comptable),
      code_sous_chapitre_comptable: cleanValue(r.code_sous_chapitre_comptable),
      libelle_sous_chapitre_comptable: cleanValue(r.libelle_sous_chapitre_comptable),
      nature_depense_comptable: cleanValue(r.nature_depense_comptable),
      libelle_nature_comptable: cleanValue(r.libelle_nature_comptable),
      
      code_rubrique_gestion: cleanValue(r.code_rubrique_gestion),
      libelle_rubrique_gestion: cleanValue(r.libelle_rubrique_gestion),
      code_chapitre_gestion: cleanValue(r.code_chapitre_gestion),
      libelle_chapitre_gestion: cleanValue(r.libelle_chapitre_gestion),
      code_sous_chapitre_gestion: cleanValue(r.code_sous_chapitre_gestion),
      libelle_sous_chapitre_gestion: cleanValue(r.libelle_sous_chapitre_gestion),
      nature_depense_gestion: cleanValue(r.nature_depense_gestion),
      libelle_nature_gestion: cleanValue(r.libelle_nature_gestion),
      
      // Audit
      origine: cleanValue(r.origine),
      auteur_depense: cleanValue(r.auteur_depense),
      modifie: cleanValue(r.modifie),
      auteur_commentaire: cleanValue(r.auteur_commentaire),
      commentaire: cleanValue(r.commentaire),
      valide: cleanValue(r.valide),
      auteur_valide: cleanValue(r.auteur_valide),
      code_utilisateur_recalage: cleanValue(r.code_utilisateur_recalage),
      date_traitement_recalage: cleanValue(r.date_traitement_recalage),
      statut_rapprochement_facture: cleanValue(r.statut_rapprochement_facture),
      date_chargement: cleanValue(r.date_chargement),
      
      // Métadonnées
      is_materiau: Boolean(r.is_materiau),
      is_exutoire_valide: Boolean(r.is_exutoire_valide)
    };
  });

    console.log(`[SAVE] Payload préparé avec ${payload.length} éléments`);
    console.log(`[SAVE] Première ligne payload:`, JSON.stringify(payload[0], null, 2));
    console.log(`[SAVE] Colonnes dans le payload:`, Object.keys(payload[0]));

    // Mapper vers registre_flux (table principale)
    const registrePayload = payload.map(r => ({
      code_entite: r.code_entite,
      libelle_entite: r.libelle_entite,
      code_chantier: r.code_chantier,
      libelle_chantier: r.libelle_chantier,
      date_expedition: r.date_expedition,
      quantite: r.quantite || 0,
      unite: r.unite || 'T',
      libelle_ressource: r.libelle_ressource,
      code_dechet: r.code_dechet,
      exutoire: r.libelle_fournisseur || null,
      code_fournisseur: r.code_fournisseur,
      libelle_fournisseur: r.libelle_fournisseur,
      origine: r.origine,
      code_chapitre_comptable: r.code_chapitre_comptable,
      libelle_chapitre_comptable: r.libelle_chapitre_comptable,
      code_rubrique_comptable: r.code_rubrique_comptable,
      libelle_rubrique_comptable: r.libelle_rubrique_comptable,
      num_commande: r.num_commande,
      num_reception: r.num_reception,
      code_facture: r.code_facture,
      pu: r.pu || 0,
      montant: r.montant || 0,
      source_name: 'export-save',
      created_by: 'système'
    }));

    const { data, error } = await supabase
      .from('registre_flux')
      .insert(registrePayload)
      .select();
  
    if (error) {
      console.error(`[SAVE] Erreur Supabase:`, error);
      console.error(`[SAVE] Code erreur:`, error.code);
      console.error(`[SAVE] Message:`, error.message);
      console.error(`[SAVE] Détails:`, error.details);
      console.error(`[SAVE] Hint:`, error.hint);
      return NextResponse.json({ 
        error: error.message, 
        code: error.code,
        details: error.details,
        hint: error.hint 
      }, { status: 500 });
    }

    console.log(`[SAVE] Succès: ${data?.length || registrePayload.length} lignes insérées`);
    return NextResponse.json({ 
      ok: true, 
      inserted: data?.length || registrePayload.length 
    });
  } catch (error: any) {
    console.error('[SAVE] Erreur générale:', error);
    return NextResponse.json({ 
      error: error.message || 'Erreur serveur',
      type: 'general_error'
    }, { status: 500 });
  }
}
