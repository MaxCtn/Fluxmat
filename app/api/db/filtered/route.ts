import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Paramètres de filtre
    const exutoire = searchParams.get('exutoire');
    const natureGestion = searchParams.getAll('nature_gestion');
    const ressource = searchParams.getAll('ressource');
    const brut = searchParams.get('brut') === 'true';
    
    console.log('[API/DB/FILTERED] Filtres:', { exutoire, natureGestion, ressource, brut });
    
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase non configuré" },
        { status: 500 }
      );
    }

    const table = brut ? 'depenses_brutes' : 'depenses_completes';
    
    let query = supabase.from(table).select('*');
    
    if (exutoire) {
      query = query.eq('libelle_fournisseur', exutoire);
    }
    
    if (natureGestion && natureGestion.length > 0) {
      query = query.in('libelle_nature_gestion', natureGestion);
    }
    
    if (ressource && ressource.length > 0) {
      query = query.in('libelle_ressource', ressource);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false }).limit(1000);

    if (error) {
      console.error('[API/DB/FILTERED] Erreur Supabase:', error);
      // Si la table n'existe pas, retourner des données vides au lieu d'erreur
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          data: [],
          count: 0,
          filters: { exutoire, natureGestion, ressource, brut },
          warning: `Table ${table} not yet populated`
        });
      }
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
      const { data, error } = await supabase
        .from(table)
        .select('libelle_fournisseur')
        .not('libelle_fournisseur', 'is', null)
        .limit(1000);
      
      if (error) {
        console.warn('[API/DB/FILTERED] Table might not exist:', table);
        return NextResponse.json({ exutoires: [] });
      }
      
      const unique = [...new Set(data?.map(d => d.libelle_fournisseur) || [])].sort();
      return NextResponse.json({ exutoires: unique });
    }

    if (action === 'get_natures') {
      const { data, error } = await supabase
        .from(table)
        .select('libelle_nature_gestion')
        .not('libelle_nature_gestion', 'is', null)
        .limit(1000);
      
      if (error) {
        console.warn('[API/DB/FILTERED] Table might not exist:', table);
        return NextResponse.json({ natures: [] });
      }
      
      const unique = [...new Set(data?.map(d => d.libelle_nature_gestion) || [])].sort();
      return NextResponse.json({ natures: unique });
    }

    if (action === 'get_ressources') {
      const { data, error } = await supabase
        .from(table)
        .select('libelle_ressource')
        .not('libelle_ressource', 'is', null)
        .limit(1000);
      
      if (error) {
        console.warn('[API/DB/FILTERED] Table might not exist:', table);
        return NextResponse.json({ ressources: [] });
      }
      
      const unique = [...new Set(data?.map(d => d.libelle_ressource) || [])].sort();
      return NextResponse.json({ ressources: unique });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error: any) {
    console.error('[API/DB/FILTERED] POST Erreur:', error);
    return NextResponse.json({ 
      error: `Erreur: ${error.message || String(error)}`
    }, { status: 500 });
  }
}
