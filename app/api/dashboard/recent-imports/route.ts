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
    // Requête sur depenses_brutes avec informations du dernier import
    let query = supabase
      .from('depenses_brutes')
      .select('libelle_fournisseur, code_chantier, date_operation, date_chargement')
      .order('date_chargement', { ascending: false })
      .limit(100);

    if (codeEntite) {
      query = query.eq('code_entite', codeEntite);
    }
    if (codeChantier) {
      query = query.ilike('code_chantier', `%${codeChantier}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[DASHBOARD/RECENT-IMPORTS] Erreur:', error);
      return NextResponse.json({ items: [] });
    }

    // Grouper par code_chantier et prendre la première occurrence (la plus récente)
    const grouped = new Map<string, any>();
    for (const row of (data || [])) {
      const key = row.code_chantier || 'Sans code';
      if (!grouped.has(key)) {
        grouped.set(key, {
          exutoire: row.libelle_fournisseur || 'Non défini',
          numChantier: row.code_chantier || 'N/A',
          date: row.date_operation || 'N/A',
          dateLastImport: row.date_chargement ? new Date(row.date_chargement).toISOString() : 'N/A'
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

