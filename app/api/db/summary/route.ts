import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET(){
  try {
    console.log('[API/DB/SUMMARY] Début de la requête');
    
    // Vérifiez que Supabase est configuré
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.error('[API/DB/SUMMARY] Supabase non configuré');
      return NextResponse.json(
        { error: "Supabase non configuré" },
        { status: 500 }
      );
    }

    console.log('[API/DB/SUMMARY] Supabase configuré, requête en cours...');
    
    // Aggregate by exutoire (libelle_fournisseur) with totals
    const { data, error } = await supabase
      .from('depenses_completes')
      .select('libelle_fournisseur, quantite, unite')
      .eq('is_materiau', true)
      .not('libelle_fournisseur', 'is', null);

    if (error) {
      console.error('[API/DB/SUMMARY] Erreur Supabase:', error);
      return NextResponse.json(
        { error: `Supabase error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('[API/DB/SUMMARY] Données reçues:', data?.length || 0);

    const map = new Map<string, { exutoire: string; quantite: number; nombreLignes: number; unite: string }>();
    for (const row of (data||[])) {
      const exo = row.libelle_fournisseur || '—';
      const e = map.get(exo) || { exutoire: exo, quantite: 0, nombreLignes: 0, unite: row.unite || 'T' };
      e.quantite += Number(row.quantite || 0);
      e.nombreLignes += 1;
      map.set(exo, e);
    }
    const items = [...map.values()].sort((a,b)=> b.quantite - a.quantite);
    console.log('[API/DB/SUMMARY] Résumé généré:', items.length, 'exutoires');
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('[API/DB/SUMMARY] Erreur complète:', error);
    console.error('[API/DB/SUMMARY] Stack:', error?.stack);
    return NextResponse.json({ 
      error: `Erreur: ${error.message || String(error)}`,
      type: 'fetch_error'
    }, { status: 500 });
  }
}
