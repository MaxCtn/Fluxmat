# Migrations SQL - Refonte Architecture Import

Ce dossier contient les scripts de migration SQL pour la refonte de l'architecture d'import.

## Ordre d'exécution des migrations

**IMPORTANT** : Exécutez ces migrations dans l'ordre suivant :

1. `create_depenses_a_completer.sql` - Crée la nouvelle table pour les données sans code déchet
2. `adapt_registre_flux.sql` - Adapte la table registre_flux pour inclure toutes les colonnes conservées
3. `update_views.sql` - Met à jour les vues pour utiliser les nouvelles tables
4. `deprecate_depenses_brutes.sql` - Déprécie la table depenses_brutes (optionnel, peut être fait après tests)

## Description des migrations

### 1. create_depenses_a_completer.sql
Crée la table `depenses_a_completer` qui stocke :
- Les données filtrées (selon logique Power BI)
- Sans code déchet valide
- Avec status ('pending', 'a_categoriser', 'en_traitement', 'valide')
- Avec suggestion de code déchet

### 2. adapt_registre_flux.sql
Étend la table `registre_flux` existante pour inclure :
- Colonnes comptables (code_rubrique_comptable, libelle_rubrique_comptable, etc.)
- Colonnes financières (code_fournisseur, num_commande, num_reception, code_facture, pu, montant)
- Origine (pour vérifier les filtres)

### 3. update_views.sql
Met à jour les vues Supabase :
- `v_depenses_filtrees_unifie` : Vue unifiée de registre_flux + depenses_a_completer
- `v_depenses_filtrees` : Filtre la vue unifiée selon les critères Power BI
- `v_transport` : Uniquement registre_flux avec codes déchets
- `v_etablissements`, `v_chantiers`, `v_numeros_chantier` : Basées sur la vue unifiée

### 4. deprecate_depenses_brutes.sql
Renomme la table `depenses_brutes` en `depenses_brutes_deprecated` pour :
- Garder les données historiques
- Indiquer que la table n'est plus utilisée
- Permettre une suppression future si nécessaire

## Notes importantes

- Les filtres Power BI sont appliqués dans `lib/transform.ts` AVANT l'insertion en base
- Les colonnes sont nettoyées (supprimées/conservées) directement dans la transformation
- La table `depenses_brutes` n'est plus utilisée dans le nouveau flux
- Les données sont séparées en deux flux :
  - Avec code déchet → `registre_flux`
  - Sans code déchet → `depenses_a_completer`

## Vérification post-migration

Après avoir exécuté les migrations, vérifiez :

1. Que les tables existent :
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('depenses_a_completer', 'registre_flux', 'depenses_brutes_deprecated');
```

2. Que les vues fonctionnent :
```sql
SELECT COUNT(*) FROM v_depenses_filtrees;
SELECT COUNT(*) FROM v_transport;
```

3. Que les triggers sont actifs :
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%depenses_a_completer%';
```

