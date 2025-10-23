import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    console.log('[TEST-SUPABASE] Test de connectivité Supabase...');
    
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Supabase non configuré' 
      }, { status: 500 });
    }

    // Test simple de connexion
    const { data, error } = await supabase
      .from('depenses_completes')
      .select('count')
      .limit(1);

    if (error) {
      console.error('[TEST-SUPABASE] Erreur Supabase:', error);
      return NextResponse.json({ 
        status: 'error', 
        message: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    console.log('[TEST-SUPABASE] Connexion réussie');
    return NextResponse.json({ 
      status: 'success', 
      message: 'Connexion Supabase OK',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[TEST-SUPABASE] Erreur générale:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
