-- ============================================================
-- Mise à jour des vues pour utiliser registre_flux + depenses_a_completer
-- au lieu de depenses_brutes
-- ============================================================

-- Vue unifiée pour toutes les dépenses filtrées (avec et sans code déchet)
DROP VIEW IF EXISTS public.v_depenses_filtrees_unifie;
CREATE OR REPLACE VIEW public.v_depenses_filtrees_unifie AS
SELECT 
  id,
  code_entite,
  libelle_entite,
  code_chantier,
  libelle_chantier,
  date_operation as date_expedition,
  origine,
  code_fournisseur,
  libelle_fournisseur,
  exutoire,
  code_rubrique_comptable,
  libelle_rubrique_comptable,
  code_chapitre_comptable,
  libelle_chapitre_comptable,
  code_sous_chapitre_comptable,
  libelle_sous_chapitre_comptable,
  libelle_nature_comptable,
  ressource,
  libelle_ressource,
  num_commande,
  num_reception,
  code_facture,
  unite,
  quantite,
  pu,
  montant,
  code_dechet,
  'registre_flux' as source_table,
  created_at,
  created_by
FROM public.registre_flux
WHERE code_dechet IS NOT NULL
UNION ALL
SELECT 
  id,
  code_entite,
  libelle_entite,
  code_chantier,
  libelle_chantier,
  date_operation as date_expedition,
  origine,
  code_fournisseur,
  libelle_fournisseur,
  exutoire,
  code_rubrique_comptable,
  libelle_rubrique_comptable,
  code_chapitre_comptable,
  libelle_chapitre_comptable,
  code_sous_chapitre_comptable,
  libelle_sous_chapitre_comptable,
  libelle_nature_comptable,
  ressource,
  libelle_ressource,
  num_commande,
  num_reception,
  code_facture,
  unite,
  quantite,
  pu,
  montant,
  code_dechet_propose as code_dechet,
  'depenses_a_completer' as source_table,
  created_at,
  created_by
FROM public.depenses_a_completer
WHERE status IN ('pending', 'a_categoriser', 'en_traitement');

-- Mise à jour de v_depenses_filtrees pour pointer vers la vue unifiée
DROP VIEW IF EXISTS public.v_depenses_filtrees;
CREATE OR REPLACE VIEW public.v_depenses_filtrees AS
SELECT *
FROM public.v_depenses_filtrees_unifie
WHERE origine <> 'Pointage personnel'
  AND libelle_chapitre_comptable IN (
    'MATERIAUX & CONSOMMABLES','MATERIEL','S/T & PRESTATAIRES','S/T PRODUITS NON SOUMIS A FGX'
  )
  AND COALESCE(libelle_sous_chapitre_comptable,'') NOT IN (
    'ACIERS','CONSOMMABLES','FRAIS ANNEXES MATERIEL'
  )
  AND libelle_rubrique_comptable IN (
    'Agregats','AMENAGT ESPACES VERT','Autres prestations','Balisage','Enrobes a froid','Fraisat',
    'Loc camions','Loc int. camions','Loc int. mat transport','Loc materiel de transport','Loc materiel divers',
    'Materiaux divers','Materiaux recycles','Mise decharge materiaux divers','Prestation environnement',
    'Produits de voirie','SABLE','Sous traitance tiers','STPD tiers','Traitement dechets inertes'
  );

-- Vue Transport (uniquement registre_flux avec code déchet)
-- Note: Les données de depenses_a_completer ne sont pas dans transport car pas encore validées
DROP VIEW IF EXISTS public.v_transport;
CREATE OR REPLACE VIEW public.v_transport AS
SELECT *
FROM public.registre_flux
WHERE libelle_chapitre_comptable = 'MATERIEL'
  AND libelle_rubrique_comptable IN ('Loc camions','Loc int. camions')
  AND code_dechet IS NOT NULL;

-- Vue Etablissements
DROP VIEW IF EXISTS public.v_etablissements;
CREATE OR REPLACE VIEW public.v_etablissements AS
SELECT DISTINCT
  code_entite as id,
  libelle_entite as label
FROM public.v_depenses_filtrees_unifie
WHERE code_entite IS NOT NULL
ORDER BY label;

-- Vue Chantiers
DROP VIEW IF EXISTS public.v_chantiers;
CREATE OR REPLACE VIEW public.v_chantiers AS
SELECT DISTINCT
  code_chantier as id,
  libelle_chantier as label,
  code_entite as etab_id
FROM public.v_depenses_filtrees_unifie
WHERE code_chantier IS NOT NULL
ORDER BY label;

-- Vue Numéros de Chantier
DROP VIEW IF EXISTS public.v_numeros_chantier;
CREATE OR REPLACE VIEW public.v_numeros_chantier AS
SELECT DISTINCT
  code_chantier as numero,
  code_chantier as id,
  code_chantier as chantier_id
FROM public.v_depenses_filtrees_unifie
WHERE code_chantier IS NOT NULL
ORDER BY numero;

