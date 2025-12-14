-- Ajouter les colonnes pour les paramètres d'alertes à la table user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS alert_email TEXT,
ADD COLUMN IF NOT EXISTS enable_stock_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS enable_consumption_alerts BOOLEAN DEFAULT TRUE;

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN user_profiles.alert_email IS 'Adresse email pour recevoir les alertes (stocks faibles, consommations inhabituelles)';
COMMENT ON COLUMN user_profiles.enable_stock_alerts IS 'Active/désactive les alertes de stock faible';
COMMENT ON COLUMN user_profiles.enable_consumption_alerts IS 'Active/désactive les alertes de consommation inhabituelle';
