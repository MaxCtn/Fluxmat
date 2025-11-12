-- ============================================================
-- Index supplémentaires pour performance
-- ============================================================

-- Index composés pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_registre_flux_entite_chantier_date 
  ON public.registre_flux(code_entite, code_chantier, date_expedition DESC);

CREATE INDEX IF NOT EXISTS idx_registre_flux_code_dechet_exutoire 
  ON public.registre_flux(code_dechet, exutoire) 
  WHERE code_dechet IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registre_flux_filtres_comptables 
  ON public.registre_flux(origine, libelle_chapitre_comptable, libelle_rubrique_comptable);

-- Index partiels pour optimiser les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_registre_flux_avec_code_dechet 
  ON public.registre_flux(date_expedition DESC) 
  WHERE code_dechet IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registre_flux_sans_code_dechet 
  ON public.registre_flux(date_expedition DESC) 
  WHERE code_dechet IS NULL;

-- Index pour recherches textuelles
CREATE INDEX IF NOT EXISTS idx_registre_flux_libelle_ressource_trgm 
  ON public.registre_flux USING gin (libelle_ressource gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_registre_flux_libelle_entite_trgm 
  ON public.registre_flux USING gin (libelle_entite gin_trgm_ops);

-- Extension pour recherche textuelle (si pas déjà créée)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

