-- Script de vérification de la migration des alertes
-- Exécuter dans Supabase Dashboard > SQL Editor

-- 1. Vérifier si les colonnes existent
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
    AND column_name IN ('alert_email', 'enable_stock_alerts', 'enable_consumption_alerts')
ORDER BY column_name;

-- Si le résultat est vide, les colonnes n'existent pas encore!
-- Dans ce cas, exécutez la migration ci-dessous:

/*
-- MIGRATION À EXÉCUTER SI LES COLONNES N'EXISTENT PAS:
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS alert_email TEXT,
ADD COLUMN IF NOT EXISTS enable_stock_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS enable_consumption_alerts BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN user_profiles.alert_email IS 'Adresse email pour recevoir les alertes';
COMMENT ON COLUMN user_profiles.enable_stock_alerts IS 'Active/désactive les alertes de stock faible';
COMMENT ON COLUMN user_profiles.enable_consumption_alerts IS 'Active/désactive les alertes de consommation inhabituelle';
*/

-- 2. Vérifier les données actuelles des utilisateurs
SELECT
    id,
    username,
    name,
    role,
    alert_email,
    enable_stock_alerts,
    enable_consumption_alerts
FROM user_profiles
ORDER BY name;
