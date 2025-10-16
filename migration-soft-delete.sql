-- Migration: Ajout de la suppression logique pour les produits
-- Date: 2025-10-16

-- Ajouter la colonne deleted_at à la table products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Ajouter un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

-- Commenter la colonne pour la documentation
COMMENT ON COLUMN products.deleted_at IS 'Date de suppression logique du produit. NULL si le produit est actif.';
