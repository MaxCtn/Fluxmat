import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest){
  try {
    console.log('[SAVE-SIMPLE] Début de la requête');
    
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

    // Pour l'instant, on simule une sauvegarde réussie
    // Cela permet de tester le reste de l'application
    console.log(`[SAVE-SIMPLE] Simulation de sauvegarde de ${rows.length} lignes`);
    
    return NextResponse.json({ 
      ok: true, 
      inserted: rows.length, 
      duplicates: 0,
      message: "Données simulées (Supabase temporairement indisponible)"
    });

  } catch (error: any) {
    console.error('[SAVE-SIMPLE] Erreur générale:', error);
    return NextResponse.json({ 
      error: `Erreur: ${error.message}`,
      type: 'general_error'
    }, { status: 500 });
  }
}