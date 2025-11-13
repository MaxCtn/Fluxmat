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

    // Test de connexion en vérifiant les tables principales
    const tablesToCheck = ['registre_flux', 'pending_imports', 'imports_raw'];
    const tableStatus: Record<string, boolean> = {};
    let allTablesOk = true;

    for (const table of tablesToCheck) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      tableStatus[table] = !error;
      if (error) {
        allTablesOk = false;
        console.error(`[HEALTH] Erreur table ${table}:`, error.message);
      }
    }

    if (!allTablesOk) {
      return NextResponse.json({ 
        status: 'warning',
        connected: true,
        message: 'Connexion OK mais certaines tables manquent ou sont inaccessibles',
        tables: tableStatus,
        note: 'Exécutez migrations/00_setup_complete.sql dans Supabase pour créer les tables'
      });
    }

    return NextResponse.json({ 
      status: 'ok',
      connected: true,
      message: 'Base de données connectée',
      tables: tableStatus
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error',
      connected: false,
      message: error.message
    });
  }
}

