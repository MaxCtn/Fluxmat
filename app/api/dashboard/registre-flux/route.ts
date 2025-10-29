import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const etab = searchParams.get('etab'); // code_entite
    const chantier = searchParams.get('chantier'); // code_chantier
    const num = searchParams.get('num'); // N° chantier (filtre sur code_chantier)
    const exutoire = searchParams.get('exutoire');
    const code_dechet = searchParams.get('code_dechet');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const quantite_min = searchParams.get('quantite_min');
    const sortBy = searchParams.get('sortBy') || 'date_expedition'; // exutoire, libelle_entite, date_expedition
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Requête pour compter le total (avec filtres)
    let countQuery = supabase
      .from('registre_flux')
      .select('id', { count: 'exact', head: true });

    // Requête pour récupérer les données
    let query = supabase
      .from('registre_flux')
      .select('id, source_name, code_entite, libelle_entite, code_chantier, libelle_chantier, date_expedition, quantite, unite, libelle_ressource, exutoire, code_dechet, created_at, created_by')
      .range(offset, offset + limit - 1);

    // Appliquer les filtres aux deux requêtes
    const applyFilters = (q: any) => {
      if (etab) q = q.eq('code_entite', etab);
      if (chantier) q = q.ilike('code_chantier', `%${chantier}%`);
      if (num) q = q.eq('code_chantier', num);
      if (exutoire) q = q.ilike('exutoire', `%${exutoire}%`);
      if (code_dechet) q = q.eq('code_dechet', code_dechet);
      if (date_from) q = q.gte('date_expedition', date_from);
      if (date_to) q = q.lte('date_expedition', date_to);
      if (quantite_min) q = q.gte('quantite', parseFloat(quantite_min));
      return q;
    };

    countQuery = applyFilters(countQuery);
    query = applyFilters(query);

    // Appliquer le tri
    const ascending = sortOrder === 'asc';
    switch (sortBy) {
      case 'exutoire':
        query = query.order('exutoire', { ascending });
        break;
      case 'libelle_entite':
        query = query.order('libelle_entite', { ascending });
        break;
      case 'date_expedition':
      default:
        query = query.order('date_expedition', { ascending });
        break;
    }

    // Exécuter les deux requêtes en parallèle
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      query
    ]);

    if (countResult.error) {
      console.error('[DASHBOARD/REGISTRE-FLUX] Erreur count:', countResult.error);
    }

    if (dataResult.error) {
      console.error('[DASHBOARD/REGISTRE-FLUX] Erreur data:', dataResult.error);
      return NextResponse.json({ error: dataResult.error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      items: dataResult.data || [],
      count: dataResult.data?.length || 0,
      total: countResult.count || 0
    });
  } catch (error: any) {
    console.error('[DASHBOARD/REGISTRE-FLUX] Erreur:', error);
    return NextResponse.json({ 
      error: error.message || 'Erreur serveur',
      items: []
    }, { status: 500 });
  }
}

