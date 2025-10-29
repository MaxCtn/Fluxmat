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
    const codeChantier = searchParams.get('code_chantier');
    const libelleChantier = searchParams.get('libelle_chantier');
    const etab = searchParams.get('etab');

    if (!codeChantier && !libelleChantier) {
      return NextResponse.json({ error: 'Code ou libellé de chantier requis' }, { status: 400 });
    }

    // Construire la requête pour récupérer les lignes incomplètes du chantier
    let query = supabase
      .from('registre_flux')
      .select('*')
      .or('code_dechet.is.null,code_dechet.eq.');

    if (codeChantier) {
      query = query.eq('code_chantier', codeChantier);
    } else if (libelleChantier) {
      query = query.eq('libelle_chantier', libelleChantier);
    }

    if (etab) {
      query = query.eq('code_entite', etab);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('[DASHBOARD/LOAD-CHANTIER] Erreur:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Aucune ligne incomplète trouvée pour ce chantier' }, { status: 404 });
    }

    // Transformer les données de registre_flux au format attendu par /controle
    const controle = rows.map(row => ({
      codeDechet: row.code_dechet || '',
      denominationUsuelle: row.libelle_ressource,
      quantite: row.quantite,
      codeUnite: row.unite || 'T',
      dateExpedition: row.date_expedition,
      'producteur.raisonSociale': row.libelle_entite || '',
      'producteur.adresse.libelle': row.libelle_chantier || '',
      'destinataire.raisonSociale': row.exutoire || '',
      __id: `rf_${row.id}`
    }));

    return NextResponse.json({
      ok: true,
      chantier: {
        code_chantier: codeChantier || libelleChantier,
        libelle_chantier: rows[0]?.libelle_chantier,
        libelle_entite: rows[0]?.libelle_entite
      },
      controle,
      count: controle.length
    });
  } catch (error: any) {
    console.error('[DASHBOARD/LOAD-CHANTIER] Erreur:', error);
    return NextResponse.json({ 
      error: error.message || 'Erreur serveur'
    }, { status: 500 });
  }
}

