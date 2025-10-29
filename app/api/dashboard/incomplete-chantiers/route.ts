import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const etab = searchParams.get('etab'); // code_entite

    // Récupérer les lignes incomplètes (sans code_dechet)
    let query = supabase
      .from('registre_flux')
      .select('id, code_chantier, libelle_chantier, libelle_entite, code_entite, exutoire, libelle_ressource, date_expedition, quantite')
      .or('code_dechet.is.null,code_dechet.eq.');

    if (etab) {
      query = query.eq('code_entite', etab);
    }

    const { data: incompleteRows, error } = await query;

    if (error) {
      console.error('[DASHBOARD/INCOMPLETE-CHANTIERS] Erreur:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Grouper par chantier
    const chantiersMap = new Map<string, {
      code_chantier: string | null;
      libelle_chantier: string | null;
      libelle_entite: string | null;
      exutoire: string | null;
      count: number;
      last_date: string | null;
    }>();

    incompleteRows?.forEach((row) => {
      const key = row.code_chantier || row.libelle_chantier || 'sans-chantier';
      
      if (!chantiersMap.has(key)) {
        chantiersMap.set(key, {
          code_chantier: row.code_chantier,
          libelle_chantier: row.libelle_chantier,
          libelle_entite: row.libelle_entite,
          exutoire: row.exutoire,
          count: 0,
          last_date: null
        });
      }

      const chantier = chantiersMap.get(key)!;
      chantier.count++;
      
      // Garder la date la plus récente
      if (row.date_expedition) {
        if (!chantier.last_date || new Date(row.date_expedition) > new Date(chantier.last_date)) {
          chantier.last_date = row.date_expedition;
        }
      }
    });

    // Convertir en tableau et trier par nombre de lignes (décroissant)
    const chantiers = Array.from(chantiersMap.values())
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ 
      items: chantiers,
      total: chantiers.length,
      total_lines: incompleteRows?.length || 0
    });
  } catch (error: any) {
    console.error('[DASHBOARD/INCOMPLETE-CHANTIERS] Erreur:', error);
    return NextResponse.json({ 
      error: error.message || 'Erreur serveur',
      items: []
    }, { status: 500 });
  }
}

