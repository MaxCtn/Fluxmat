-- Script SQL pour créer la table registre_v1 dans Supabase
-- À exécuter dans l'onglet SQL Editor de votre dashboard Supabase

-- Créer la table registre_v1
CREATE TABLE registre_v1 (
  id BIGSERIAL PRIMARY KEY,
  dateExpedition TEXT,
  quantite DECIMAL,
  codeUnite TEXT,
  denominationUsuelle TEXT,
  codeDechet TEXT,
  producteur_raisonSociale TEXT,
  producteur_adresse_libelle TEXT,
  destinataire_raisonSociale TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer des index pour améliorer les performances
CREATE INDEX idx_destinataire ON registre_v1(destinataire_raisonSociale);
CREATE INDEX idx_date ON registre_v1(dateExpedition);
CREATE INDEX idx_code_dechet ON registre_v1(codeDechet);

-- Activer Row Level Security (RLS) pour la sécurité
ALTER TABLE registre_v1 ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre la lecture et l'écriture
CREATE POLICY "Allow all operations on registre_v1" ON registre_v1
FOR ALL USING (true);

-- Vérifier que la table est créée
SELECT * FROM registre_v1 LIMIT 1;
