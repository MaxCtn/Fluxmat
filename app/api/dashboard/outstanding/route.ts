import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const etab = searchParams.get('etab');
  const chantier = searchParams.get('chantier');

  try {
    // Compter les lignes sans code_dechet dans registre_flux
    let query = supabase
      .from('registre_flux')
      .select('id', { count: 'exact' })
      .or('code_dechet.is.null,code_dechet.eq.');

    if (etab) {
      query = query.eq('code_entite', etab);
    }
    if (chantier) {
      query = query.ilike('code_chantier', `%${chantier}%`);
    }

    const { count: missingCodes, error } = await query;

    if (error) {
      console.error('[DASHBOARD/OUTSTANDING] Erreur missing codes:', error);
    }

    // Compter les chantiers incomplets (chantiers distincts avec des lignes sans code_dechet)
    let chantiersQuery = supabase
      .from('registre_flux')
      .select('code_chantier', { count: 'exact' })
      .or('code_dechet.is.null,code_dechet.eq.')
      .not('code_chantier', 'is', null);

    if (etab) {
      chantiersQuery = chantiersQuery.eq('code_entite', etab);
    }

    const { count: incompleteChantiers, error: chantiersError } = await chantiersQuery;

    if (chantiersError) {
      console.error('[DASHBOARD/OUTSTANDING] Erreur chantiers:', chantiersError);
    }

    return NextResponse.json({
      missingCodes: missingCodes || 0,
      incompleteChantiers: incompleteChantiers || 0
    });
  } catch (error: any) {
    console.error('[DASHBOARD/OUTSTANDING] Erreur:', error);
    return NextResponse.json({ 
      missingCodes: 0, 
      incompleteChantiers: 0,
      error: error.message 
    }, { status: 500 });
  }
}

