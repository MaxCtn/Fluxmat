# Guide de Setup Supabase pour FluxMat

## Étapes d'installation

### 1. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Où trouver ces valeurs :**
- Allez dans votre projet Supabase > Settings > API
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `SUPABASE_SERVICE_ROLE_KEY` = service_role secret (clé privée)

### 2. Création des tables dans Supabase

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Exécutez le script `migrations/00_setup_complete.sql`

Ce script crée :
- `imports_raw` : Données brutes importées depuis les CSV
- `registre_flux` : Données traitées avec codes déchets
- `pending_imports` : Imports en attente de complétion

### 3. Vérification

Testez la connexion avec :

```bash
# Vérifier les variables d'environnement
curl http://localhost:3000/api/test-env

# Vérifier la connexion Supabase et les tables
curl http://localhost:3000/api/health

# Débugger Supabase (liste les tables et colonnes)
curl http://localhost:3000/api/debug/supabase
```

### 4. Test des endpoints

1. **Export** : Allez sur `/export` et testez l'export vers Supabase
2. **Contrôle** : Allez sur `/controle` et testez "Remplir plus tard"
3. **Tableau de bord** : Vérifiez que `/` affiche les données exportées

## Structure des tables

### registre_flux
Table principale pour les données exportées avec codes déchets validés.

Colonnes principales :
- `code_entite`, `libelle_entite` : Établissement/Agence
- `code_chantier`, `libelle_chantier` : Chantier
- `date_expedition` : Date d'export
- `quantite`, `unite` : Quantité et unité
- `libelle_ressource` : Description du matériau/déchet
- `code_dechet` : Code déchet CED (6 chiffres)
- `exutoire` : Destination finale

### pending_imports
Stocks les imports en attente de complétion.

- `registre` : Lignes validées (JSONB)
- `controle` : Lignes à compléter (JSONB)
- `status` : 'pending' par défaut

### imports_raw
Données brutes importées depuis les fichiers CSV (après filtrage métier).

- `raw_data` : Toutes les colonnes du CSV en JSONB
- `passes_filter` : Indique si la ligne passe les filtres métier

## Migrations existantes

- `00_setup_complete.sql` : Script complet d'initialisation (à exécuter en premier)
- `01_create_import_tables.sql` : Création tables imports_raw et registre_flux
- `02_create_indexes.sql` : Index de performance supplémentaires
- `adapt_registre_flux.sql` : Ajout de colonnes supplémentaires si nécessaire

