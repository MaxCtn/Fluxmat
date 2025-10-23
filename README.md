# FluxMat — MVP à onglets (Import • Contrôle • Export) + Synthèse/DB dans Import

- **Front**: Next.js + Tailwind (3 onglets)
- **Back**: /api/transform (parsing XLSX + transform)
- **Import**: 2 cartes
  1) **Synthèse par exutoire** (depuis le fichier en cours) — tri par exutoire (carrière), quantité & tonnage, "Voir +"
  2) **Base de données active** (Supabase) — même vue agrégée, avec "Voir +"

## Tables Supabase (SQL suggéré)
```sql
create table if not exists public.registre_v1 (
  id bigserial primary key,
  dateExpedition text,
  quantite numeric,
  codeUnite text,
  denominationUsuelle text,
  codeDechet text,
  producteur_raisonSociale text,
  producteur_adresse_libelle text,
  destinataire_raisonSociale text,
  created_at timestamp with time zone default now()
);
```

## ENV
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (lecture) — pour /api/db/summary & by-exutoire.
- `SUPABASE_SERVICE_ROLE` (écriture serveur) — pour /api/db/save.

## Déploiement Vercel
- Importer ce répertoire comme projet Next.js.
- Ajouter les variables ENV si tu veux activer la base. Sans ENV, la carte DB affiche “Supabase non configuré”.
