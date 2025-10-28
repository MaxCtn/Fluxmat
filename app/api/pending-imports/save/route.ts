import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 });
    }

    const body = await req.json();
    const { file_name, user_name, registre, controle } = body;

    if (!file_name || !registre || !controle) {
      return NextResponse.json(
        { error: 'file_name, registre et controle requis' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('pending_imports')
      .insert({
        file_name,
        user_name: user_name || 'Système',
        status: 'pending',
        registre,
        controle,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur insertion pending_imports:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id, data });
  } catch (err: any) {
    console.error('Erreur save pending import:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}

