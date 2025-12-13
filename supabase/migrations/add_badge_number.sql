-- Migration: Ajout du champ badge_number pour l'authentification par badge

-- Ajouter la colonne badge_number à la table user_profiles
ALTER TABLE user_profiles
ADD COLUMN badge_number TEXT UNIQUE;

-- Créer un index pour améliorer les performances de recherche par badge
CREATE INDEX idx_user_profiles_badge_number ON user_profiles(badge_number);

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN user_profiles.badge_number IS 'Numéro de badge unique pour l''authentification par scan code-barre';
