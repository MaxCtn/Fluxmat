import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { extractCed, isMateriauLike } from '../../../lib/transform';

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
    
    console.log(`[TRANSFORM-FIXED] Reçu ${rows.length} lignes Excel`);
    console.log(`[TRANSFORM-FIXED] Colonnes Excel disponibles:`, Object.keys(rows[0] || {}));
    
    // Fonction helper pour trouver une colonne par plusieurs noms possibles
    const findColumn = (row: Record<string, any>, possibleNames: string[]) => {
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return row[name];
        }
      }
      return null;
    };

    // Transformer avec mapping flexible
    const transformed = rows.map((row, index) => {
      const cleanValue = (value: any) => {
        if (value === undefined || value === null) return null;
        if (typeof value === 'string' && value.trim() === '') return null;
        return value;
      };

      // Utiliser les noms de colonnes que vous avez fournis
      const libelleRessource = findColumn(row, [
        "Libellé Ressource", 
        "Libelle Ressource", 
        "Libellé Article", 
        "Libelle Article",
        "Ressource"
      ]) || "";
      
      const isMateriau = isMateriauLike(libelleRessource);
      const ced = extractCed(libelleRessource);

      const transformedRow = {
        // BU
        code_entite: cleanValue(findColumn(row, ["Code Entité", "Code Entite"])),
        libelle_entite: cleanValue(findColumn(row, ["Libellé Entité", "Libelle Entite"])),
        
        // Chantier
        code_project: cleanValue(findColumn(row, ["Code Project"])),
        code_chantier: cleanValue(findColumn(row, ["Code Chantier"])),
        libelle_chantier: cleanValue(findColumn(row, ["Libellé Chantier", "Libelle Chantier"])),
        
        // Matériaux/Déchets
        ressource: cleanValue(findColumn(row, ["Ressource"])),
        libelle_ressource: cleanValue(libelleRessource),
        unite: cleanValue(findColumn(row, ["Unité", "Unite"])) || "T",
        quantite: Number(findColumn(row, ["Quantité", "Quantite"]) || 0),
        code_dechet: ced,
        
        // Exutoire
        code_fournisseur: cleanValue(findColumn(row, ["Code Fournisseur"])),
        libelle_fournisseur: cleanValue(findColumn(row, ["Libellé Fournisseur", "Libelle Fournisseur"])),
        
        // Traçabilité financière
        date_expedition: cleanValue(findColumn(row, ["Date"])),
        num_commande: cleanValue(findColumn(row, ["Num Commande", "NumCommande"])),
        num_reception: cleanValue(findColumn(row, ["Num Réception", "NumReception"])),
        code_facture: cleanValue(findColumn(row, ["Code Facture", "CodeFacture"])),
        code_ecriture: cleanValue(findColumn(row, ["Code Ecriture", "CodeEcriture"])),
        statut: cleanValue(findColumn(row, ["Statut"])),
        pu: Number(findColumn(row, ["PU"]) || 0),
        montant: Number(findColumn(row, ["Montant"]) || 0),
        
        // Contexte technique
        code_ouvrage_origine: cleanValue(findColumn(row, ["Code Ouvrage d'origine"])),
        libelle_ouvrage_origine: cleanValue(findColumn(row, ["Libellé Ouvrage d'origine"])),
        code_ouvrage_actuel: cleanValue(findColumn(row, ["Code Ouvrage actuel/modifié"])),
        libelle_ouvrage_actuel: cleanValue(findColumn(row, ["Libellé Ouvrage actuel/modifié"])),
        
        // Comptabilité/Gestion
        code_rubrique_comptable: cleanValue(findColumn(row, ["Code Rubrique Comptable"])),
        libelle_rubrique_comptable: cleanValue(findColumn(row, ["Libellé Rubrique Comptable"])),
        nature_depense_comptable: cleanValue(findColumn(row, ["Nature Depense Comptable"])),
        
        code_rubrique_gestion: cleanValue(findColumn(row, ["Code Rubrique Gestion"])),
        libelle_rubrique_gestion: cleanValue(findColumn(row, ["Libellé Rubrique Gestion"])),
        nature_depense_gestion: cleanValue(findColumn(row, ["Nature Depense Gestion"])),
        
        // Audit
        origine: cleanValue(findColumn(row, ["Origine"])),
        auteur_depense: cleanValue(findColumn(row, ["Auteur Depense"])),
        modifie: cleanValue(findColumn(row, ["Modifié", "Modifie"])),
        auteur_commentaire: cleanValue(findColumn(row, ["Auteur Commentaire"])),
        commentaire: cleanValue(findColumn(row, ["Commentaire"])),
        valide: cleanValue(findColumn(row, ["Valide"])),
        auteur_valide: cleanValue(findColumn(row, ["Auteur Valide"])),
        
        // Métadonnées
        is_materiau: isMateriau,
        
        __id: `fixed${index}`
      };

      // Log pour debug
      if (index < 3) {
        console.log(`[TRANSFORM-FIXED] Ligne ${index + 1}:`, {
          libelle_ressource: transformedRow.libelle_ressource,
          quantite: transformedRow.quantite,
          libelle_fournisseur: transformedRow.libelle_fournisseur,
          is_materiau: transformedRow.is_materiau
        });
      }

      return transformedRow;
    });

    // Séparer matériaux et contrôle
    const materiaux = transformed.filter(t => t.is_materiau);
    const controle = transformed.filter(t => !t.is_materiau && !t.code_dechet);
    
    console.log(`[TRANSFORM-FIXED] Résultat: ${transformed.length} total, ${materiaux.length} matériaux, ${controle.length} contrôle`);
    
    return NextResponse.json({ 
      toutes_donnees: transformed,
      materiaux, 
      controle,
      // Compatibilité avec l'ancien système
      registre: materiaux,
      controle_legacy: controle
    });
  } catch (e:any) {
    console.error(`[TRANSFORM-FIXED] Erreur:`, e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
