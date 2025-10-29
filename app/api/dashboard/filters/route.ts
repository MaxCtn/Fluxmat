import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const etab = searchParams.get('etab');

  try {
    if (type === 'etablissements') {
      // Récupérer les établissements depuis la vue v_etablissements
      const { data, error } = await supabase
        .from('v_etablissements')
        .select('id, label')
        .order('label');

      if (error) {
        // Fallback: essayer avec v_depenses_filtrees_unifie si la vue n'existe pas encore
        const { data: fallbackData } = await supabase
          .from('v_depenses_filtrees_unifie')
          .select('code_entite, libelle_entite')
          .not('code_entite', 'is', null);
        
        if (fallbackData) {
          const map = new Map<string, { id: string; label: string }>();
          for (const row of fallbackData) {
            const key = String(row.code_entite);
            if (!map.has(key)) {
              map.set(key, {
                id: key,
                label: row.libelle_entite || key
              });
            }
          }
          return NextResponse.json({ items: Array.from(map.values()) });
        }
        return NextResponse.json({ items: [] });
      }

      // La vue v_etablissements retourne déjà les données dédupliquées
      return NextResponse.json({ items: (data || []).map(row => ({
        id: String(row.id),
        label: row.label
      })) });
    }

    if (type === 'chantiers' && etab) {
      // Récupérer les chantiers pour un établissement depuis la vue v_chantiers
      const { data, error } = await supabase
        .from('v_chantiers')
        .select('id, label, etab_id')
        .eq('etab_id', etab)
        .order('label');

      if (error) {
        // Fallback: essayer avec v_depenses_filtrees_unifie
        const { data: fallbackData } = await supabase
          .from('v_depenses_filtrees_unifie')
          .select('code_chantier, libelle_chantier')
          .eq('code_entite', etab)
          .not('code_chantier', 'is', null);
        
        if (fallbackData) {
          const map = new Map<string, { id: string; label: string; etabId: string }>();
          for (const row of fallbackData) {
            const key = String(row.code_chantier);
            if (!map.has(key)) {
              map.set(key, {
                id: key,
                label: row.libelle_chantier || key,
                etabId: etab
              });
            }
          }
          return NextResponse.json({ items: Array.from(map.values()) });
        }
        return NextResponse.json({ items: [] });
      }

      // La vue v_chantiers retourne déjà les données dédupliquées
      return NextResponse.json({ items: (data || []).map(row => ({
        id: String(row.id),
        label: row.label,
        etabId: String(row.etab_id)
      })) });
    }

    if (type === 'numeros' && etab) {
      // Récupérer les numéros de chantier depuis la vue v_numeros_chantier
      const { data, error } = await supabase
        .from('v_numeros_chantier')
        .select('id, numero, chantier_id')
        .order('numero');

      if (error) {
        // Fallback: essayer avec v_depenses_filtrees_unifie
        const { data: fallbackData } = await supabase
          .from('v_depenses_filtrees_unifie')
          .select('code_chantier')
          .eq('code_entite', etab)
          .not('code_chantier', 'is', null);
        
        if (fallbackData) {
          const unique = [...new Set((fallbackData || []).map(r => r.code_chantier))];
          const items = unique.map(numero => ({
            id: numero,
            numero: numero,
            chantierId: numero
          }));
          return NextResponse.json({ items });
        }
        return NextResponse.json({ items: [] });
      }

      // La vue v_numeros_chantier retourne déjà les numéros
      return NextResponse.json({ items: (data || []).map(row => ({
        id: String(row.id),
        numero: String(row.numero),
        chantierId: String(row.chantier_id)
      })) });
    }

    return NextResponse.json({ items: [] });
  } catch (error: any) {
    console.error('[DASHBOARD/FILTERS] Erreur:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

