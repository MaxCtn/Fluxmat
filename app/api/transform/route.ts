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
    
    console.log(`[TRANSFORM] Reçu ${rows.length} lignes Excel`);
    console.log(`[TRANSFORM] Colonnes Excel:`, Object.keys(rows[0] || {}));
    
    // Fonction helper pour trouver une colonne
    const findColumn = (row: Record<string, any>, possibleNames: string[]) => {
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return row[name];
        }
      }
      return null;
    };

    // Transformer les données avec le bon mapping
    const transformed = rows.map((row, index) => {
      const libelleRessource = findColumn(row, [
        "Libellé Ressource", 
        "Libelle Ressource", 
        "Libellé Article", 
        "Libelle Article",
        "Ressource"
      ]) || "";
      
      const isMateriau = isMateriauLike(libelleRessource);
      const ced = extractCed(libelleRessource);

      // Format compatible avec l'ancien système
      return {
        dateExpedition: findColumn(row, ["Date"]) || "",
        quantite: Number(findColumn(row, ["Quantité", "Quantite"]) || 0),
        codeUnite: findColumn(row, ["Unité", "Unite"]) || "T",
        denominationUsuelle: libelleRessource,
        codeDechet: ced,
        "producteur.raisonSociale": findColumn(row, ["Libellé Entité", "Libelle Entite"]) || "",
        "producteur.adresse.libelle": findColumn(row, ["Libellé Chantier", "Libelle Chantier"]) || "",
        "destinataire.raisonSociale": findColumn(row, ["Libellé Fournisseur", "Libelle Fournisseur"]) || "",
        __id: `t${index}`
      };
    });

    // Séparer matériaux et contrôle
    const registre = transformed.filter(t => t.codeDechet);
    const controle = transformed.filter(t => !t.codeDechet && isMateriauLike(t.denominationUsuelle));
    
    console.log(`[TRANSFORM] Résultat: ${transformed.length} total, ${registre.length} registre, ${controle.length} contrôle`);
    
    return NextResponse.json({ registre, controle });
  } catch (e:any) {
    console.error(`[TRANSFORM] Erreur:`, e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
