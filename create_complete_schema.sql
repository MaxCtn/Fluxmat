-- Script SQL pour créer la table complète des dépenses dans Supabase
-- À exécuter dans l'onglet SQL Editor de votre dashboard Supabase

-- Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS registre_v1 CASCADE;

-- Créer la nouvelle table complète
CREATE TABLE depenses_completes (
  id BIGSERIAL PRIMARY KEY,
  
  -- BU (Business Unit) - Code Entité
  code_entite TEXT,
  libelle_entite TEXT,
  
  -- Chantier (origine physique)
  code_project TEXT,
  code_chantier TEXT,
  libelle_chantier TEXT,
  
  -- Matériaux/Déchets
  ressource TEXT,
  libelle_ressource TEXT,
  unite TEXT,
  quantite DECIMAL,
  code_dechet TEXT,
  
  -- Exutoire (destinataire)
  code_fournisseur TEXT,
  libelle_fournisseur TEXT,
  
  -- Traçabilité financière
  date_expedition TEXT,
  num_commande TEXT,
  num_reception TEXT,
  code_facture TEXT,
  code_ecriture TEXT,
  statut TEXT,
  pu DECIMAL,
  montant DECIMAL,
  
  -- Contexte technique
  code_ouvrage_origine TEXT,
  libelle_ouvrage_origine TEXT,
  code_ouvrage_actuel TEXT,
  libelle_ouvrage_actuel TEXT,
  
  -- Compléments
  code_complement_origine TEXT,
  libelle_complement_origine TEXT,
  code_complement_actuel TEXT,
  libelle_complement_actuel TEXT,
  auteur_ouvrage_modifie TEXT,
  
  -- Comptabilité/Gestion
  code_rubrique_comptable TEXT,
  libelle_rubrique_comptable TEXT,
  code_chapitre_comptable TEXT,
  libelle_chapitre_comptable TEXT,
  code_sous_chapitre_comptable TEXT,
  libelle_sous_chapitre_comptable TEXT,
  nature_depense_comptable TEXT,
  libelle_nature_comptable TEXT,
  
  code_rubrique_gestion TEXT,
  libelle_rubrique_gestion TEXT,
  code_chapitre_gestion TEXT,
  libelle_chapitre_gestion TEXT,
  code_sous_chapitre_gestion TEXT,
  libelle_sous_chapitre_gestion TEXT,
  nature_depense_gestion TEXT,
  libelle_nature_gestion TEXT,
  
  -- Audit et workflow
  origine TEXT,
  auteur_depense TEXT,
  modifie TEXT,
  auteur_commentaire TEXT,
  commentaire TEXT,
  valide TEXT,
  auteur_valide TEXT,
  code_utilisateur_recalage TEXT,
  date_traitement_recalage TEXT,
  statut_rapprochement_facture TEXT,
  date_chargement TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_materiau BOOLEAN DEFAULT FALSE,
  is_exutoire_valide BOOLEAN DEFAULT FALSE
);

-- Créer des index pour les performances
CREATE INDEX idx_code_entite ON depenses_completes(code_entite);
CREATE INDEX idx_libelle_entite ON depenses_completes(libelle_entite);
CREATE INDEX idx_code_chantier ON depenses_completes(code_chantier);
CREATE INDEX idx_libelle_chantier ON depenses_completes(libelle_chantier);
CREATE INDEX idx_libelle_fournisseur ON depenses_completes(libelle_fournisseur);
CREATE INDEX idx_libelle_ressource ON depenses_completes(libelle_ressource);
CREATE INDEX idx_code_dechet ON depenses_completes(code_dechet);
CREATE INDEX idx_is_materiau ON depenses_completes(is_materiau);
CREATE INDEX idx_date_expedition ON depenses_completes(date_expedition);

-- Activer Row Level Security (RLS)
ALTER TABLE depenses_completes ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre toutes les opérations
CREATE POLICY "Allow all operations on depenses_completes" ON depenses_completes
FOR ALL USING (true) WITH CHECK (true);

-- Vérifier que la table est créée
SELECT 'Table depenses_completes créée avec succès' as status;
