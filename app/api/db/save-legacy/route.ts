import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function POST(req: NextRequest){
  console.log('[SAVE-LEGACY] Début de la requête');
  
  const supabase = getSupabaseServer();
  if (!supabase) {
    console.error('[SAVE-LEGACY] Supabase non configuré');
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  console.log('[SAVE-LEGACY] Supabase configuré, traitement du body...');

  const body = await req.json().catch((e) => {
    console.error('[SAVE-LEGACY] Erreur parsing JSON:', e);
    return {};
  });
  const rows = body?.rows as any[] || [];
  if (!rows.length) {
    console.log('[SAVE-LEGACY] Aucune ligne à traiter');
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  console.log(`[SAVE-LEGACY] Reçu ${rows.length} lignes à sauvegarder`);
  console.log(`[SAVE-LEGACY] Première ligne exemple:`, JSON.stringify(rows[0], null, 2));

  // Fonction pour convertir les dates Excel en format date SQL
  const convertDate = (value: any): string | null => {
    if (!value) return null;
    
    // Si c'est déjà une chaîne au format date valide
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return value; // Format SQL YYYY-MM-DD
      if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const parts = value.split('/');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }
    
    // Si c'est un nombre (date Excel)
    if (typeof value === 'number' || (typeof value === 'string' && /^\d+\.?\d*$/.test(value))) {
      const excelDate = Number(value);
      if (excelDate > 0 && excelDate < 100000) {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + (excelDate - 1) * 24 * 60 * 60 * 1000);
        
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    return null;
  };

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
      date_expedition: convertDate(r.dateExpedition),
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

  // Mapper vers registre_flux au lieu de depenses_completes
  const registrePayload = payload.map(row => {
    // Nettoyer le code déchet (doit être exactement 6 chiffres)
    let codeDechet = row.code_dechet;
    if (codeDechet) {
      codeDechet = codeDechet.toString().replace(/\D/g, '').slice(0, 6);
      if (codeDechet.length !== 6) {
        codeDechet = null; // Invalide si pas exactement 6 chiffres
      }
    }

    return {
      source_name: 'import-legacy',
      code_entite: row.code_entite || null,
      libelle_entite: row.libelle_entite,
      code_chantier: row.code_chantier || null,
      libelle_chantier: row.libelle_chantier,
      date_expedition: row.date_expedition,
      quantite: row.quantite,
      unite: row.unite || 'T',
      libelle_ressource: row.libelle_ressource,
      exutoire: row.libelle_fournisseur, // Exutoire = libelle_fournisseur dans ce format
      code_dechet: codeDechet,
      created_by: 'système'
    };
  }).filter(row => row.libelle_ressource && row.quantite > 0); // Filtrer les lignes valides

  console.log(`[SAVE-LEGACY] ${registrePayload.length} lignes après mapping vers registre_flux`);

  // Vérifier les doublons dans le payload ET contre la base existante
  const uniquePayload: any[] = [];
  const seen = new Set<string>();
  
  // D'abord, déduplication dans le payload
  for (const row of registrePayload) {
    // Créer une clé unique basée sur les champs essentiels
    const key = `${row.libelle_ressource}|${row.quantite}|${row.unite}|${row.code_dechet}|${row.exutoire}|${row.date_expedition}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      uniquePayload.push(row);
    } else {
      console.log(`[SAVE-LEGACY] Doublon dans le fichier ignoré:`, key);
    }
  }

  // Ensuite, vérifier contre la base de données existante
  const finalPayload: any[] = [];
  for (const row of uniquePayload) {
    const key = `${row.libelle_ressource}|${row.quantite}|${row.unite}|${row.code_dechet}|${row.exutoire}|${row.date_expedition}`;
    
    // Vérifier si cette ligne existe déjà dans registre_flux
    if (row.code_dechet && row.exutoire && row.date_expedition) {
      const { data: existing } = await supabase
        .from('registre_flux')
        .select('id')
        .eq('libelle_ressource', row.libelle_ressource)
        .eq('quantite', row.quantite)
        .eq('unite', row.unite)
        .eq('code_dechet', row.code_dechet)
        .eq('exutoire', row.exutoire)
        .eq('date_expedition', row.date_expedition)
        .limit(1);

      if (!existing || existing.length === 0) {
        finalPayload.push(row);
      } else {
        console.log(`[SAVE-LEGACY] Doublon en base ignoré:`, key);
      }
    } else {
      // Si des champs essentiels manquent, on insère quand même (sera validé par la contrainte)
      finalPayload.push(row);
    }
  }

  console.log(`[SAVE-LEGACY] Après déduplication: ${finalPayload.length} lignes finales (${payload.length - finalPayload.length} doublons ignorés)`);

  if (finalPayload.length === 0) {
    console.log(`[SAVE-LEGACY] Aucune nouvelle ligne à insérer`);
    return NextResponse.json({ ok: true, inserted: 0, duplicates: payload.length });
  }

  console.log(`[SAVE-LEGACY] Tentative d'insertion de ${finalPayload.length} lignes dans registre_flux...`);
  
  try {
    const { data, error } = await supabase
      .from('registre_flux')
      .insert(finalPayload)
      .select();
    
    if (error) {
      console.error(`[SAVE-LEGACY] Erreur Supabase:`, error);
      console.error(`[SAVE-LEGACY] Code erreur:`, error.code);
      console.error(`[SAVE-LEGACY] Message:`, error.message);
      console.error(`[SAVE-LEGACY] Détails:`, error.details);
      return NextResponse.json({ 
        error: error.message, 
        code: error.code,
        details: error.details 
      }, { status: 500 });
    }

    const insertedCount = data?.length || finalPayload.length;
    console.log(`[SAVE-LEGACY] Succès: ${insertedCount} lignes insérées dans registre_flux`);
    return NextResponse.json({ 
      ok: true, 
      inserted: insertedCount, 
      duplicates: payload.length - finalPayload.length 
    });
  } catch (insertError) {
    console.error(`[SAVE-LEGACY] Erreur lors de l'insertion:`, insertError);
    return NextResponse.json({ 
      error: `Erreur d'insertion: ${insertError}`,
      type: 'insertion_error'
    }, { status: 500 });
  }
}
