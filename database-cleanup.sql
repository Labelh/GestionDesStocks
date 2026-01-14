-- Migration pour nettoyer les champs max_stock et alert_email supprimés du code
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. Supprimer la vue products_with_thresholds qui dépend de max_stock
DROP VIEW IF EXISTS products_with_thresholds CASCADE;

-- 2. Supprimer la colonne max_stock de la table products avec CASCADE
ALTER TABLE products
DROP COLUMN IF EXISTS max_stock CASCADE;

-- 3. Supprimer la colonne max_stock de la table user_cart
ALTER TABLE user_cart
DROP COLUMN IF EXISTS max_stock;

-- 4. Supprimer les colonnes d'alerte email de la table user_profiles
ALTER TABLE user_profiles
DROP COLUMN IF EXISTS alert_email,
DROP COLUMN IF EXISTS enable_stock_alerts,
DROP COLUMN IF EXISTS enable_consumption_alerts;

-- 5. Vérifier que les tables sont correctes
-- Vous pouvez décommenter ces lignes pour vérifier
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'products';

-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'user_cart';

-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'user_profiles';
