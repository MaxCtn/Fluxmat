-- ============================================================
-- SCRIPT COMPLET D'INITIALISATION SUPABASE POUR FLUXMAT
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Créer la table imports_raw (données brutes importées)
CREATE TABLE IF NOT EXISTS public.imports_raw (
  id bigserial PRIMARY KEY,
  file_name text NOT NULL,
  import_date timestamptz DEFAULT now(),
  raw_data jsonb NOT NULL,  -- Toutes les colonnes du CSV en JSONB
  passes_filter boolean DEFAULT false,  -- Si la ligne passe les filtres métier
  import_batch_id text,  -- ID de lot d'import pour traçabilité
  created_by text DEFAULT 'système',
  
  -- Métadonnées supplémentaires
  row_number bigint,  -- Numéro de ligne dans le fichier original
  total_rows_in_file bigint  -- Nombre total de lignes dans le fichier
);

-- 2. Créer la table registre_flux (données traitées avec code déchet)
CREATE TABLE IF NOT EXISTS public.registre_flux (
  id bigserial PRIMARY KEY,
  raw_import_id bigint REFERENCES public.imports_raw(id) ON DELETE SET NULL,
  
  -- Données essentielles
  code_entite text,
  libelle_entite text,
  code_chantier text,
  libelle_chantier text,
  date_expedition date,
  quantite numeric,
  unite text DEFAULT 'T',
  libelle_ressource text,
  code_dechet text,  -- Code déchet 6 chiffres (ex: 170302)
  exutoire text,  -- Extrait depuis libelle_fournisseur ou libelle_chantier
  
  -- Données fournisseur/exutoire
  code_fournisseur text,
  libelle_fournisseur text,
  
  -- Données comptables (pour référence et filtrage)
  origine text,
  code_chapitre_comptable text,
  libelle_chapitre_comptable text,
  code_sous_chapitre_comptable text,
  libelle_sous_chapitre_comptable text,
  code_rubrique_comptable text,
  libelle_rubrique_comptable text,
  
  -- Données financières
  num_commande text,
  num_reception text,
  code_facture text,
  pu numeric,  -- Prix unitaire
  montant numeric,
  
  -- Métadonnées
  source_name text DEFAULT 'export-manuel',
  created_at timestamptz DEFAULT now(),
  import_batch_id text,
  fichier_source text,
  created_by text DEFAULT 'système'
);

