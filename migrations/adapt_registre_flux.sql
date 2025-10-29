-- ============================================================
-- Adaptation de la table registre_flux pour inclure toutes les colonnes conservées
-- ============================================================

-- Vérifier et ajouter les colonnes manquantes si nécessaire
DO $$
BEGIN
  -- Code Fournisseur
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registre_flux' 
    AND column_name = 'code_fournisseur'
  ) THEN
    ALTER TABLE public.registre_flux ADD COLUMN code_fournisseur bigint;
  END IF;

  -- Libellé Fournisseur (déjà présent sous 'exutoire' mais on garde les deux)
  -- Pas besoin d'ajouter, exutoire fait déjà le travail

  -- Num Commande
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registre_flux' 
    AND column_name = 'num_commande'
  ) THEN
    ALTER TABLE public.registre_flux ADD COLUMN num_commande text;
  END IF;

  -- Num Réception
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registre_flux' 
    AND column_name = 'num_reception'
  ) THEN
    ALTER TABLE public.registre_flux ADD COLUMN num_reception text;
  END IF;

  -- Code Facture
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registre_flux' 
    AND column_name = 'code_facture'
  ) THEN
    ALTER TABLE public.registre_flux ADD COLUMN code_facture text;
  END IF;

  -- PU (Prix Unitaire)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registre_flux' 
    AND column_name = 'pu'
  ) THEN
    ALTER TABLE public.registre_flux ADD COLUMN pu numeric;
  END IF;

  -- Montant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registre_flux' 
    AND column_name = 'montant'
  ) THEN
    ALTER TABLE public.registre_flux ADD COLUMN montant numeric;
  END IF;

  -- Colonnes comptables (optionnelles, pour référence)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registre_flux' 
    AND column_name = 'code_rubrique_comptable'
  ) THEN
    ALTER TABLE public.registre_flux ADD COLUMN code_rubrique_comptable bigint;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registre_flux' 
    AND column_name = 'libelle_rubrique_comptable'
  ) THEN
    ALTER TABLE public.registre_flux ADD COLUMN libelle_rubrique_comptable text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registre_flux' 
    AND column_name = 'code_chapitre_comptable'
  ) THEN
    ALTER TABLE public.registre_flux ADD COLUMN code_chapitre_comptable bigint;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registre_flux' 
    AND column_name = 'libelle_chapitre_comptable'
  ) THEN
    ALTER TABLE public.registre_flux ADD COLUMN libelle_chapitre_comptable text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registre_flux' 
    AND column_name = 'origine'
  ) THEN
    ALTER TABLE public.registre_flux ADD COLUMN origine text;
  END IF;
END $$;

-- Ajouter index si nécessaire
CREATE INDEX IF NOT EXISTS idx_registre_flux_code_fournisseur ON public.registre_flux(code_fournisseur);
CREATE INDEX IF NOT EXISTS idx_registre_flux_code_rubrique ON public.registre_flux(code_rubrique_comptable);

