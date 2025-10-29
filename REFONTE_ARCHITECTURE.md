# Refonte de l'architecture d'import - Documentation

## Résumé des modifications

Cette refonte implémente le nettoyage des colonnes et l'application des filtres directement lors de la transformation, avec une nouvelle architecture de base de données qui sépare les données selon leur statut (avec/sans code déchet).

## Modifications principales

### 1. Transformation des données (`lib/transform.ts`)

✅ **Fonction `cleanColumns()`** : Supprime automatiquement les colonnes inutiles et ne conserve que les colonnes listées dans `COLUMNS_TO_KEEP`.

✅ **Filtres appliqués avant nettoyage** : La fonction `passesFilter()` est appliquée AVANT le nettoyage des colonnes.

✅ **Nouveau type `DepenseCleaned`** : Type TypeScript pour les données nettoyées.

✅ **Résultat enrichi** : La fonction `transform()` retourne maintenant `{ registre, controle, cleaned }` où `cleaned` contient toutes les données nettoyées (même celles qui ne sont pas des matériaux).

### 2. Route de transformation (`app/api/transform/route.ts`)

✅ **Utilise la nouvelle fonction `transform()`** : Applique automatiquement filtres + nettoyage.

✅ **Retourne les données nettoyées** : Ajoute `cleaned` dans la réponse pour debug/inspection.

### 3. Nouvelles tables SQL

#### `depenses_a_completer` 
- Stocke les données sans code déchet valide
- Contient toutes les colonnes conservées
- Champ `status` : 'pending' | 'a_categoriser' | 'en_traitement' | 'valide'
- Champ `code_dechet_propose` : suggestion de code déchet
- Lien avec `pending_imports`

#### `registre_flux` (adaptée)
- Étendue avec les colonnes conservées manquantes
- Colonnes financières (pu, montant, num_commande, etc.)
- Colonnes comptables

### 4. Nouvelles vues SQL

✅ **`v_depenses_filtrees_unifie`** : Union de `registre_flux` + `depenses_a_completer`

✅ **`v_depenses_filtrees`** : Vue filtrée selon critères Power BI, basée sur la vue unifiée

✅ **Vues existantes mises à jour** : `v_transport`, `v_etablissements`, `v_chantiers`, `v_numeros_chantier`

### 5. Nouvelles routes API

✅ **`/api/db/save-registre`** : Sauvegarde vers `registre_flux` (données avec code déchet)

✅ **`/api/db/save-a-completer`** : Sauvegarde vers `depenses_a_completer` (données sans code déchet)

### 6. Routes API mises à jour

✅ **`/api/dashboard/filters`** : Utilise maintenant les vues `v_etablissements`, `v_chantiers`, `v_numeros_chantier`

✅ **`/api/dashboard/recent-imports`** : Utilise `v_depenses_filtrees_unifie` au lieu de `depenses_brutes`

### 7. Migration de `depenses_brutes`

✅ **Script de déprecation** : Renomme `depenses_brutes` en `depenses_brutes_deprecated` pour garder les données historiques.

## Colonnes conservées vs supprimées

### Colonnes conservées (COLUMNS_TO_KEEP)
- Code Entité, Libellé Entité
- Code Chantier, Libellé Chantier
- Date
- Origine
- Code Fournisseur, Libellé Fournisseur
- Code Rubrique Comptable, Libellé Rubrique Comptable
- Code Chapitre Comptable, Libellé Chapitre Comptable
- Code Sous-chapitre Comptable, Libellé Sous-chapitre Comptable
- Libellé Nature Comptable
- Ressource, Libellé Ressource
- Num Commande, Num Réception
- Code Facture
- Unité, Quantité, PU, Montant

### Colonnes supprimées (COLUMNS_TO_REMOVE)
- Code Project
- Auteur Depense
- Toutes les colonnes "*Gestion"
- Toutes les colonnes "*complément*" et "*ouvrage*"
- Colonnes d'audit (Auteur Commentaire, Commentaire, Valide, etc.)
- Code Ecriture, Statut, Date Chargement, Modifié, etc.

## Ordre d'exécution des migrations SQL

⚠️ **IMPORTANT** : Exécuter ces migrations dans l'ordre suivant sur Supabase :

1. `migrations/create_depenses_a_completer.sql` - Crée la nouvelle table
2. `migrations/adapt_registre_flux.sql` - Étend registre_flux
3. `migrations/update_views.sql` - Met à jour les vues
4. `migrations/deprecate_depenses_brutes.sql` - Déprécie l'ancienne table (optionnel)

## Utilisation

### Import d'un fichier Excel

1. **Transformation** : Le fichier est traité par `/api/transform`
   - Filtres Power BI appliqués
   - Colonnes inutiles supprimées
   - Séparation en `registre` (avec code) et `controle` (sans code)

2. **Sauvegarde** :
   - Les données avec code déchet → `/api/db/save-registre` → `registre_flux`
   - Les données sans code déchet → `/api/db/save-a-completer` → `depenses_a_completer`

### Consultation des données

Les vues SQL fournissent un accès unifié :
- `v_depenses_filtrees` : Toutes les données filtrées (avec + sans code)
- `v_transport` : Uniquement données validées avec codes déchets
- `v_etablissements`, `v_chantiers`, etc. : Vues de référence

## Fichiers à noter

- ✅ `lib/transform.ts` : Logique de transformation avec nettoyage
- ✅ `app/api/transform/route.ts` : Route de transformation
- ✅ `app/api/db/save-registre/route.ts` : Route de sauvegarde registre_flux
- ✅ `app/api/db/save-a-completer/route.ts` : Route de sauvegarde depenses_a_completer
- ⚠️ `app/api/db/filtered/route.ts` : Utilise encore `depenses_brutes` (à adapter si nécessaire)

## Tests recommandés

1. **Import d'un fichier Excel** : Vérifier que les colonnes sont nettoyées et les filtres appliqués
2. **Vérification des données** : Contrôler que les données avec code vont dans `registre_flux` et celles sans code dans `depenses_a_completer`
3. **Vérification des vues** : Tester que les vues fonctionnent correctement
4. **Compatibilité** : Vérifier que le frontend continue de fonctionner avec les nouvelles données

## Notes importantes

- ⚠️ La table `depenses_brutes` est maintenant dépréciée mais conservée (renommée)
- ⚠️ Les routes qui utilisent encore `depenses_brutes` ou `depenses_completes` devront être adaptées progressivement
- ✅ Les filtres Power BI sont maintenant appliqués côté code (pas uniquement en SQL)
- ✅ Les colonnes inutiles sont supprimées dès la transformation, allégeant la base de données

