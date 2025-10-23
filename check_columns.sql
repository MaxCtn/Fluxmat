-- Script pour vérifier les colonnes de la table depenses_completes
-- À exécuter dans l'onglet SQL Editor de Supabase

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'depenses_completes' 
AND table_schema = 'public'
ORDER BY ordinal_position;
