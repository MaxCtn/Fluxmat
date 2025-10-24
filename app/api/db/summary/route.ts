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
    
    // Récupérer toutes les données sans filtres stricts
    const { data, error } = await supabase
      .from('depenses_completes')
      .select('libelle_fournisseur, quantite, unite, montant, libelle_chantier, libelle_ouvrage_actuel_modifi, code_fournisseur');

    if (error) {
      console.error('[API/DB/SUMMARY] Erreur Supabase:', error);
      return NextResponse.json(
        { error: `Supabase error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('[API/DB/SUMMARY] Données reçues:', data?.length || 0);

    // Créer un résumé par fournisseur
    const map = new Map<string, { 
      fournisseur: string; 
      quantite: number; 
      montant: number; 
      nombreLignes: number; 
      unite: string;
      chantiers: Set<string>;
    }>();

    for (const row of (data||[])) {
      if (!row.libelle_fournisseur) continue; // Ignorer les lignes sans fournisseur
      
      const key = row.libelle_fournisseur;
      const existing = map.get(key) || { 
        fournisseur: row.libelle_fournisseur, 
        quantite: 0, 
        montant: 0,
        nombreLignes: 0, 
        unite: row.unite || 'T',
        chantiers: new Set<string>()
      };
      
      existing.quantite += Number(row.quantite || 0);
      existing.montant += Number(row.montant || 0);
      existing.nombreLignes += 1;
      if (row.libelle_chantier) existing.chantiers.add(row.libelle_chantier);
      
      map.set(key, existing);
    }

    const items = [...map.values()]
      .map(item => ({
        fournisseur: item.fournisseur,
        quantite: item.quantite,
        montant: item.montant,
        nombreLignes: item.nombreLignes,
        unite: item.unite,
        chantiers: Array.from(item.chantiers)
      }))
      .sort((a, b) => b.montant - a.montant); // Trier par montant décroissant

    console.log('[API/DB/SUMMARY] Résumé généré:', items.length, 'fournisseurs');
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
