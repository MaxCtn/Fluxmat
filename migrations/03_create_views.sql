-- ============================================================
-- Vues pour faciliter les requêtes et le dashboard
-- ============================================================

-- Vue unifiée des données filtrées (passe les filtres métier)
CREATE OR REPLACE VIEW public.v_imports_filtres AS
SELECT 
  ir.id,
  ir.file_name,
  ir.import_date,
  ir.import_batch_id,
  ir.passes_filter,
  rf.id as registre_flux_id,
  rf.code_entite,
  rf.libelle_entite,
  rf.code_chantier,
  rf.libelle_chantier,
  rf.date_expedition,
  rf.quantite,
  rf.unite,
  rf.libelle_ressource,
  rf.code_dechet,
  rf.exutoire,
  rf.libelle_fournisseur,
  rf.montant,
  rf.origine,
  rf.libelle_chapitre_comptable,
  rf.libelle_rubrique_comptable,
  CASE 
    WHEN rf.code_dechet IS NOT NULL AND LENGTH(rf.code_dechet) = 6 THEN true 
    ELSE false 
  END as has_code_dechet
FROM public.imports_raw ir
LEFT JOIN public.registre_flux rf ON rf.raw_import_id = ir.id
WHERE ir.passes_filter = true;

-- Vue des statistiques par fichier importé
CREATE OR REPLACE VIEW public.v_imports_stats AS
SELECT 
  ir.import_batch_id,
  ir.file_name,
  ir.import_date,
  COUNT(*) as total_lignes,
  COUNT(CASE WHEN ir.passes_filter THEN 1 END) as lignes_filtrees,
  COUNT(CASE WHEN rf.code_dechet IS NOT NULL AND LENGTH(rf.code_dechet) = 6 THEN 1 END) as lignes_avec_code_dechet,
  COUNT(CASE WHEN rf.code_dechet IS NULL OR LENGTH(rf.code_dechet) != 6 THEN 1 END) as lignes_sans_code_dechet,
  SUM(CASE WHEN rf.montant IS NOT NULL THEN rf.montant ELSE 0 END) as montant_total
FROM public.imports_raw ir
LEFT JOIN public.registre_flux rf ON rf.raw_import_id = ir.id
GROUP BY ir.import_batch_id, ir.file_name, ir.import_date;

-- Vue des lignes sans code déchet (pour complétion)
CREATE OR REPLACE VIEW public.v_lignes_a_completer AS
SELECT 
  rf.id,
  rf.raw_import_id,
  rf.code_entite,
  rf.libelle_entite,
  rf.code_chantier,
  rf.libelle_chantier,
  rf.date_expedition,
  rf.quantite,
  rf.unite,
  rf.libelle_ressource,
  rf.exutoire,
  rf.libelle_fournisseur,
  rf.libelle_rubrique_comptable,
  ir.file_name,
  ir.import_date
FROM public.registre_flux rf
INNER JOIN public.imports_raw ir ON ir.id = rf.raw_import_id
WHERE (rf.code_dechet IS NULL OR LENGTH(rf.code_dechet) != 6)
  AND ir.passes_filter = true
ORDER BY rf.date_expedition DESC, rf.created_at DESC;

-- Commentaires sur les vues
COMMENT ON VIEW public.v_imports_filtres IS 'Vue unifiée des données qui passent les filtres métier, avec indication si code déchet présent';
COMMENT ON VIEW public.v_imports_stats IS 'Statistiques agrégées par fichier importé';
COMMENT ON VIEW public.v_lignes_a_completer IS 'Liste des lignes filtrées qui nécessitent un code déchet';

