-- Migration pour ajouter le champ unit_price (prix unitaire) aux produits
-- À exécuter dans l'éditeur SQL de Supabase

-- Ajouter la colonne unit_price à la table products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2);

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN products.unit_price IS 'Prix unitaire du produit pour les statistiques économiques';