-- 3. Créer la table pending_imports (imports en attente de complétion)
CREATE TABLE IF NOT EXISTS public.pending_imports (
  id bigserial PRIMARY KEY,
  file_name text NOT NULL,
  user_id text,
  user_name text DEFAULT 'Système',
  status text DEFAULT 'pending',
  registre jsonb,
  controle jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Index pour imports_raw
CREATE INDEX IF NOT EXISTS idx_imports_raw_file_name ON public.imports_raw(file_name);
CREATE INDEX IF NOT EXISTS idx_imports_raw_import_date ON public.imports_raw(import_date DESC);
CREATE INDEX IF NOT EXISTS idx_imports_raw_import_batch_id ON public.imports_raw(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_imports_raw_passes_filter ON public.imports_raw(passes_filter);
CREATE INDEX IF NOT EXISTS idx_imports_raw_gin ON public.imports_raw USING gin (raw_data jsonb_path_ops);

-- 5. Index pour registre_flux
CREATE INDEX IF NOT EXISTS idx_registre_flux_raw_import_id ON public.registre_flux(raw_import_id);
CREATE INDEX IF NOT EXISTS idx_registre_flux_code_entite ON public.registre_flux(code_entite);
CREATE INDEX IF NOT EXISTS idx_registre_flux_code_chantier ON public.registre_flux(code_chantier);
CREATE INDEX IF NOT EXISTS idx_registre_flux_date_expedition ON public.registre_flux(date_expedition DESC);
CREATE INDEX IF NOT EXISTS idx_registre_flux_code_dechet ON public.registre_flux(code_dechet);
CREATE INDEX IF NOT EXISTS idx_registre_flux_exutoire ON public.registre_flux(exutoire);
CREATE INDEX IF NOT EXISTS idx_registre_flux_import_batch_id ON public.registre_flux(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_registre_flux_origine ON public.registre_flux(origine);
CREATE INDEX IF NOT EXISTS idx_registre_flux_chapitre_comptable ON public.registre_flux(libelle_chapitre_comptable);
CREATE INDEX IF NOT EXISTS idx_registre_flux_rubrique_comptable ON public.registre_flux(libelle_rubrique_comptable);
CREATE INDEX IF NOT EXISTS idx_registre_flux_created_at ON public.registre_flux(created_at DESC);

-- 6. Index pour pending_imports
CREATE INDEX IF NOT EXISTS idx_pending_imports_status ON public.pending_imports(status);
CREATE INDEX IF NOT EXISTS idx_pending_imports_created ON public.pending_imports(created_at DESC);

-- 7. Extension pour recherche textuelle (si nécessaire)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index de recherche textuelle pour registre_flux
CREATE INDEX IF NOT EXISTS idx_registre_flux_libelle_ressource_trgm 
  ON public.registre_flux USING gin (libelle_ressource gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_registre_flux_libelle_entite_trgm 
  ON public.registre_flux USING gin (libelle_entite gin_trgm_ops);

-- Index composés pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_registre_flux_entite_chantier_date 
  ON public.registre_flux(code_entite, code_chantier, date_expedition DESC);

CREATE INDEX IF NOT EXISTS idx_registre_flux_code_dechet_exutoire 
  ON public.registre_flux(code_dechet, exutoire) 
  WHERE code_dechet IS NOT NULL;

-- Index partiels pour optimiser les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_registre_flux_avec_code_dechet 
  ON public.registre_flux(date_expedition DESC) 
  WHERE code_dechet IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registre_flux_sans_code_dechet 
  ON public.registre_flux(date_expedition DESC) 
  WHERE code_dechet IS NULL;

-- 8. Commentaires pour documentation
COMMENT ON TABLE public.imports_raw IS 'Stocke toutes les lignes brutes importées (après filtrage métier) avec toutes les colonnes originales en JSONB';
COMMENT ON COLUMN public.imports_raw.raw_data IS 'Toutes les colonnes du fichier CSV original stockées en JSONB pour flexibilité';
COMMENT ON COLUMN public.imports_raw.passes_filter IS 'Indique si cette ligne passe les filtres métier (Origine, Chapitre, Sous-chapitre, Rubrique)';

COMMENT ON TABLE public.registre_flux IS 'Données traitées et structurées avec code déchet extrait (ou null si absent)';
COMMENT ON COLUMN public.registre_flux.raw_import_id IS 'Lien vers la ligne brute dans imports_raw pour traçabilité complète';
COMMENT ON COLUMN public.registre_flux.code_dechet IS 'Code déchet CED (6 chiffres) extrait depuis libellé ressource ou saisi manuellement';

COMMENT ON TABLE public.pending_imports IS 'Stocks les imports en attente de complétion (Remplir plus tard)';
COMMENT ON COLUMN public.pending_imports.registre IS 'Lignes validées avec code déchet';
COMMENT ON COLUMN public.pending_imports.controle IS 'Lignes à compléter sans code déchet';

-- 9. RLS (Row Level Security) - Politiques de sécurité de base
-- Activer RLS sur toutes les tables
ALTER TABLE public.imports_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registre_flux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_imports ENABLE ROW LEVEL SECURITY;

-- Politiques : permettre toutes les opérations via service_role (pour les API routes)
-- Note: Les API routes utilisent SUPABASE_SERVICE_ROLE_KEY qui bypass RLS automatiquement
-- Ces politiques permettent aussi l'accès aux utilisateurs authentifiés (si auth activée plus tard)

DROP POLICY IF EXISTS p_all_imports_raw ON public.imports_raw;
CREATE POLICY p_all_imports_raw ON public.imports_raw
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_all_registre_flux ON public.registre_flux;
CREATE POLICY p_all_registre_flux ON public.registre_flux
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_all_pending_imports ON public.pending_imports;
CREATE POLICY p_all_pending_imports ON public.pending_imports
  FOR ALL USING (true) WITH CHECK (true);

