import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    
    if (!supabase) {
      return NextResponse.json({ 
        status: 'error',
        connected: false,
        message: 'Supabase non configuré'
      });
    }

    // Test simple de connexion
    const { error } = await supabase
      .from('depenses_brutes')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        status: 'error',
        connected: false,
        message: error.message
      });
    }

    return NextResponse.json({ 
      status: 'ok',
      connected: true,
      message: 'Base de données connectée'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error',
      connected: false,
      message: error.message
    });
  }
}

