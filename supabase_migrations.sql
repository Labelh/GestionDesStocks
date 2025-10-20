-- Migration pour ajouter les colonnes de fournisseurs et liens de commande
-- À exécuter dans Supabase SQL Editor

-- Ajouter les colonnes pour les fournisseurs et liens de commande supplémentaires
ALTER TABLE products
ADD COLUMN IF NOT EXISTS order_link_1 TEXT,
ADD COLUMN IF NOT EXISTS supplier_1 TEXT,
ADD COLUMN IF NOT EXISTS order_link_2 TEXT,
ADD COLUMN IF NOT EXISTS supplier_2 TEXT,
ADD COLUMN IF NOT EXISTS order_link_3 TEXT,
ADD COLUMN IF NOT EXISTS supplier_3 TEXT;

-- Migrer les données existantes de order_link vers order_link_1
UPDATE products
SET order_link_1 = order_link
WHERE order_link IS NOT NULL AND order_link_1 IS NULL;

-- Note: La colonne order_link est conservée pour la rétrocompatibilité
