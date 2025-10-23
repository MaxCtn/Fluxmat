import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { transformComplete } from '../../../lib/transformComplete';

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
    
    // Utiliser la nouvelle fonction de transformation complète
    const { toutes_donnees, materiaux, controle } = transformComplete(rows);
    
    return NextResponse.json({ 
      toutes_donnees, 
      materiaux, 
      controle,
      // Compatibilité avec l'ancien système
      registre: materiaux.filter(m => m.code_dechet),
      controle_legacy: controle
    });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
