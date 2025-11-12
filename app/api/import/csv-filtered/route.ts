import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { parseCsv, getValue, normalizeKey } from '@/lib/csvParser';
import { passesFilter } from '@/lib/filters';
import { isWaste, extractCedCode, suggestCodeDechet } from '@/lib/wasteUtils';

export const runtime = 'nodejs';

/**
 * Convertit une date au format DD/MM/YYYY ou autre vers YYYY-MM-DD
 */
function convertDate(dateValue: any): string | null {
  if (!dateValue) return null;
  
  const dateStr = String(dateValue).trim();
  if (!dateStr) return null;
  
  // Si c'est déjà au format YYYY-MM-DD
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Si c'est au format DD/MM/YYYY
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const parts = dateStr.split('/');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  // Essayer de parser avec Date
  const parsed = new Date(dateValue);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  
  return null;
}

/**
 * Nettoie une valeur (trim, convertit les valeurs vides en null)
 */
function cleanValue(value: any): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const v = value.trim();
    return v === '' ? null : v;
  }
  return String(value).trim() || null;
}

/**
 * Extrait l'exutoire depuis libelle_fournisseur ou libelle_chantier
 */
function extractExutoire(fournisseur: string | null, chantier: string | null): string | null {
  if (fournisseur) return cleanValue(fournisseur);
  if (chantier) return cleanValue(chantier);
  return null;
}

/**
 * Route d'import CSV avec filtres automatiques
 */
