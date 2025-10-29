-- Script SQL pour créer la table pending_imports dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase

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

-- Index pour recherche rapide par statut
CREATE INDEX IF NOT EXISTS idx_pending_imports_status ON public.pending_imports(status);
CREATE INDEX IF NOT EXISTS idx_pending_imports_created ON public.pending_imports(created_at DESC);

-- Commentaires
COMMENT ON TABLE public.pending_imports IS 'Stocks les imports en attente de complétion (Remplir plus tard)';
COMMENT ON COLUMN public.pending_imports.registre IS 'Lignes validées avec code déchet';
COMMENT ON COLUMN public.pending_imports.controle IS 'Lignes à compléter sans code déchet';

