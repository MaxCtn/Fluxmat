-- ============================================================
-- Table: depenses_a_completer
-- Description: Données filtrées sans code déchet nécessitant complément
-- ============================================================

CREATE TABLE IF NOT EXISTS public.depenses_a_completer (
  id bigserial PRIMARY KEY,
  pending_import_id bigint REFERENCES public.pending_imports(id) ON DELETE SET NULL,
  
  -- Colonnes conservées (selon logique Power BI)
  code_entite bigint,
  libelle_entite text,
  code_chantier text,
  libelle_chantier text,
  date_operation date,
  origine text,
  code_fournisseur bigint,
  libelle_fournisseur text,
  code_rubrique_comptable bigint,
  libelle_rubrique_comptable text,
  code_chapitre_comptable bigint,
  libelle_chapitre_comptable text,
  code_sous_chapitre_comptable bigint,
  libelle_sous_chapitre_comptable text,
  libelle_nature_comptable text,
  ressource text,
  libelle_ressource text,
  num_commande text,
  num_reception text,
  code_facture text,
  unite text DEFAULT 'T',
  quantite numeric,
  pu numeric,
  montant numeric,
  
  -- Champs spécifiques pour le traitement
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'a_categoriser', 'en_traitement', 'valide')),
  code_dechet_propose text, -- Suggestion de code déchet
  exutoire text, -- Extrait depuis libelle_fournisseur
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'système'
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_depenses_a_completer_status ON public.depenses_a_completer(status);
CREATE INDEX IF NOT EXISTS idx_depenses_a_completer_chantier ON public.depenses_a_completer(code_entite, code_chantier);
CREATE INDEX IF NOT EXISTS idx_depenses_a_completer_created ON public.depenses_a_completer(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_depenses_a_completer_pending_import ON public.depenses_a_completer(pending_import_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_depenses_a_completer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trg_update_depenses_a_completer_updated_at ON public.depenses_a_completer;
CREATE TRIGGER trg_update_depenses_a_completer_updated_at
  BEFORE UPDATE ON public.depenses_a_completer
  FOR EACH ROW
  EXECUTE FUNCTION public.update_depenses_a_completer_updated_at();

