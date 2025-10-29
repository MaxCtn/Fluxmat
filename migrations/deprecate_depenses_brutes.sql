-- ============================================================
-- Script de déprecation de la table depenses_brutes
-- Note: Cette table n'est plus utilisée dans la nouvelle architecture
-- ============================================================

-- Option 1: Renommer la table pour indiquer qu'elle est dépréciée
-- (Permet de garder les données historiques si nécessaire)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'depenses_brutes'
  ) THEN
    -- Renommer la table
    ALTER TABLE IF EXISTS public.depenses_brutes 
    RENAME TO depenses_brutes_deprecated;
    
    -- Commenter la table pour documentation
    COMMENT ON TABLE public.depenses_brutes_deprecated IS 
      'Table dépréciée - Remplacée par registre_flux et depenses_a_completer. Ne plus utiliser.';
      
    RAISE NOTICE 'Table depenses_brutes renommée en depenses_brutes_deprecated';
  ELSE
    RAISE NOTICE 'Table depenses_brutes n''existe pas, aucune action nécessaire';
  END IF;
END $$;

-- Option 2: Si vous voulez vraiment supprimer la table (commenté par défaut)
-- ATTENTION: Cette action est irréversible!
/*
DROP TABLE IF EXISTS public.depenses_brutes CASCADE;
DROP TRIGGER IF EXISTS trg_depenses_brutes_dedup ON public.depenses_brutes;
DROP FUNCTION IF EXISTS public.compute_depenses_brutes_dedup() CASCADE;
*/

-- Vérifier qu'il n'y a plus de références à depenses_brutes dans le code
-- Les vues ont déjà été mises à jour pour utiliser registre_flux et depenses_a_completer

