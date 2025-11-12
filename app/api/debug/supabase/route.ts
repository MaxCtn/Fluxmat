import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table') || 'registre_flux';
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 200);

    // Liste des tables publiques
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables' as any)
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name' as any);

    if (tablesError) {
      // Certains environnements n'autorisent pas information_schema via PostgREST;
      // on tolère l'erreur et continue avec l'échantillon de données.
      console.warn('[DEBUG/SUPABASE] tablesError:', tablesError.message);
    }

    // Colonnes de la table choisie
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns' as any)
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', table)
      .order('ordinal_position' as any);

    if (columnsError) {
      console.warn('[DEBUG/SUPABASE] columnsError:', columnsError.message);
    }

    // Échantillon de lignes de la table choisie
    const { data: sample, error: sampleError } = await supabase
      .from(table)
      .select('*')
      .limit(limit);

    if (sampleError) {
      return NextResponse.json({ error: sampleError.message, code: sampleError.code }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      table,
      limit,
      tables: tables?.map((t: any) => t.table_name) || null,
      columns: columns?.map((c: any) => ({ name: c.column_name, type: c.data_type })) || null,
      sample,
    });
  } catch (e: any) {
    console.error('[DEBUG/SUPABASE] Erreur générale:', e);
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}


