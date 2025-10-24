-- ============================================
-- SCHEMA COMPLET POUR FLUXMAT - TOUTES COLONNES EXCEL
-- ============================================

-- ============================================
-- TABLE 1 : DONNEES BRUTES (Import directe Excel)
-- ============================================
-- Contient TOUS les données importées directement du fichier Excel
-- Aucun nettoyage ou transformation

CREATE TABLE IF NOT EXISTS depenses_brutes (
  id BIGSERIAL PRIMARY KEY,
  
  code_entite TEXT,
  libelle_entite TEXT,
  code_project TEXT,
  code_chantier TEXT,
  libelle_chantier TEXT,
  date TEXT,
  origine TEXT,
  auteur_depense TEXT,
  code_fournisseur TEXT,
  libelle_fournisseur TEXT,
  code_complement_origine TEXT,
  libelle_complement_origine TEXT,
  code_ouvrage_origine TEXT,
  libelle_ouvrage_origine TEXT,
  code_complement_actuel TEXT,
  libelle_complement_actuel TEXT,
  code_ouvrage_actuel TEXT,
  libelle_ouvrage_actuel TEXT,
  auteur_ouvrage_modifie TEXT,
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
  ressource TEXT,
  libelle_ressource TEXT,
  unite TEXT,
  quantite DECIMAL,
  code_dechet TEXT,
  num_commande TEXT,
  num_reception TEXT,
  code_facture TEXT,
  code_ecriture TEXT,
  statut TEXT,
  pu DECIMAL,
  montant DECIMAL,
  date_chargement TEXT,
  modifie TEXT,
  auteur_commentaire TEXT,
  commentaire TEXT,
  auteur_valide TEXT,
  valide TEXT,
  code_utilisateur_recalage TEXT,
  date_traitement_recalage TEXT,
  statut_rapprochement_facture TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 2 : DONNEES PROPRES (Données nettoyées)
-- ============================================
-- Contient les données validées et structurées
-- Avec codes déchet standardisés et validation

CREATE TABLE IF NOT EXISTS depenses_completes (
  id BIGSERIAL PRIMARY KEY,
  brute_id BIGINT REFERENCES depenses_brutes(id),
  
  -- Codes standardisés pour la gestion des déchets
  code_dechet_standardise TEXT,
  categorie_dechet TEXT, -- Déblais | Matériau valorisé | etc.
  type_transport TEXT,   -- 03-Matériel interne (Eiffage) | 04-Matériel externe | 07-Sous-traitants
  
  code_entite TEXT,
  libelle_entite TEXT,
  code_project TEXT,
  code_chantier TEXT,
  libelle_chantier TEXT,
  date TEXT,
  origine TEXT,
  auteur_depense TEXT,
  code_fournisseur TEXT,
  libelle_fournisseur TEXT,
  code_complement_origine TEXT,
  libelle_complement_origine TEXT,
  code_ouvrage_origine TEXT,
  libelle_ouvrage_origine TEXT,
  code_complement_actuel TEXT,
  libelle_complement_actuel TEXT,
  code_ouvrage_actuel TEXT,
  libelle_ouvrage_actuel TEXT,
  auteur_ouvrage_modifie TEXT,
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
  ressource TEXT,
  libelle_ressource TEXT,
  unite TEXT,
  quantite DECIMAL,
  code_dechet TEXT,
  num_commande TEXT,
  num_reception TEXT,
  code_facture TEXT,
  code_ecriture TEXT,
  statut TEXT,
  pu DECIMAL,
  montant DECIMAL,
  date_chargement TEXT,
  modifie TEXT,
  auteur_commentaire TEXT,
  commentaire TEXT,
  auteur_valide TEXT,
  valide TEXT,
  code_utilisateur_recalage TEXT,
  date_traitement_recalage TEXT,
  statut_rapprochement_facture TEXT,
  
  -- Validation
  valide_qc BOOLEAN DEFAULT FALSE,
  commentaire_qc TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES POUR PERFORMANCES
-- ============================================

-- Indexes pour recherche et filtrage
CREATE INDEX IF NOT EXISTS idx_brutes_libelle_fournisseur ON depenses_brutes(libelle_fournisseur);
CREATE INDEX IF NOT EXISTS idx_brutes_libelle_nature_gestion ON depenses_brutes(libelle_nature_gestion);
CREATE INDEX IF NOT EXISTS idx_brutes_libelle_ressource ON depenses_brutes(libelle_ressource);
CREATE INDEX IF NOT EXISTS idx_brutes_montant ON depenses_brutes(montant);

CREATE INDEX IF NOT EXISTS idx_completes_libelle_fournisseur ON depenses_completes(libelle_fournisseur);
CREATE INDEX IF NOT EXISTS idx_completes_libelle_nature_gestion ON depenses_completes(libelle_nature_gestion);
CREATE INDEX IF NOT EXISTS idx_completes_libelle_ressource ON depenses_completes(libelle_ressource);
CREATE INDEX IF NOT EXISTS idx_completes_type_transport ON depenses_completes(type_transport);
CREATE INDEX IF NOT EXISTS idx_completes_categorie_dechet ON depenses_completes(categorie_dechet);
CREATE INDEX IF NOT EXISTS idx_completes_montant ON depenses_completes(montant);
CREATE INDEX IF NOT EXISTS idx_completes_valide_qc ON depenses_completes(valide_qc);

-- ============================================
-- DICTIONNAIRE DE DONNEES - MAPPAGES EXCEL
-- ============================================
-- RESSOURCES - Identification des types de flux:
-- Déblais = Ce qui sort des carrières
-- Pierre, Cailloux, Granulats = Ce qui rentre
--
-- NATURE DEPENSE GESTION - Types de transport:
-- 02-Matériaux = Fournitures matériaux
-- 03-Matériel interne = Transport par Eiffage
-- 04-Matériel externe = Transport par tiers (non Eiffage)
-- 07-Sous-traitants/Presta = Sous-traitance
