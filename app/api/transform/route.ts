import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { transform } from '../../../lib/transform';

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
    
    // Utiliser la fonction transform qui applique les filtres
    const result = transform(rows);
    
    console.log(`[TRANSFORM] Résultat: ${result.registre.length} registre (avec code), ${result.controle.length} contrôle (sans code), ${result.allWasteRows?.length || 0} lignes unifiées`);
    
    return NextResponse.json({ 
      registre: result.registre, 
      controle: result.controle,
      allWasteRows: result.allWasteRows || [],
      allRows: result.allRows || []
    });
  } catch (e:any) {
    console.error(`[TRANSFORM] Erreur:`, e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
