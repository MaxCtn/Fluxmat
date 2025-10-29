import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const codeEntite = searchParams.get('etab');
  const codeChantier = searchParams.get('chantier');

  try {
    // Essayer d'abord avec la vue unifiée, sinon fallback sur registre_flux
    let query = supabase
      .from('v_depenses_filtrees_unifie')
      .select('libelle_fournisseur, exutoire, code_chantier, date_expedition, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (codeEntite) {
      query = query.eq('code_entite', codeEntite);
    }
    if (codeChantier) {
      query = query.ilike('code_chantier', `%${codeChantier}%`);
    }

    let { data, error } = await query;

    // Si la vue n'existe pas, fallback sur registre_flux
    if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation'))) {
      console.log('[DASHBOARD/RECENT-IMPORTS] Vue v_depenses_filtrees_unifie non trouvée, utilisation de registre_flux');
      query = supabase
        .from('registre_flux')
        .select('libelle_fournisseur, exutoire, code_chantier, date_expedition, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (codeEntite) {
        query = query.eq('code_entite', codeEntite);
      }
      if (codeChantier) {
        query = query.ilike('code_chantier', `%${codeChantier}%`);
      }
      
      const fallbackResult = await query;
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('[DASHBOARD/RECENT-IMPORTS] Erreur:', error);
      return NextResponse.json({ items: [] });
    }

    // Grouper par code_chantier et prendre la première occurrence (la plus récente)
    const grouped = new Map<string, any>();
    for (const row of (data || [])) {
      const key = row.code_chantier || 'Sans code';
      if (!grouped.has(key)) {
        // Utiliser exutoire en priorité, puis libelle_fournisseur comme fallback
        const exutoire = (row as any).exutoire || row.libelle_fournisseur || 'Non défini';
        grouped.set(key, {
          exutoire: exutoire,
          numChantier: row.code_chantier || 'N/A',
          date: row.date_expedition || 'N/A',
          dateLastImport: row.created_at ? new Date(row.created_at).toISOString() : 'N/A'
        });
      }
    }

    // Prendre les 10 premiers
    const items = Array.from(grouped.values()).slice(0, 10);

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('[DASHBOARD/RECENT-IMPORTS] Erreur:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

