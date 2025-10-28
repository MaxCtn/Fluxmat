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
      // Récupérer les établissements depuis depenses_brutes
      const { data, error } = await supabase
        .from('depenses_brutes')
        .select('code_entite, libelle_entite')
        .not('code_entite', 'is', null)
        .order('libelle_entite');

      if (error) {
        return NextResponse.json({ items: [] });
      }

      // Dédupliquer
      const map = new Map<string, { id: string; label: string }>();
      for (const row of (data || [])) {
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

    if (type === 'chantiers' && etab) {
      // Récupérer les chantiers pour un établissement
      const { data, error } = await supabase
        .from('depenses_brutes')
        .select('code_chantier, libelle_chantier')
        .eq('code_entite', etab)
        .not('code_chantier', 'is', null)
        .order('libelle_chantier');

      if (error) {
        return NextResponse.json({ items: [] });
      }

      const map = new Map<string, { id: string; label: string; etabId: string }>();
      for (const row of (data || [])) {
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

    if (type === 'numeros' && etab) {
      // Récupérer les numéros de chantier (identique aux chantiers)
      const { data, error } = await supabase
        .from('depenses_brutes')
        .select('code_chantier')
        .eq('code_entite', etab)
        .not('code_chantier', 'is', null)
        .order('code_chantier');

      if (error) {
        return NextResponse.json({ items: [] });
      }

      const unique = [...new Set((data || []).map(r => r.code_chantier))];
      const items = unique.map(numero => ({
        id: numero,
        numero: numero,
        chantierId: numero
      }));

      return NextResponse.json({ items });
    }

    return NextResponse.json({ items: [] });
  } catch (error: any) {
    console.error('[DASHBOARD/FILTERS] Erreur:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

