import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

/**
 * Route pour sauvegarder les données sans code déchet vers depenses_a_completer
 * Reçoit des données déjà nettoyées et filtrées
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ 
        error: "Supabase non configuré" 
      }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const rows = body?.rows as any[] || [];
    const pendingImportId = body?.pending_import_id as number | undefined;
    
    if (!rows.length) {
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    console.log(`[SAVE-A-COMPLETER] Reçu ${rows.length} lignes sans code déchet`);

    // Fonction helper pour nettoyer les valeurs
    const cleanValue = (value: any) => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'string' && value.trim() === '') return null;
      return value;
    };

    // Fonction pour convertir la date
    const convertDate = (value: any): string | null => {
      if (!value) return null;
      
      // Si c'est déjà au format YYYY-MM-DD
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return value;
      }
      
      // Si c'est au format DD/MM/YYYY
      if (typeof value === 'string' && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const parts = value.split('/');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      
      // Essayer de parser avec Date
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      
      return null;
    };

    // Fonction pour extraire l'exutoire depuis libelle_fournisseur
    const extractExutoire = (fournisseur: any): string | null => {
      const fournisseurStr = cleanValue(fournisseur);
      return fournisseurStr ? String(fournisseurStr).trim() : null;
    };

    // Déterminer le status
    const determineStatus = (row: any): 'pending' | 'a_categoriser' => {
      // Si pas de suggestion de code déchet, c'est à catégoriser
      if (!row.suggestionCodeDechet && !row.code_dechet_propose) {
        return 'a_categoriser';
      }
      return 'pending';
    };

    // Mapper les données vers depenses_a_completer
    const payload = rows.map(row => {
      const fournisseur = cleanValue(row["destinataire.raisonSociale"]) || 
                         cleanValue(row.libelle_fournisseur) || 
                         cleanValue(row["Libellé Fournisseur"]) || 
                         cleanValue(row["Libelle Fournisseur"]) ||
                         null;

      const exutoire = extractExutoire(fournisseur);
      const suggestionCode = cleanValue(row.suggestionCodeDechet) || 
                           cleanValue(row.code_dechet_propose) ||
                           null;

      return {
        pending_import_id: pendingImportId || null,
        code_entite: cleanValue(row.code_entite) || 
                    cleanValue(row["Code Entité"]) || 
                    cleanValue(row["Code Entite"]) || 
                    null,
        libelle_entite: cleanValue(row["producteur.raisonSociale"]) || 
                      cleanValue(row.libelle_entite) ||
                      cleanValue(row["Libellé Entité"]) ||
                      cleanValue(row["Libelle Entite"]) ||
                      null,
        code_chantier: cleanValue(row.code_chantier) || 
                     cleanValue(row["Code Chantier"]) || 
                     null,
        libelle_chantier: cleanValue(row["producteur.adresse.libelle"]) || 
                         cleanValue(row.libelle_chantier) ||
                         cleanValue(row["Libellé Chantier"]) ||
                         cleanValue(row["Libelle Chantier"]) ||
                         null,
        date_operation: convertDate(row.dateExpedition) || 
                       convertDate(row.date_expedition) ||
                       convertDate(row.date) ||
                       null,
        origine: cleanValue(row.origine) ||
                cleanValue(row["Origine"]) ||
                null,
        code_fournisseur: cleanValue(row.code_fournisseur) ||
                         cleanValue(row["Code Fournisseur"]) ||
                         null,
        libelle_fournisseur: fournisseur,
        code_rubrique_comptable: cleanValue(row.code_rubrique_comptable) ||
                                cleanValue(row["Code Rubrique Comptable"]) ||
                                null,
        libelle_rubrique_comptable: cleanValue(row.libelle_rubrique_comptable) ||
                                   cleanValue(row["Libellé Rubrique Comptable"]) ||
                                   null,
        code_chapitre_comptable: cleanValue(row.code_chapitre_comptable) ||
                                cleanValue(row["Code Chapitre Comptable"]) ||
                                null,
        libelle_chapitre_comptable: cleanValue(row.libelle_chapitre_comptable) ||
                                   cleanValue(row["Libellé Chapitre Comptable"]) ||
                                   null,
        code_sous_chapitre_comptable: cleanValue(row.code_sous_chapitre_comptable) ||
                                    cleanValue(row["Code Sous-chapitre Comptable"]) ||
                                    null,
        libelle_sous_chapitre_comptable: cleanValue(row.libelle_sous_chapitre_comptable) ||
                                       cleanValue(row["Libellé Sous-chapitre Comptable"]) ||
                                       null,
        libelle_nature_comptable: cleanValue(row.libelle_nature_comptable) ||
                                 cleanValue(row["Libellé Nature Comptable"]) ||
                                 null,
        ressource: cleanValue(row.ressource) ||
                  cleanValue(row["Ressource"]) ||
                  null,
        libelle_ressource: cleanValue(row.denominationUsuelle) || 
                         cleanValue(row.libelle_ressource) ||
                         cleanValue(row["Libellé Ressource"]) ||
                         cleanValue(row["Libelle Ressource"]) ||
                         null,
        num_commande: cleanValue(row.num_commande) ||
                     cleanValue(row["Num Commande"]) ||
                     null,
        num_reception: cleanValue(row.num_reception) ||
                      cleanValue(row["Num Réception"]) ||
                      cleanValue(row["Num Reception"]) ||
                      null,
        code_facture: cleanValue(row.code_facture) ||
                     cleanValue(row["Code Facture"]) ||
                     null,
        unite: cleanValue(row.codeUnite) || 
              cleanValue(row.unite) || 
              'T',
        quantite: Number(row.quantite || row.quantite || 0),
        pu: typeof row.pu === 'number' ? row.pu : Number(row.pu || 0),
        montant: typeof row.montant === 'number' ? row.montant : Number(row.montant || 0),
        status: determineStatus(row),
        code_dechet_propose: suggestionCode,
        exutoire: exutoire,
        created_by: cleanValue(row.created_by) || 'système'
      };
    });

    console.log(`[SAVE-A-COMPLETER] ${payload.length} lignes à insérer`);

    const { data, error } = await supabase
      .from('depenses_a_completer')
      .insert(payload)
      .select();

    if (error) {
      console.error(`[SAVE-A-COMPLETER] Erreur Supabase:`, error);
      return NextResponse.json({ 
        error: error.message, 
        code: error.code
      }, { status: 500 });
    }

    const insertedCount = data?.length || payload.length;
    console.log(`[SAVE-A-COMPLETER] Succès: ${insertedCount} lignes insérées`);

    return NextResponse.json({ 
      ok: true, 
      inserted: insertedCount
    });

  } catch (error: any) {
    console.error('[SAVE-A-COMPLETER] Erreur générale:', error);
    return NextResponse.json({ 
      error: `Erreur: ${error.message}`,
      type: 'general_error'
    }, { status: 500 });
  }
}

