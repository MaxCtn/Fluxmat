import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function POST(req: NextRequest){
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 200 });

  const body = await req.json().catch(()=> ({}));
  const rows = body?.rows as any[] || [];
  if (!rows.length) return NextResponse.json({ ok: true, inserted: 0 });

  console.log(`[SAVE-LEGACY] Reçu ${rows.length} lignes à sauvegarder`);
  console.log(`[SAVE-LEGACY] Première ligne exemple:`, JSON.stringify(rows[0], null, 2));

  // Map les données de l'ancien format vers la nouvelle table
  const payload = rows.map(r => {
    const cleanValue = (value: any) => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'string' && value.trim() === '') return null;
      return value;
    };

    return {
      // BU
      code_entite: null, // Pas disponible dans l'ancien format
      libelle_entite: cleanValue(r["producteur.raisonSociale"]),
      
      // Chantier
      code_project: null, // Pas disponible dans l'ancien format
      code_chantier: null, // Pas disponible dans l'ancien format
      libelle_chantier: cleanValue(r["producteur.adresse.libelle"]),
      
      // Matériaux/Déchets
      ressource: null, // Pas disponible dans l'ancien format
      libelle_ressource: cleanValue(r.denominationUsuelle),
      unite: cleanValue(r.codeUnite) || "T",
      quantite: Number(r.quantite || 0),
      code_dechet: cleanValue(r.codeDechet),
      
      // Exutoire
      code_fournisseur: null, // Pas disponible dans l'ancien format
      libelle_fournisseur: cleanValue(r["destinataire.raisonSociale"]),
      
      // Traçabilité financière
      date_expedition: cleanValue(r.dateExpedition),
      num_commande: null, // Pas disponible dans l'ancien format
      num_reception: null, // Pas disponible dans l'ancien format
      code_facture: null, // Pas disponible dans l'ancien format
      code_ecriture: null, // Pas disponible dans l'ancien format
      statut: null, // Pas disponible dans l'ancien format
      pu: 0, // Pas disponible dans l'ancien format
      montant: 0, // Pas disponible dans l'ancien format
      
      // Contexte technique
      code_ouvrage_origine: null, // Pas disponible dans l'ancien format
      libelle_ouvrage_origine: null, // Pas disponible dans l'ancien format
      code_ouvrage_actuel: null, // Pas disponible dans l'ancien format
      libelle_ouvrage_actuel: null, // Pas disponible dans l'ancien format
      
      // Comptabilité/Gestion
      code_rubrique_comptable: null, // Pas disponible dans l'ancien format
      libelle_rubrique_comptable: null, // Pas disponible dans l'ancien format
      nature_depense_comptable: null, // Pas disponible dans l'ancien format
      
      code_rubrique_gestion: null, // Pas disponible dans l'ancien format
      libelle_rubrique_gestion: null, // Pas disponible dans l'ancien format
      nature_depense_gestion: null, // Pas disponible dans l'ancien format
      
      // Audit
      origine: null, // Pas disponible dans l'ancien format
      auteur_depense: null, // Pas disponible dans l'ancien format
      modifie: null, // Pas disponible dans l'ancien format
      auteur_commentaire: null, // Pas disponible dans l'ancien format
      commentaire: null, // Pas disponible dans l'ancien format
      valide: null, // Pas disponible dans l'ancien format
      auteur_valide: null, // Pas disponible dans l'ancien format
      
      // Métadonnées
      is_materiau: Boolean(r.codeDechet) // Si il y a un code déchet, c'est un matériau
    };
  });

  console.log(`[SAVE-LEGACY] Payload préparé avec ${payload.length} éléments`);
  console.log(`[SAVE-LEGACY] Première ligne payload:`, JSON.stringify(payload[0], null, 2));

  // Vérifier les doublons dans le payload ET contre la base existante
  const uniquePayload = [];
  const seen = new Set();
  
  // D'abord, déduplication dans le payload
  for (const row of payload) {
    // Créer une clé unique basée sur les champs essentiels
    const key = `${row.libelle_ressource}|${row.quantite}|${row.unite}|${row.code_dechet}|${row.libelle_fournisseur}|${row.date_expedition}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      uniquePayload.push(row);
    } else {
      console.log(`[SAVE-LEGACY] Doublon dans le fichier ignoré:`, key);
    }
  }

  // Ensuite, vérifier contre la base de données existante
  const finalPayload = [];
  for (const row of uniquePayload) {
    const key = `${row.libelle_ressource}|${row.quantite}|${row.unite}|${row.code_dechet}|${row.libelle_fournisseur}|${row.date_expedition}`;
    
    // Vérifier si cette ligne existe déjà dans la base
    const { data: existing } = await supabase
      .from('depenses_completes')
      .select('id')
      .eq('libelle_ressource', row.libelle_ressource)
      .eq('quantite', row.quantite)
      .eq('unite', row.unite)
      .eq('code_dechet', row.code_dechet)
      .eq('libelle_fournisseur', row.libelle_fournisseur)
      .eq('date_expedition', row.date_expedition)
      .limit(1);

    if (!existing || existing.length === 0) {
      finalPayload.push(row);
    } else {
      console.log(`[SAVE-LEGACY] Doublon en base ignoré:`, key);
    }
  }

  console.log(`[SAVE-LEGACY] Après déduplication: ${finalPayload.length} lignes finales (${payload.length - finalPayload.length} doublons ignorés)`);

  if (finalPayload.length === 0) {
    console.log(`[SAVE-LEGACY] Aucune nouvelle ligne à insérer`);
    return NextResponse.json({ ok: true, inserted: 0, duplicates: payload.length });
  }

  const { error } = await supabase.from('depenses_completes').insert(finalPayload);
  
  if (error) {
    console.error(`[SAVE-LEGACY] Erreur Supabase:`, error);
    return NextResponse.json({ 
      error: error.message, 
      code: error.code,
      details: error.details 
    }, { status: 500 });
  }

  console.log(`[SAVE-LEGACY] Succès: ${finalPayload.length} lignes insérées`);
  return NextResponse.json({ 
    ok: true, 
    inserted: finalPayload.length, 
    duplicates: payload.length - finalPayload.length 
  });
}
