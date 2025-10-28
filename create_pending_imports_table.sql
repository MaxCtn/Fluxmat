-- Table pour stocker les imports en attente de complétion
create table if not exists fluxmat.pending_imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  user_id text,
  user_name text default 'Système',
  status text default 'pending',
  registre jsonb,
  controle jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index pour recherche rapide par statut
create index if not exists idx_pending_imports_status on fluxmat.pending_imports(status);
create index if not exists idx_pending_imports_created on fluxmat.pending_imports(created_at desc);

-- Commentaires
comment on table fluxmat.pending_imports is 'Stocks les imports en attente de complétion (Remplir plus tard)';
comment on column fluxmat.pending_imports.registre is 'Lignes validées avec code déchet';
comment on column fluxmat.pending_imports.controle is 'Lignes à compléter sans code déchet';

