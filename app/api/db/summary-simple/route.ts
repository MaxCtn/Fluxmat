import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    console.log('[SUMMARY-SIMPLE] Génération du résumé');
    
    // Pour l'instant, on retourne des données simulées
    const mockData = [
      {
        exutoire: "Carrière de Test",
        nombreLignes: 5,
        quantite: 125.50,
        unite: "T"
      },
      {
        exutoire: "Centre de Valorisation",
        nombreLignes: 3,
        quantite: 89.25,
        unite: "T"
      }
    ];

    console.log(`[SUMMARY-SIMPLE] Retour de ${mockData.length} exutoires simulés`);
    
    return NextResponse.json(mockData);

  } catch (error: any) {
    console.error('[SUMMARY-SIMPLE] Erreur:', error);
    return NextResponse.json({ 
      error: `Erreur: ${error.message}`,
      type: 'summary_error'
    }, { status: 500 });
  }
}
