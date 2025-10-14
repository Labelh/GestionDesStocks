-- Migration pour ajouter la colonne received_at et le nouveau statut awaiting_reception
-- À exécuter dans le SQL Editor de Supabase

-- 1. Ajouter la colonne received_at si elle n'existe pas
ALTER TABLE exit_requests ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

-- 2. Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN exit_requests.received_at IS 'Date et heure de validation de la réception (passage à approved)';

-- 3. Note: Le statut 'awaiting_reception' sera géré au niveau applicatif
-- La colonne status accepte déjà des valeurs texte, donc pas besoin de modifier le type
