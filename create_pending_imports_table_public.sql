-- Table pour stocker les imports en attente de complétion dans le schéma public
-- Compatible avec le schéma existant fourni par l'utilisateur

CREATE TABLE IF NOT EXISTS public.pending_imports (
  id bigint NOT NULL DEFAULT nextval('pending_imports_id_seq'::regclass),
  file_name text NOT NULL,
  user_id text,
  user_name text DEFAULT 'Système',
  status text DEFAULT 'pending',
  registre jsonb,
  controle jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pending_imports_pkey PRIMARY KEY (id)
);

-- Index pour recherche rapide par statut
CREATE INDEX IF NOT EXISTS idx_pending_imports_status ON public.pending_imports(status);
CREATE INDEX IF NOT EXISTS idx_pending_imports_created ON public.pending_imports(created_at DESC);

-- Séquence pour l'auto-incrémentation si elle n'existe pas
CREATE SEQUENCE IF NOT EXISTS public.pending_imports_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.pending_imports_id_seq OWNED BY public.pending_imports.id;

-- Commentaires
COMMENT ON TABLE public.pending_imports IS 'Stocks les imports en attente de complétion (Remplir plus tard)';
COMMENT ON COLUMN public.pending_imports.registre IS 'Lignes validées avec code déchet';
COMMENT ON COLUMN public.pending_imports.controle IS 'Lignes à compléter sans code déchet';

