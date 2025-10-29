import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.error('[PENDING-IMPORTS/LOAD] Supabase non configuré - variables d\'environnement manquantes');
      return NextResponse.json({ 
        error: 'Supabase non configuré. Veuillez configurer NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env.local',
        type: 'missing_env_vars'
      }, { status: 500 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pending_imports')
      .select('file_name, registre, controle')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (error) {
      console.error('Erreur chargement pending_import:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Import non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      file_name: data.file_name,
      registre: data.registre || [],
      controle: data.controle || [],
    });
  } catch (err: any) {
    console.error('Erreur load pending import:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}

