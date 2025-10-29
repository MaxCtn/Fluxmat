import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.error('[PENDING-IMPORTS/LIST] Supabase non configuré - variables d\'environnement manquantes');
      return NextResponse.json({ 
        error: 'Supabase non configuré. Veuillez configurer NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env.local',
        type: 'missing_env_vars'
      }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('pending_imports')
      .select('id, file_name, user_name, created_at, controle')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération pending_imports:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ajouter le nombre de lignes à compléter
    const items = data.map((item) => ({
      id: item.id,
      file_name: item.file_name,
      user_name: item.user_name,
      created_at: item.created_at,
      lines_to_complete: Array.isArray(item.controle) ? item.controle.length : 0,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error('Erreur list pending imports:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}

