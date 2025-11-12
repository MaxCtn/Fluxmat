-- ============================================================
-- Création des tables pour le nouveau système d'import CSV
-- Base Supabase vierge - architecture complète
-- ============================================================

-- Table principale pour stocker les données brutes importées (après filtrage)
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

-- Table pour données traitées (avec/sans code déchet)
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
  created_at timestamptz DEFAULT now(),
  import_batch_id text,
  fichier_source text,
  created_by text DEFAULT 'système'
);

-- Index pour imports_raw
CREATE INDEX IF NOT EXISTS idx_imports_raw_file_name ON public.imports_raw(file_name);
CREATE INDEX IF NOT EXISTS idx_imports_raw_import_date ON public.imports_raw(import_date DESC);
CREATE INDEX IF NOT EXISTS idx_imports_raw_import_batch_id ON public.imports_raw(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_imports_raw_passes_filter ON public.imports_raw(passes_filter);
CREATE INDEX IF NOT EXISTS idx_imports_raw_gin ON public.imports_raw USING gin (raw_data jsonb_path_ops);

-- Index pour registre_flux
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

-- Commentaires
COMMENT ON TABLE public.imports_raw IS 'Stocke toutes les lignes brutes importées (après filtrage métier) avec toutes les colonnes originales en JSONB';
COMMENT ON COLUMN public.imports_raw.raw_data IS 'Toutes les colonnes du fichier CSV original stockées en JSONB pour flexibilité';
COMMENT ON COLUMN public.imports_raw.passes_filter IS 'Indique si cette ligne passe les filtres métier (Origine, Chapitre, Sous-chapitre, Rubrique)';

COMMENT ON TABLE public.registre_flux IS 'Données traitées et structurées avec code déchet extrait (ou null si absent)';
COMMENT ON COLUMN public.registre_flux.raw_import_id IS 'Lien vers la ligne brute dans imports_raw pour traçabilité complète';
COMMENT ON COLUMN public.registre_flux.code_dechet IS 'Code déchet CED (6 chiffres) extrait depuis libellé ressource ou saisi manuellement';

