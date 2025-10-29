import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET() {
  try {
    // Vérifier d'abord si les variables d'environnement sont présentes
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!hasUrl || !hasKey) {
      const missing = [];
      if (!hasUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!hasKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      
      return NextResponse.json({ 
        status: 'error',
        connected: false,
        message: `Variables d'environnement manquantes: ${missing.join(', ')}`,
        missing_vars: missing
      });
    }
    
    const supabase = getSupabaseServer();
    
    if (!supabase) {
      return NextResponse.json({ 
        status: 'error',
        connected: false,
        message: 'Impossible de créer le client Supabase malgré la présence des variables'
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

