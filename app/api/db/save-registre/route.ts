import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

/**
 * Route pour sauvegarder les données avec code déchet vers registre_flux
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
    
    if (!rows.length) {
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    console.log(`[SAVE-REGISTRE] Reçu ${rows.length} lignes avec code déchet`);

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

    // Mapper les données vers registre_flux
    const payload = rows.map(row => {
      // Extraire code déchet (doit être exactement 6 chiffres)
      let codeDechet = cleanValue(row.codeDechet) || cleanValue(row.code_dechet);
      if (codeDechet) {
        codeDechet = codeDechet.toString().replace(/\D/g, '').slice(0, 6);
        if (codeDechet.length !== 6) {
          codeDechet = null; // Invalide si pas exactement 6 chiffres
        }
      }

      const fournisseur = cleanValue(row["destinataire.raisonSociale"]) || 
                         cleanValue(row.libelle_fournisseur) || 
                         cleanValue(row["Libellé Fournisseur"]) || 
                         cleanValue(row["Libelle Fournisseur"]) ||
                         null;

      const exutoire = extractExutoire(fournisseur);

      return {
        source_name: cleanValue(row.source_name) || 'import-excel',
        brut_id: null, // Pas de lien avec depenses_brutes (on abandonne cette table)
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
        date_expedition: convertDate(row.dateExpedition) || 
                        convertDate(row.date_expedition) ||
                        convertDate(row.date) ||
                        null,
        quantite: Number(row.quantite || row.quantite || 0),
        unite: cleanValue(row.codeUnite) || 
              cleanValue(row.unite) || 
              'T',
        libelle_ressource: cleanValue(row.denominationUsuelle) || 
                          cleanValue(row.libelle_ressource) ||
                          cleanValue(row["Libellé Ressource"]) ||
                          cleanValue(row["Libelle Ressource"]) ||
                          null,
        exutoire: exutoire,
        code_dechet: codeDechet,
        code_fournisseur: cleanValue(row.code_fournisseur) ||
                         cleanValue(row["Code Fournisseur"]) ||
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
        pu: typeof row.pu === 'number' ? row.pu : Number(row.pu || 0),
        montant: typeof row.montant === 'number' ? row.montant : Number(row.montant || 0),
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
        origine: cleanValue(row.origine) ||
                cleanValue(row["Origine"]) ||
                null,
        created_by: cleanValue(row.created_by) || 'système'
      };
    }).filter(p => p.code_dechet !== null); // Filtrer les lignes sans code déchet valide

    console.log(`[SAVE-REGISTRE] ${payload.length} lignes valides à insérer (${rows.length - payload.length} ignorées)`);

    if (payload.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        inserted: 0,
        message: 'Aucune ligne avec code déchet valide'
      });
    }

    // Gérer les doublons via la contrainte unique existante
    const { data, error } = await supabase
      .from('registre_flux')
      .insert(payload)
      .select();

    if (error) {
      console.error(`[SAVE-REGISTRE] Erreur Supabase:`, error);
      // Si erreur de contrainte unique, essayer d'insérer ligne par ligne
      if (error.code === '23505') {
        console.log(`[SAVE-REGISTRE] Doublons détectés, insertion sélective...`);
        let inserted = 0;
        for (const row of payload) {
          const { error: insertError } = await supabase
            .from('registre_flux')
            .insert(row)
            .select();
          if (!insertError) inserted++;
        }
        return NextResponse.json({ 
          ok: true, 
          inserted,
          duplicates: payload.length - inserted
        });
      }
      return NextResponse.json({ 
        error: error.message, 
        code: error.code
      }, { status: 500 });
    }

    const insertedCount = data?.length || payload.length;
    console.log(`[SAVE-REGISTRE] Succès: ${insertedCount} lignes insérées`);

    return NextResponse.json({ 
      ok: true, 
      inserted: insertedCount
    });

  } catch (error: any) {
    console.error('[SAVE-REGISTRE] Erreur générale:', error);
    return NextResponse.json({ 
      error: `Erreur: ${error.message}`,
      type: 'general_error'
    }, { status: 500 });
  }
}

