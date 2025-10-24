-- =========================================================
-- FLUXMAT — SCRIPT "COPIER/COLLER" SUPABASE (Postgres 15)
-- - Corrige 42P17 (row_hash via trigger au lieu de generated)
-- - Premier REFRESH non-CONCURRENTLY, suivants en CONCURRENTLY
-- - Policies avec 'authenticated'
-- =========================================================

-- Extensions utiles
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Schéma dédié
create schema if not exists fluxmat;

-- Enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'nature_gestion_enum') then
    create type fluxmat.nature_gestion_enum as enum (
      '02-Matériaux',
      '03-Matériel interne',
      '04-Matériel externe',
      '07-Sous-traitants/Presta'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'flux_sens_enum') then
    create type fluxmat.flux_sens_enum as enum ('ENTREE','SORTIE','INCONNU');
  end if;
end $$;

-- Helpers de classification (IMMUTABLE)
create or replace function fluxmat.f_guess_nature_gestion(lbl text)
returns fluxmat.nature_gestion_enum
language sql immutable as $$
  select case
    when lbl ilike '%02-%' or lbl ilike '%Matériaux%'           then '02-Matériaux'::fluxmat.nature_gestion_enum
    when lbl ilike '%03-%' or lbl ilike '%Matériel interne%'    then '03-Matériel interne'::fluxmat.nature_gestion_enum
    when lbl ilike '%04-%' or lbl ilike '%Matériel externe%'    then '04-Matériel externe'::fluxmat.nature_gestion_enum
    when lbl ilike '%07-%' or lbl ilike '%Sous-traitants%' or lbl ilike '%Presta%' then '07-Sous-traitants/Presta'::fluxmat.nature_gestion_enum
    else null
  end;
$$;

create or replace function fluxmat.f_guess_sens_flux(lbl text)
returns fluxmat.flux_sens_enum
language sql immutable as $$
  select case
    when lbl ~* '(déblai|deblai|déblais|deblais|terre|excavation)' then 'SORTIE'::fluxmat.flux_sens_enum
    when lbl ~* '(pierre|caillou|cailloux|granulat|grave|ballast|enrob)' then 'ENTREE'::fluxmat.flux_sens_enum
    else 'INCONNU'::fluxmat.flux_sens_enum
  end;
$$;

-- Alias d'exutoire (normalisation optionnelle)
create table if not exists fluxmat.exutoire_alias (
  id bigserial primary key,
  alias text not null,
  exutoire_canonique text not null,
  unique(alias)
);

create or replace function fluxmat.f_canonical_exutoire(nom text)
returns text
language sql stable as $$
  select coalesce(
    (select exutoire_canonique from fluxmat.exutoire_alias
      where unaccent(lower(alias)) = unaccent(lower(nom)) limit 1),
    nom
  );
$$;

