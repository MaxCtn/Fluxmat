import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Paramètres de filtre
    const exutoire = searchParams.get('exutoire');
    const natureGestion = searchParams.getAll('nature_gestion'); // Peut être multiple
    const ressource = searchParams.getAll('ressource'); // Peut être multiple
    const brut = searchParams.get('brut') === 'true'; // Si true, utilise depenses_brutes
    
    console.log('[API/DB/FILTERED] Filtres:', { exutoire, natureGestion, ressource, brut });
    
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase non configuré" },
        { status: 500 }
      );
    }

    // Choisir la table (brute ou complète)
    const table = brut ? 'depenses_brutes' : 'depenses_completes';
    
    let query = supabase.from(table).select('*');
    
    // Filtre 1 : Exutoire (Libellé Fournisseur)
    if (exutoire) {
      query = query.eq('libelle_fournisseur', exutoire);
    }
    
    // Filtre 2 : Libellé Nature Gestion (peut être multiple)
    if (natureGestion && natureGestion.length > 0) {
      query = query.in('libelle_nature_gestion', natureGestion);
    }
    
    // Filtre 3 : Libellé Ressource (peut être multiple)
    if (ressource && ressource.length > 0) {
      query = query.in('libelle_ressource', ressource);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[API/DB/FILTERED] Erreur Supabase:', error);
      return NextResponse.json(
        { error: `Supabase error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('[API/DB/FILTERED] Résultats:', data?.length || 0, 'lignes');
    
    return NextResponse.json({ 
      data,
      count: data?.length || 0,
      filters: { exutoire, natureGestion, ressource, brut }
    });
  } catch (error: any) {
    console.error('[API/DB/FILTERED] Erreur complète:', error);
    return NextResponse.json({ 
      error: `Erreur: ${error.message || String(error)}`
    }, { status: 500 });
  }
}

// API pour récupérer les listes de filtres disponibles
export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    const brut = request.headers.get('x-brut') === 'true';
    const table = brut ? 'depenses_brutes' : 'depenses_completes';
    
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    if (action === 'get_exutoires') {
      // Récupérer tous les exutoires uniques
      const { data, error } = await supabase
        .from(table)
        .select('libelle_fournisseur')
        .not('libelle_fournisseur', 'is', null);
      
      if (error) throw error;
      
      const unique = [...new Set(data?.map(d => d.libelle_fournisseur) || [])];
      return NextResponse.json({ 
        exutoires: unique.sort()
      });
    }

    if (action === 'get_natures') {
      // Récupérer toutes les natures de gestion uniques
      const { data, error } = await supabase
        .from(table)
        .select('libelle_nature_gestion')
        .not('libelle_nature_gestion', 'is', null);
      
      if (error) throw error;
      
      const unique = [...new Set(data?.map(d => d.libelle_nature_gestion) || [])];
      return NextResponse.json({ 
        natures: unique.sort()
      });
    }

    if (action === 'get_ressources') {
      // Récupérer toutes les ressources uniques
      const { data, error } = await supabase
        .from(table)
        .select('libelle_ressource')
        .not('libelle_ressource', 'is', null);
      
      if (error) throw error;
      
      const unique = [...new Set(data?.map(d => d.libelle_ressource) || [])];
      return NextResponse.json({ 
        ressources: unique.sort()
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error: any) {
    console.error('[API/DB/FILTERED] POST Erreur:', error);
    return NextResponse.json({ 
      error: `Erreur: ${error.message || String(error)}`
    }, { status: 500 });
  }
}
