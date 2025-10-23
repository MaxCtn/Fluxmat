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
    
    console.log(`[TRANSFORM-DEBUG] Reçu ${rows.length} lignes Excel`);
    console.log(`[TRANSFORM-DEBUG] Colonnes Excel:`, Object.keys(rows[0] || {}));
    
    // Transformer avec les vrais noms de colonnes
    const transformed = rows.map((row, index) => {
      const cleanValue = (value: any) => {
        if (value === undefined || value === null) return null;
        if (typeof value === 'string' && value.trim() === '') return null;
        return value;
      };

      const libelleRessource = row["Libellé Ressource"] || "";
      const isMateriau = isMateriauLike(libelleRessource);
      const ced = extractCed(libelleRessource);

      return {
        // BU
        code_entite: cleanValue(row["Code Entité"]),
        libelle_entite: cleanValue(row["Libellé Entité"]),
        
        // Chantier
        code_project: cleanValue(row["Code Project"]),
        code_chantier: cleanValue(row["Code Chantier"]),
        libelle_chantier: cleanValue(row["Libellé Chantier"]),
        
        // Matériaux/Déchets
        ressource: cleanValue(row["Ressource"]),
        libelle_ressource: cleanValue(row["Libellé Ressource"]),
        unite: cleanValue(row["Unité"]) || "T",
        quantite: Number(row["Quantité"] || 0),
        code_dechet: ced,
        
        // Exutoire
        code_fournisseur: cleanValue(row["Code Fournisseur"]),
        libelle_fournisseur: cleanValue(row["Libellé Fournisseur"]),
        
        // Traçabilité financière
        date_expedition: cleanValue(row["Date"]),
        num_commande: cleanValue(row["Num Commande"]),
        num_reception: cleanValue(row["Num Réception"]),
        code_facture: cleanValue(row["Code Facture"]),
        code_ecriture: cleanValue(row["Code Ecriture"]),
        statut: cleanValue(row["Statut"]),
        pu: Number(row["PU"] || 0),
        montant: Number(row["Montant"] || 0),
        
        // Contexte technique
        code_ouvrage_origine: cleanValue(row["Code Ouvrage d'origine"]),
        libelle_ouvrage_origine: cleanValue(row["Libellé Ouvrage d'origine"]),
        code_ouvrage_actuel: cleanValue(row["Code Ouvrage actuel/modifié"]),
        libelle_ouvrage_actuel: cleanValue(row["Libellé Ouvrage actuel/modifié"]),
        
        // Comptabilité/Gestion
        code_rubrique_comptable: cleanValue(row["Code Rubrique Comptable"]),
        libelle_rubrique_comptable: cleanValue(row["Libellé Rubrique Comptable"]),
        nature_depense_comptable: cleanValue(row["Nature Depense Comptable"]),
        
        code_rubrique_gestion: cleanValue(row["Code Rubrique Gestion"]),
        libelle_rubrique_gestion: cleanValue(row["Libellé Rubrique Gestion"]),
        nature_depense_gestion: cleanValue(row["Nature Depense Gestion"]),
        
        // Audit
        origine: cleanValue(row["Origine"]),
        auteur_depense: cleanValue(row["Auteur Depense"]),
        modifie: cleanValue(row["Modifié"]),
        auteur_commentaire: cleanValue(row["Auteur Commentaire"]),
        commentaire: cleanValue(row["Commentaire"]),
        valide: cleanValue(row["Valide"]),
        auteur_valide: cleanValue(row["Auteur Valide"]),
        
        // Métadonnées
        is_materiau: isMateriau,
        
        __id: `debug${index}`
      };
    });

    console.log(`[TRANSFORM-DEBUG] Première ligne transformée:`, JSON.stringify(transformed[0], null, 2));
    
    // Séparer matériaux et contrôle
    const materiaux = transformed.filter(t => t.is_materiau);
    const controle = transformed.filter(t => !t.is_materiau && !t.code_dechet);
    
    return NextResponse.json({ 
      toutes_donnees: transformed,
      materiaux, 
      controle,
      // Compatibilité avec l'ancien système
      registre: materiaux,
      controle_legacy: controle
    });
  } catch (e:any) {
    console.error(`[TRANSFORM-DEBUG] Erreur:`, e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
