import { NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // 1. Récupérer tous les pending_imports
    const { data: pendingImports, error: pendingError } = await supabase
      .from('pending_imports')
      .select('id, file_name, user_name, created_at, registre, controle')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (pendingError) {
      console.error('[DASHBOARD/FILES-LIST] Erreur pending_imports:', pendingError);
    }

    // 2. Récupérer tous les fichiers depuis registre_flux groupés par source_name/import_batch_id
    const { data: registreData, error: registreError } = await supabase
      .from('registre_flux')
      .select('source_name, import_batch_id, fichier_source, created_at, created_by, code_dechet, libelle_entite, exutoire, code_entite')
      .order('created_at', { ascending: false });

    if (registreError) {
      console.error('[DASHBOARD/FILES-LIST] Erreur registre_flux:', registreError);
    }

    // 3. Créer un Map pour grouper les fichiers
    const filesMap = new Map<string, {
      id: string;
      file_name: string;
      created_at: string;
      user_name: string;
      libelle_entite: string | null;
      code_entite: string | null;
      exutoire: string | null;
      lines_completed: number;
      lines_remaining: number;
      source: 'pending' | 'registre';
      pending_id?: string;
    }>();

    // 4. Traiter les pending_imports
    for (const pending of (pendingImports || [])) {
      const registreCount = Array.isArray(pending.registre) ? pending.registre.length : 0;
      const controleCount = Array.isArray(pending.controle) ? pending.controle.length : 0;
      
      filesMap.set(`pending_${pending.id}`, {
        id: `pending_${pending.id}`,
        file_name: pending.file_name,
        created_at: pending.created_at,
        user_name: pending.user_name || 'Système',
        libelle_entite: null, // À extraire depuis les données si nécessaire
        code_entite: null,
        exutoire: null,
        lines_completed: registreCount,
        lines_remaining: controleCount,
        source: 'pending',
        pending_id: String(pending.id)
      });
    }

    // 5. Traiter les fichiers depuis registre_flux (grouper par source_name ou import_batch_id ou fichier_source)
    const registreFilesMap = new Map<string, {
      file_name: string;
      created_at: string;
      created_by: string;
      libelle_entite: string | null;
      code_entite: string | null;
      exutoire: string | null;
      lines_completed: number;
      lines_remaining: number;
      earliest_date: string;
    }>();

    for (const row of (registreData || [])) {
      // Prioriser fichier_source, puis source_name, puis import_batch_id
      const fileKey = row.fichier_source || row.source_name || row.import_batch_id || 'unknown';
      const fileName = row.fichier_source || row.source_name || fileKey;
      const createdAt = row.created_at || new Date().toISOString();
      
      if (!registreFilesMap.has(fileKey)) {
        registreFilesMap.set(fileKey, {
          file_name: fileName,
          created_at: createdAt,
          earliest_date: createdAt,
          created_by: row.created_by || 'Système',
          libelle_entite: row.libelle_entite || null,
          code_entite: row.code_entite || null,
          exutoire: row.exutoire || null,
          lines_completed: 0,
          lines_remaining: 0
        });
      }

      const file = registreFilesMap.get(fileKey)!;
      
      // Compter les lignes
      if (row.code_dechet && row.code_dechet.trim().length === 6) {
        file.lines_completed++;
      } else {
        file.lines_remaining++;
      }
      
      // Garder la date la plus ancienne (première importation)
      if (createdAt < file.earliest_date) {
        file.earliest_date = createdAt;
        file.created_at = createdAt;
      }
      
      // Mettre à jour les infos si manquantes
      if (!file.libelle_entite && row.libelle_entite) {
        file.libelle_entite = row.libelle_entite;
      }
      if (!file.code_entite && row.code_entite) {
        file.code_entite = row.code_entite;
      }
      if (!file.exutoire && row.exutoire) {
        file.exutoire = row.exutoire;
      }
      if (!file.created_by || file.created_by === 'Système') {
        file.created_by = row.created_by || file.created_by;
      }
    }

    // 6. Fusionner les fichiers registre_flux dans filesMap
    for (const [key, file] of registreFilesMap.entries()) {
      // Éviter les doublons avec pending_imports (comparer par nom)
      const existingPending = Array.from(filesMap.values()).find(
        f => f.source === 'pending' && f.file_name === file.file_name
      );
      
      if (!existingPending) {
        filesMap.set(`registre_${key}`, {
          id: `registre_${key}`,
          file_name: file.file_name,
          created_at: file.created_at,
          user_name: file.created_by,
          libelle_entite: file.libelle_entite,
          code_entite: file.code_entite,
          exutoire: file.exutoire,
          lines_completed: file.lines_completed,
          lines_remaining: file.lines_remaining,
          source: 'registre'
        });
      } else {
        // Merger avec le pending existant (mettre à jour les stats)
        existingPending.lines_completed += file.lines_completed;
        existingPending.lines_remaining += file.lines_remaining;
        if (!existingPending.libelle_entite && file.libelle_entite) {
          existingPending.libelle_entite = file.libelle_entite;
        }
        if (!existingPending.code_entite && file.code_entite) {
          existingPending.code_entite = file.code_entite;
        }
        if (!existingPending.exutoire && file.exutoire) {
          existingPending.exutoire = file.exutoire;
        }
      }
    }

    // 7. Convertir en tableau et trier par date (plus récent en premier)
    const items = Array.from(filesMap.values()).sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ ok: true, items });
  } catch (error: any) {
    console.error('[DASHBOARD/FILES-LIST] Erreur:', error);
    return NextResponse.json({ 
      error: error.message || 'Erreur serveur',
      items: []
    }, { status: 500 });
  }
}