-- Table BRUTE (import Excel direct)
create table if not exists fluxmat.depenses_brutes (
  id                bigserial primary key,

  code_entite       text,
  libelle_entite    text,
  code_project      text,
  code_chantier     text,
  libelle_chantier  text,
  date_piece        date,
  origine           text,
  auteur_depense    text,
  code_fournisseur  text,
  libelle_fournisseur text,

  code_complement_origine  text,
  libelle_complement_origine text,
  code_ouvrage_origine     text,
  libelle_ouvrage_origine  text,

  code_complement_actuel   text,
  libelle_complement_actuel text,
  code_ouvrage_actuel      text,
  libelle_ouvrage_actuel   text,

  auteur_ouvrage_modifie   text,

  code_rubrique_comptable  text,
  libelle_rubrique_comptable text,
  code_chapitre_comptable  text,
  libelle_chapitre_comptable text,
  code_sous_chapitre_comptable text,
  libelle_sous_chapitre_comptable text,
  nature_depense_comptable text,
  libelle_nature_comptable text,

  code_rubrique_gestion    text,
  libelle_rubrique_gestion text,
  code_chapitre_gestion    text,
  libelle_chapitre_gestion text,
  code_sous_chapitre_gestion text,
  libelle_sous_chapitre_gestion text,
  nature_depense_gestion   text,
  libelle_nature_gestion   text,

  ressource          text,
  libelle_ressource  text,

  num_commande       text,
  num_reception      text,
  code_facture       text,
  code_ecriture      text,

  statut             text,
  unite              text,
  quantite           numeric(18,6),
  pu                 numeric(18,6),
  montant            numeric(18,6) check (montant is null or montant >= 0),

  date_chargement    timestamptz,
  modifie            text,
  auteur_commentaire text,
  commentaire        text,
  auteur_valide      text,
  valide             text,
  code_utilisateur_recalage text,
  date_traitement_recalage  timestamptz,
  statut_rapprochement_facture text,

  -- plus de GENERATED ici (évite 42P17)
  row_hash           text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Trigger updated_at
create or replace function fluxmat.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_depenses_brutes_updated on fluxmat.depenses_brutes;
create trigger trg_depenses_brutes_updated
before update on fluxmat.depenses_brutes
for each row execute function fluxmat.tg_set_updated_at();

-- Trigger pour calculer row_hash (INSERT/UPDATE)
create or replace function fluxmat.tg_set_row_hash()
returns trigger language plpgsql as $$
declare
  s text;
begin
  s := coalesce(new.code_project,'')||'|'||
       coalesce(new.code_chantier,'')||'|'||
       coalesce(new.libelle_ressource,'')||'|'||
       coalesce(new.libelle_fournisseur,'')||'|'||
       coalesce(new.date_piece::text,'')||'|'||
       coalesce(new.montant::text,'');
  new.row_hash := md5(s);
  return new;
end $$;

drop trigger if exists trg_depenses_brutes_hash on fluxmat.depenses_brutes;
create trigger trg_depenses_brutes_hash
before insert or update on fluxmat.depenses_brutes
for each row execute function fluxmat.tg_set_row_hash();

-- Overrides (corrections manuelles)
create table if not exists fluxmat.depenses_overrides (
  depense_id   bigint primary key references fluxmat.depenses_brutes(id) on delete cascade,
  exutoire     text,
  nature_gestion fluxmat.nature_gestion_enum,
  sens_flux    fluxmat.flux_sens_enum,
  code_dechet  text,
  categorie_dechet text,
  note         text,
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_overrides_updated on fluxmat.depenses_overrides;
create trigger trg_overrides_updated
before update on fluxmat.depenses_overrides
for each row execute function fluxmat.tg_set_updated_at();

-- Mapping regex -> code déchet
create table if not exists fluxmat.code_dechet_mapping (
  id bigserial primary key,
  motif_regex text not null,
  code_dechet text not null,
  categorie   text,
  unique (motif_regex, code_dechet)
);

-- MV “PROPRE”
drop materialized view if exists fluxmat.mv_depenses_propres;

create materialized view fluxmat.mv_depenses_propres as
with base as (
  select
    b.*,
    fluxmat.f_guess_nature_gestion(b.libelle_nature_gestion) as nature_gestion_guess,
    fluxmat.f_guess_sens_flux(b.libelle_ressource)           as sens_flux_guess,
    fluxmat.f_canonical_exutoire(b.libelle_fournisseur)      as exutoire_guess
  from fluxmat.depenses_brutes b
)
select
  b.id as brute_id,
  coalesce(o.exutoire,       b.exutoire_guess)        as exutoire,
  coalesce(o.nature_gestion, b.nature_gestion_guess)  as nature_gestion,
  coalesce(o.sens_flux,      b.sens_flux_guess)        as sens_flux,

  coalesce(
    o.code_dechet,
    (select m.code_dechet
       from fluxmat.code_dechet_mapping m
      where b.libelle_ressource ~* m.motif_regex
      order by m.id asc
      limit 1)
  ) as code_dechet,

  coalesce(
    o.categorie_dechet,
    (select m.categorie
       from fluxmat.code_dechet_mapping m
      where b.libelle_ressource ~* m.motif_regex
      order by m.id asc
      limit 1)
  ) as categorie_dechet,

  b.code_entite, b.libelle_entite, b.code_project, b.code_chantier, b.libelle_chantier,
  b.date_piece, b.libelle_fournisseur,
  b.libelle_rubrique_gestion, b.libelle_nature_gestion,
  b.libelle_ressource, b.unite, b.quantite, b.pu, b.montant,
  b.row_hash, b.created_at, b.updated_at
from base b
left join fluxmat.depenses_overrides o on o.depense_id = b.id
with no data;

-- Index (dont unique pour refresh CONCURRENTLY après 1er refresh)
create unique index if not exists mv_depenses_propres_brute_id_uidx
on fluxmat.mv_depenses_propres (brute_id);

create index if not exists mv_propres_exutoire_idx on fluxmat.mv_depenses_propres (exutoire);
create index if not exists mv_propres_nature_idx   on fluxmat.mv_depenses_propres (nature_gestion);
create index if not exists mv_propres_sens_idx     on fluxmat.mv_depenses_propres (sens_flux);
create index if not exists mv_propres_date_idx     on fluxmat.mv_depenses_propres (date_piece);
create index if not exists mv_propres_montant_idx  on fluxmat.mv_depenses_propres (montant);

-- Vue projetée pour l’onglet
create or replace view fluxmat.v_fluxmat as
select
  brute_id as id,
  date_piece,
  exutoire,
  nature_gestion,
  sens_flux,
  code_dechet,
  categorie_dechet,
  libelle_chantier,
  libelle_fournisseur,
  libelle_ressource,
  unite, quantite, pu, montant
from fluxmat.mv_depenses_propres;

-- RPC: liste filtrée
create or replace function fluxmat.api_fluxmat_list(
  exutoires text[] default null,
  natures   fluxmat.nature_gestion_enum[] default null,
  sens      fluxmat.flux_sens_enum[] default null,
  search    text default null,
  dmin      date default null,
  dmax      date default null
)
returns setof fluxmat.v_fluxmat
language sql stable as $$
  select *
  from fluxmat.v_fluxmat v
  where (exutoires is null or v.exutoire = any(exutoires))
    and (natures   is null or v.nature_gestion = any(natures))
    and (sens      is null or v.sens_flux = any(sens))
    and (dmin is null or v.date_piece >= dmin)
    and (dmax is null or v.date_piece <  dmax + 1)
    and (
      search is null
      or unaccent(lower(v.libelle_ressource))  like unaccent(lower('%'||search||'%'))
      or unaccent(lower(v.libelle_fournisseur)) like unaccent(lower('%'||search||'%'))
    )
  order by coalesce(v.date_piece, date '1900-01-01') desc, v.id desc;
$$;

-- RPC: listes de filtres (exutoires / natures / sens + compteurs)
create or replace function fluxmat.api_fluxmat_filters()
returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'exutoires',
      coalesce((
        select jsonb_agg(jsonb_build_object('value',exutoire,'count',c))
        from (
          select exutoire, count(*) c
          from fluxmat.v_fluxmat
          group by exutoire
          order by exutoire
        ) t
      ), '[]'::jsonb),
    'natures',
      (
        select jsonb_agg(jsonb_build_object('value',nature_gestion::text,'count',count(*)) order by 1)
        from fluxmat.v_fluxmat
        group by nature_gestion
      ),
    'sens',
      (
        select jsonb_agg(jsonb_build_object('value',sens_flux::text,'count',count(*)) order by 1)
        from fluxmat.v_fluxmat
        group by sens_flux
      )
  );
$$;

-- Index BRUTE
create index if not exists brutes_row_hash_idx on fluxmat.depenses_brutes(row_hash);
create index if not exists brutes_lib_fourn_trgm on fluxmat.depenses_brutes using gin (libelle_fournisseur gin_trgm_ops);
create index if not exists brutes_lib_nat_gestion_idx on fluxmat.depenses_brutes(libelle_nature_gestion);
create index if not exists brutes_lib_ress_trgm on fluxmat.depenses_brutes using gin (libelle_ressource gin_trgm_ops);
create index if not exists brutes_montant_idx on fluxmat.depenses_brutes(montant);

-- RLS
alter table fluxmat.depenses_brutes       enable row level security;
alter table fluxmat.depenses_overrides    enable row level security;
alter table fluxmat.exutoire_alias        enable row level security;
alter table fluxmat.code_dechet_mapping   enable row level security;

-- Lecture pour utilisateurs authentifiés
drop policy if exists p_sel_brutes on fluxmat.depenses_brutes;
create policy p_sel_brutes on fluxmat.depenses_brutes
for select to authenticated using (true);

drop policy if exists p_sel_overrides on fluxmat.depenses_overrides;
create policy p_sel_overrides on fluxmat.depenses_overrides
for select to authenticated using (true);

drop policy if exists p_sel_alias on fluxmat.exutoire_alias;
create policy p_sel_alias on fluxmat.exutoire_alias
for select to authenticated using (true);

drop policy if exists p_sel_mapping on fluxmat.code_dechet_mapping;
create policy p_sel_mapping on fluxmat.code_dechet_mapping
for select to authenticated using (true);

-- Écriture (simple) pour authenticated (tu pourras durcir après)
drop policy if exists p_all_brutes on fluxmat.depenses_brutes;
create policy p_all_brutes on fluxmat.depenses_brutes
for all to authenticated using (true) with check (true);

drop policy if exists p_all_overrides on fluxmat.depenses_overrides;
create policy p_all_overrides on fluxmat.depenses_overrides
for all to authenticated using (true) with check (true);

drop policy if exists p_all_alias on fluxmat.exutoire_alias;
create policy p_all_alias on fluxmat.exutoire_alias
for all to authenticated using (true) with check (true);

drop policy if exists p_all_mapping on fluxmat.code_dechet_mapping;
create policy p_all_mapping on fluxmat.code_dechet_mapping
for all to authenticated using (true) with check (true);

-- ===== Premier peuplement de la MV =====
-- ⚠️ Le premier refresh NE DOIT PAS être CONCURRENTLY.
refresh materialized view fluxmat.mv_depenses_propres;
