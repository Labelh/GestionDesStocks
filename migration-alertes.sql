-- Migration pour activer le système d'alertes
-- Exécuter dans Supabase Dashboard > SQL Editor

-- Ajouter les colonnes pour les paramètres d'alertes
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS alert_email TEXT,
ADD COLUMN IF NOT EXISTS enable_stock_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS enable_consumption_alerts BOOLEAN DEFAULT TRUE;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN user_profiles.alert_email IS 'Adresse email pour recevoir les alertes (stocks faibles, consommations inhabituelles)';
COMMENT ON COLUMN user_profiles.enable_stock_alerts IS 'Active/désactive les alertes de stock faible';
COMMENT ON COLUMN user_profiles.enable_consumption_alerts IS 'Active/désactive les alertes de consommation inhabituelle';

-- Vérifier que les colonnes ont bien été ajoutées
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
    AND column_name IN ('alert_email', 'enable_stock_alerts', 'enable_consumption_alerts')
ORDER BY column_name;
