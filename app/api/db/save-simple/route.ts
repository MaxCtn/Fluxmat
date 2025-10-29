import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function POST(req: NextRequest){
  try {
    console.log('[SAVE-SIMPLE] Début de la requête');
    
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.error('[SAVE-SIMPLE] Supabase non configuré - variables d\'environnement manquantes');
      return NextResponse.json({ 
        error: "Supabase non configuré. Veuillez configurer NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env.local",
        type: 'missing_env_vars'
      }, { status: 500 });
    }
    
    const body = await req.json().catch((e) => {
      console.error('[SAVE-SIMPLE] Erreur parsing JSON:', e);
      return {};
    });
    const rows = body?.rows as any[] || [];
    
    if (!rows.length) {
      console.log('[SAVE-SIMPLE] Aucune ligne à traiter');
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    console.log(`[SAVE-SIMPLE] Reçu ${rows.length} lignes à sauvegarder`);
    console.log(`[SAVE-SIMPLE] Première ligne exemple:`, JSON.stringify(rows[0], null, 2));

    // Fonction helper pour nettoyer les valeurs
    const cleanValue = (value: any) => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'string' && value.trim() === '') return null;
      return value;
    };

    // Fonction pour convertir les dates Excel en format date SQL
    const convertDate = (value: any): string | null => {
      if (!value) return null;
      
      // Si c'est déjà une chaîne au format date valide
      if (typeof value === 'string') {
        // Vérifier si c'est un format de date valide (YYYY-MM-DD, DD/MM/YYYY, etc.)
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return value; // Format SQL YYYY-MM-DD
        if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          // Format DD/MM/YYYY -> YYYY-MM-DD
          const parts = value.split('/');
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        // Essayer de parser avec Date
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0]; // YYYY-MM-DD
        }
      }
      
      // Si c'est un nombre (date Excel)
      if (typeof value === 'number' || (typeof value === 'string' && /^\d+\.?\d*$/.test(value))) {
        const excelDate = Number(value);
        if (excelDate > 0 && excelDate < 100000) {
          // Date Excel : nombre de jours depuis le 1er janvier 1900
          // Excel compte le 1er janvier 1900 comme jour 1 (mais c'est en fait le 2 car il y a un bug Excel)
          const excelEpoch = new Date(1899, 11, 30); // 30 décembre 1899
          const date = new Date(excelEpoch.getTime() + (excelDate - 1) * 24 * 60 * 60 * 1000);
          
          // Vérifier que la date est valide
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

    // Mapper les données vers la structure registre_flux
    const payload = rows.map(r => {
      // Extraire les données selon le format legacy (depuis l'export)
      const exutoire = cleanValue(r["destinataire.raisonSociale"]) || cleanValue(r.libelle_fournisseur) || cleanValue(r.exutoire) || cleanValue(r["Libellé Fournisseur"]) || cleanValue(r["Libelle Fournisseur"]);
      const dateExp = convertDate(r.dateExpedition) || convertDate(r.date_expedition);
      
      // Extraire code_entite depuis diverses sources possibles
      const codeEntite = cleanValue(r.code_entite) || 
                        cleanValue(r["Code Entité"]) || 
                        cleanValue(r["Code Entite"]) || 
                        cleanValue(r["code_entite"]) || 
                        null;
      
      // Extraire libelle_entite depuis diverses sources possibles
      const libelleEntite = cleanValue(r["producteur.raisonSociale"]) || 
                           cleanValue(r.libelle_entite) ||
                           cleanValue(r["Libellé Entité"]) ||
                           cleanValue(r["Libelle Entite"]) ||
                           null;
      
      // Extraire code_chantier depuis diverses sources possibles
      const codeChantier = cleanValue(r.code_chantier) || 
                          cleanValue(r["Code Chantier"]) || 
                          cleanValue(r["Code Chantier"]) ||
                          cleanValue(r["code_chantier"]) ||
                          null;
      
      // Extraire libelle_chantier depuis diverses sources possibles
      const libelleChantier = cleanValue(r["producteur.adresse.libelle"]) || 
                             cleanValue(r.libelle_chantier) ||
                             cleanValue(r["Libellé Chantier"]) ||
                             cleanValue(r["Libelle Chantier"]) ||
                             null;
      
      // Nettoyer le code déchet (doit être exactement 6 chiffres)
      let codeDechet = cleanValue(r.codeDechet) || cleanValue(r.code_dechet);
      if (codeDechet) {
        // Extraire uniquement les chiffres et limiter à 6
        codeDechet = codeDechet.toString().replace(/\D/g, '').slice(0, 6);
        if (codeDechet.length !== 6) {
          codeDechet = null; // Invalide si pas exactement 6 chiffres
        }
      }

      return {
        source_name: cleanValue(r.source_name) || 'export-manuel',
        code_entite: codeEntite,
        libelle_entite: libelleEntite,
        code_chantier: codeChantier,
        libelle_chantier: libelleChantier,
        date_expedition: dateExp,
        quantite: Number(r.quantite || r.quantite || 0),
        unite: cleanValue(r.codeUnite) || cleanValue(r.unite) || 'T',
        libelle_ressource: cleanValue(r.denominationUsuelle) || cleanValue(r.libelle_ressource),
        exutoire: exutoire,
        code_dechet: codeDechet,
        created_by: cleanValue(r.created_by) || 'système'
      };
    });

    console.log(`[SAVE-SIMPLE] Payload préparé avec ${payload.length} éléments`);
    console.log(`[SAVE-SIMPLE] Première ligne payload:`, JSON.stringify(payload[0], null, 2));

    // Vérifier les doublons dans le payload d'abord
    const dedupedPayload = [];
    const seen = new Set<string>();
    
    for (const row of payload) {
      // Créer une clé unique basée sur les champs essentiels
      const key = `${row.libelle_ressource}|${row.quantite}|${row.unite}|${row.code_dechet}|${row.exutoire}|${row.date_expedition}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        dedupedPayload.push(row);
      } else {
        console.log(`[SAVE-SIMPLE] Doublon dans le fichier ignoré:`, key);
      }
    }

    // Vérifier les doublons contre la base de données
    const finalPayload = [];
    for (const row of dedupedPayload) {
      // Vérifier si cette ligne existe déjà dans la base
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
          const key = `${row.libelle_ressource}|${row.quantite}|${row.unite}|${row.code_dechet}|${row.exutoire}|${row.date_expedition}`;
          console.log(`[SAVE-SIMPLE] Doublon en base ignoré:`, key);
        }
      } else {
        // Si des champs essentiels manquent, on insère quand même (sera validé par la contrainte)
        finalPayload.push(row);
      }
    }

    console.log(`[SAVE-SIMPLE] Après déduplication: ${finalPayload.length} lignes finales (${payload.length - finalPayload.length} doublons ignorés)`);

    if (finalPayload.length === 0) {
      console.log(`[SAVE-SIMPLE] Aucune nouvelle ligne à insérer`);
      return NextResponse.json({ 
        ok: true, 
        inserted: 0, 
        duplicates: payload.length 
      });
    }

    console.log(`[SAVE-SIMPLE] Tentative d'insertion de ${finalPayload.length} lignes dans registre_flux...`);
    
    const { data, error } = await supabase
      .from('registre_flux')
      .insert(finalPayload)
      .select();
    
    if (error) {
      console.error(`[SAVE-SIMPLE] Erreur Supabase:`, error);
      console.error(`[SAVE-SIMPLE] Code erreur:`, error.code);
      console.error(`[SAVE-SIMPLE] Message:`, error.message);
      console.error(`[SAVE-SIMPLE] Détails:`, error.details);
      console.error(`[SAVE-SIMPLE] Hint:`, error.hint);
      
      return NextResponse.json({ 
        error: error.message, 
        code: error.code,
        details: error.details,
        hint: error.hint 
      }, { status: 500 });
    }

    const insertedCount = data?.length || finalPayload.length;
    console.log(`[SAVE-SIMPLE] Succès: ${insertedCount} lignes insérées dans registre_flux`);
    
    return NextResponse.json({ 
      ok: true, 
      inserted: insertedCount, 
      duplicates: payload.length - finalPayload.length 
    });

  } catch (error: any) {
    console.error('[SAVE-SIMPLE] Erreur générale:', error);
    return NextResponse.json({ 
      error: `Erreur: ${error.message}`,
      type: 'general_error'
    }, { status: 500 });
  }
}