-- Migration: Ajout du prix unitaire pour les produits
-- Date: 2025-10-16

-- Ajouter la colonne unit_price à la table products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0;

-- Commenter la colonne pour la documentation
COMMENT ON COLUMN products.unit_price IS 'Prix unitaire du produit (en devise locale). Utilisé pour les statistiques économiques.';