export async function POST(req: NextRequest) {
  try {
    // Mode LOCAL : fonctionner sans Supabase pour le moment
    const MODE_LOCAL = true; // TODO: passer à false quand Supabase sera configuré
    
    const form = await req.formData();
    const file = form.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Fichier manquant' },
        { status: 400 }
      );
    }

    console.log(`[IMPORT/CSV-FILTERED] Début import fichier: ${file.name}`);
    console.log(`[IMPORT/CSV-FILTERED] Mode: ${MODE_LOCAL ? 'LOCAL (sans Supabase)' : 'PRODUCTION (avec Supabase)'}`);

    // Lire le contenu du fichier
    const buf = Buffer.from(await file.arrayBuffer());
    const text = new TextDecoder('utf-8').decode(buf);
    
    // Parser le CSV/TSV
    const parseResult = parseCsv(text);
    console.log(`[IMPORT/CSV-FILTERED] Fichier parsé: ${parseResult.rows.length} lignes, ${parseResult.headers.length} colonnes, délimiteur: ${parseResult.delimiter === '\t' ? 'TAB' : parseResult.delimiter}`);
    console.log(`[IMPORT/CSV-FILTERED] En-têtes détectés: ${parseResult.hasHeaders ? 'OUI' : 'NON'}`);
    console.log(`[IMPORT/CSV-FILTERED] Premiers headers:`, parseResult.headers.slice(0, 20).join(', '));

    if (parseResult.rows.length === 0) {
      return NextResponse.json({
        ok: true,
        inserted: 0,
        filtered: 0,
        message: 'Aucune ligne à traiter'
      });
    }

    // Générer un ID de lot d'import
    const importBatchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Appliquer les filtres et préparer les données
    const rawInserts: any[] = [];
    const registreInserts: any[] = [];
    const debugInfo: any[] = []; // Pour debug
    
    let totalRows = parseResult.rows.length;
    let filteredCount = 0;
    let withCodeDechetCount = 0;
    let withoutCodeDechetCount = 0;
    let debugSampleCount = 0;

    for (let i = 0; i < parseResult.rows.length; i++) {
      const row = parseResult.rows[i];
      
      // Debug: analyser les premières lignes pour voir ce qui est détecté
      if (debugSampleCount < 5) {
        const debugRow: any = {
          rowIndex: i,
          origine: row['Origine'] || row['col_6'] || 'NON TROUVÉ',
          chapitre: row['Libellé Chapitre Comptable'] || row['col_13'] || row['col_15'] || 'NON TROUVÉ',
          sousChapitre: row['Libellé Sous-chapitre Comptable'] || row['col_14'] || row['col_16'] || 'NON TROUVÉ',
          rubrique: row['Libellé Rubrique Comptable'] || row['col_11'] || row['col_14'] || 'NON TROUVÉ',
          sampleData: {}
        };
        // Prendre quelques colonnes pour debug
        for (let j = 0; j < Math.min(20, parseResult.headers.length); j++) {
          const colName = parseResult.headers[j] || `col_${j}`;
          debugRow.sampleData[colName] = row[colName] || row[`col_${j}`] || null;
        }
        debugInfo.push(debugRow);
        debugSampleCount++;
      }
      
      // Extraire le libellé ressource d'abord
      const libelleRessource = getValue(row, [
        'Libellé Ressource',
        'Libelle Ressource',
        'libellé ressource',
        'libelle ressource',
        'Libellé Article',
        'Libelle Article',
        'libellé article',
        'libelle article',
        'Ressource',
        'ressource'
      ]);
      
      // 1. FILTRE PRINCIPAL : Est-ce que le libellé décrit un déchet physique ?
      if (!isWaste(libelleRessource)) {
        continue; // Ce n'est pas un déchet, on ignore
      }
      
      // 2. FILTRE SECONDAIRE : Est-ce qu'on garde ce déchet dans notre périmètre comptable ?
      // On applique passesFilter() APRÈS isWaste() pour ne pas perdre des déchets valides
      // juste parce que la rubrique comptable n'est pas dans la whitelist
      const passes = passesFilter(row);
      if (!passes) {
        continue;
      }
      
      // Extraire les autres valeurs principales
      const codeEntite = getValue(row, ['Code Entité', 'Code Entite', 'code_entite', 'code entité', 'col_0']);
      const libelleEntite = getValue(row, ['Libellé Entité', 'Libelle Entite', 'libellé entité', 'libelle entite', 'col_1']);
      const codeChantier = getValue(row, ['Code Chantier', 'Code Chantier', 'code_chantier', 'code chantier', 'col_2', 'col_3']);
      const libelleChantier = getValue(row, ['Libellé Chantier', 'Libelle Chantier', 'libellé chantier', 'libelle chantier', 'col_4']);
      const dateValue = getValue(row, ['Date', 'date', 'date expédition', 'date_expedition', 'col_5']);
      const origine = getValue(row, ['Origine', 'origine', 'col_6']);
      const libelleFournisseur = getValue(row, [
        'Libellé Fournisseur',
        'Libelle Fournisseur',
        'libellé fournisseur',
        'libelle fournisseur',
        'Fournisseur',
        'fournisseur'
      ]);
      const codeFournisseur = getValue(row, [
        'Code Fournisseur',
        'Code Fournisseur',
        'code_fournisseur',
        'code fournisseur'
      ]);
      const quantite = getValue(row, [
        'Quantité',
        'Quantite',
        'quantité',
        'quantite',
        'Quantité T',
        'Quantite T'
      ]);
      const unite = getValue(row, ['Unité', 'Unite', 'unité', 'unite']);
      const pu = getValue(row, ['PU', 'pu', 'prix unitaire', 'Prix unitaire']);
      const montant = getValue(row, ['Montant', 'montant']);
      
      // Données comptables pour filtrage
      const chapitre = getValue(row, [
        'Libellé Chapitre Comptable',
        'Libelle Chapitre Comptable',
        'libellé chapitre comptable',
        'libelle chapitre comptable',
        'chapitre comptable',
        'col_11',
        'col_15'
      ]);
      const sousChapitre = getValue(row, [
        'Libellé Sous-chapitre Comptable',
        'Libelle Sous-chapitre Comptable',
        'libellé sous-chapitre comptable',
        'libelle sous-chapitre comptable',
        'sous-chapitre comptable',
        'col_12',
        'col_16'
      ]);
      const rubrique = getValue(row, [
        'Libellé Rubrique Comptable',
        'Libelle Rubrique Comptable',
        'libellé rubrique comptable',
        'libelle rubrique comptable',
        'rubrique comptable',
        'col_10',
        'col_14'
      ]);
      const codeRubrique = getValue(row, [
        'Code Rubrique Comptable',
        'code_rubrique_comptable',
        'code rubrique comptable'
      ]);
      const codeChapitre = getValue(row, [
        'Code Chapitre Comptable',
        'code_chapitre_comptable',
        'code chapitre comptable'
      ]);
      const codeSousChapitre = getValue(row, [
        'Code Sous-chapitre Comptable',
        'code_sous_chapitre_comptable',
        'code sous-chapitre comptable'
      ]);

      // Stocker la ligne brute dans imports_raw
      const rawInsert = {
        file_name: file.name,
        import_date: new Date().toISOString(),
        raw_data: row, // Toutes les colonnes en JSONB
        passes_filter: passes,
        import_batch_id: importBatchId,
        created_by: 'système',
        row_number: i + 1,
        total_rows_in_file: totalRows
      };
      
      rawInserts.push(rawInsert);

      // Si la ligne passe les filtres, la traiter pour registre_flux
      if (passes) {
        filteredCount++;
        
        // Extraire le code CED explicite depuis libelle_ressource
        const { codeCED: codeDechet } = extractCedCode(libelleRessource);
        
        // Suggérer un code déchet si pas de code explicite
        let suggestionCodeDechet: string | undefined;
        if (!codeDechet) {
          const suggestion = suggestCodeDechet(libelleRessource);
          suggestionCodeDechet = suggestion?.codeCED || undefined;
        }
        
        const exutoire = extractExutoire(libelleFournisseur, libelleChantier);
        
        // Convertir la date
        const dateExpedition = convertDate(dateValue);
        
        // Convertir les quantités et montants
        const quantiteNum = quantite ? parseFloat(String(quantite).replace(',', '.')) || 0 : 0;
        const puNum = pu ? parseFloat(String(pu).replace(',', '.')) || 0 : 0;
        const montantNum = montant ? parseFloat(String(montant).replace(',', '.')) || 0 : 0;

        if (codeDechet && codeDechet.length === 6) {
          withCodeDechetCount++;
        } else {
          withoutCodeDechetCount++;
        }

        const registreInsert = {
          code_entite: cleanValue(codeEntite),
          libelle_entite: cleanValue(libelleEntite),
          code_chantier: cleanValue(codeChantier),
          libelle_chantier: cleanValue(libelleChantier),
          date_expedition: dateExpedition,
          quantite: quantiteNum,
          unite: cleanValue(unite) || 'T',
          libelle_ressource: cleanValue(libelleRessource),
          code_dechet: codeDechet || null, // Code CED si trouvé, sinon null
          exutoire: exutoire,
          code_fournisseur: cleanValue(codeFournisseur),
          libelle_fournisseur: cleanValue(libelleFournisseur),
          origine: cleanValue(origine),
          code_chapitre_comptable: cleanValue(codeChapitre),
          libelle_chapitre_comptable: cleanValue(chapitre),
          code_sous_chapitre_comptable: cleanValue(codeSousChapitre),
          libelle_sous_chapitre_comptable: cleanValue(sousChapitre),
          code_rubrique_comptable: cleanValue(codeRubrique),
          libelle_rubrique_comptable: cleanValue(rubrique),
          num_commande: null, // À extraire si présent dans CSV
          num_reception: null, // À extraire si présent dans CSV
          code_facture: null, // À extraire si présent dans CSV
          pu: puNum,
          montant: montantNum,
          import_batch_id: importBatchId,
          fichier_source: file.name,
          created_by: 'système',
          // Stocker la suggestion pour le frontend
          suggestionCodeDechet: suggestionCodeDechet || null
        };

        registreInserts.push(registreInsert);
      }
    }

    console.log(`[IMPORT/CSV-FILTERED] Résultats filtrage: ${totalRows} total, ${filteredCount} filtrées, ${withCodeDechetCount} avec code déchet, ${withoutCodeDechetCount} sans code déchet`);
    
    // Logs de debug détaillés
    if (debugInfo.length > 0) {
      console.log(`[IMPORT/CSV-FILTERED] === DEBUG - Échantillon des premières lignes ===`);
      debugInfo.forEach((info, idx) => {
        console.log(`[IMPORT/CSV-FILTERED] Ligne ${info.rowIndex}:`, {
          origine: info.origine,
          chapitre: info.chapitre,
          sousChapitre: info.sousChapitre,
          rubrique: info.rubrique
        });
      });
    }

    let rawInserted = 0;
    let registreInserted = 0;
    
    // Préparer les données au format registre/controle pour le frontend
    const registreData: any[] = [];
    const controleData: any[] = [];

    for (const insert of registreInserts) {
      const baseData = {
        __id: insert.code_dechet ? `r_${registreData.length}` : `c_${controleData.length}`,
        dateExpedition: insert.date_expedition,
        denominationUsuelle: insert.libelle_ressource,
        quantite: insert.quantite,
        codeUnite: insert.unite,
        etablissement: insert.code_entite,
        agence: insert.libelle_entite,
        chantier: insert.libelle_chantier,
        exutoire: insert.exutoire,
        ...insert
      };
      
      if (insert.code_dechet && insert.code_dechet.length === 6) {
        // Déchet avec code CED explicite → va dans registre
        registreData.push({
          ...baseData,
          codeDechet: insert.code_dechet
        });
      } else {
        // Déchet sans code CED explicite → va dans contrôle avec suggestion
        controleData.push({
          ...baseData,
          codeDechet: '',
          suggestionCodeDechet: insert.suggestionCodeDechet || undefined,
          'producteur.raisonSociale': insert.libelle_entite,
          'producteur.adresse.libelle': insert.libelle_chantier,
          'destinataire.raisonSociale': insert.libelle_fournisseur || undefined
        });
      }
    }

    if (MODE_LOCAL) {
      // Mode LOCAL : pas d'insertion Supabase, on retourne juste les données
      console.log(`[IMPORT/CSV-FILTERED] Mode LOCAL: aucune insertion en base, retour des données uniquement`);
      rawInserted = rawInserts.length;
      registreInserted = registreInserts.length;
    } else {
      // Mode PRODUCTION : insertion dans Supabase
      const supabase = getSupabaseServer();
      if (!supabase) {
        return NextResponse.json(
          { error: 'Supabase non configuré' },
          { status: 500 }
        );
      }

      // Insérer les données brutes par lots (Supabase limite à ~1000 lignes)
      const BATCH_SIZE = 500;
      
      for (let i = 0; i < rawInserts.length; i += BATCH_SIZE) {
        const batch = rawInserts.slice(i, i + BATCH_SIZE);
        const { error: rawError } = await supabase
          .from('imports_raw')
          .insert(batch);
        
        if (rawError) {
          console.error(`[IMPORT/CSV-FILTERED] Erreur insertion imports_raw (lot ${Math.floor(i / BATCH_SIZE) + 1}):`, rawError);
          return NextResponse.json(
            { error: `Erreur insertion données brutes: ${rawError.message}` },
            { status: 500 }
          );
        }
        rawInserted += batch.length;
      }

      // Insérer les données traitées par lots
      if (registreInserts.length > 0) {
        // D'abord, récupérer les IDs des imports_raw insérés pour faire la liaison
        const { data: rawData } = await supabase
          .from('imports_raw')
          .select('id, row_number')
          .eq('import_batch_id', importBatchId)
          .order('row_number', { ascending: true });

        // Créer un mapping row_number -> raw_import_id
        const rawIdMap = new Map<number, number>();
        if (rawData) {
          rawData.forEach((r: any) => {
            rawIdMap.set(r.row_number, r.id);
          });
        }

        // Ajouter raw_import_id aux inserts registre
        let registreIndex = 0;
        for (const rawInsert of rawInserts) {
          if (rawInsert.passes_filter) {
            const rawId = rawIdMap.get(rawInsert.row_number);
            if (rawId && registreIndex < registreInserts.length) {
              registreInserts[registreIndex].raw_import_id = rawId;
              registreIndex++;
            }
          }
        }

        // Insérer par lots
        for (let i = 0; i < registreInserts.length; i += BATCH_SIZE) {
          const batch = registreInserts.slice(i, i + BATCH_SIZE);
          const { error: registreError } = await supabase
            .from('registre_flux')
            .insert(batch);
          
          if (registreError) {
            console.error(`[IMPORT/CSV-FILTERED] Erreur insertion registre_flux (lot ${Math.floor(i / BATCH_SIZE) + 1}):`, registreError);
            return NextResponse.json(
              { error: `Erreur insertion registre: ${registreError.message}` },
              { status: 500 }
            );
          }
          registreInserted += batch.length;
        }
      }
    }

    console.log(`[IMPORT/CSV-FILTERED] Import terminé: ${rawInserted} lignes brutes, ${registreInserted} lignes traitées`);

    return NextResponse.json({
      ok: true,
      inserted: registreInserted,
      raw_inserted: rawInserted,
      filtered: filteredCount,
      with_code_dechet: withCodeDechetCount,
      without_code_dechet: withoutCodeDechetCount,
      total_rows: totalRows,
      import_batch_id: importBatchId,
      mode: MODE_LOCAL ? 'local' : 'production',
      stats: {
        total: totalRows,
        filtered: filteredCount,
        with_code_dechet: withCodeDechetCount,
        without_code_dechet: withoutCodeDechetCount,
        filtered_percentage: totalRows > 0 ? ((filteredCount / totalRows) * 100).toFixed(2) : '0.00'
      },
      // Mode LOCAL : retourner aussi les données transformées
      ...(MODE_LOCAL && {
        registre: registreData,
        controle: controleData,
        debug: {
          headers: parseResult.headers.slice(0, 30), // Premiers 30 headers
          sample_rows: debugInfo,
          filtered_data_sample: registreInserts.slice(0, 5) // 5 premières lignes filtrées
        }
      })
    });

  } catch (error: any) {
    console.error('[IMPORT/CSV-FILTERED] Erreur générale:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur serveur lors de l\'import' },
      { status: 500 }
    );
  }
}

