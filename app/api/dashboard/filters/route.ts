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
      // Récupérer les établissements depuis registre_flux
      const { data, error } = await supabase
        .from('registre_flux')
        .select('code_entite, libelle_entite')
        .not('code_entite', 'is', null);

      if (error) {
        console.error('[DASHBOARD/FILTERS] Erreur établissements:', error);
        return NextResponse.json({ items: [] });
      }

      // Dédupliquer par code_entite
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
      
      const items = Array.from(map.values()).sort((a, b) => 
        a.label.localeCompare(b.label, 'fr')
      );
      
      return NextResponse.json({ items });
    }

    if (type === 'chantiers' && etab) {
      // Récupérer les chantiers pour un établissement depuis registre_flux
      const { data, error } = await supabase
        .from('registre_flux')
        .select('code_chantier, libelle_chantier')
        .eq('code_entite', etab)
        .not('code_chantier', 'is', null);

      if (error) {
        console.error('[DASHBOARD/FILTERS] Erreur chantiers:', error);
        return NextResponse.json({ items: [] });
      }

      // Dédupliquer par code_chantier
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
      
      const items = Array.from(map.values()).sort((a, b) => 
        a.label.localeCompare(b.label, 'fr')
      );
      
      return NextResponse.json({ items });
    }

    if (type === 'numeros' && etab) {
      // Récupérer les numéros de chantier depuis registre_flux
      const { data, error } = await supabase
        .from('registre_flux')
        .select('code_chantier')
        .eq('code_entite', etab)
        .not('code_chantier', 'is', null);

      if (error) {
        console.error('[DASHBOARD/FILTERS] Erreur numéros:', error);
        return NextResponse.json({ items: [] });
      }

      // Dédupliquer les numéros
      const unique = [...new Set((data || []).map(r => String(r.code_chantier)))];
      const items = unique.sort().map(numero => ({
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

