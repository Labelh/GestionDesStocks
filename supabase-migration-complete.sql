-- Migration complète pour le workflow de réception
-- À exécuter dans le SQL Editor de Supabase

-- 1. Supprimer l'ancienne contrainte de validation du statut
ALTER TABLE exit_requests DROP CONSTRAINT IF EXISTS exit_requests_status_check;

-- 2. Ajouter la nouvelle contrainte avec le statut 'awaiting_reception'
ALTER TABLE exit_requests ADD CONSTRAINT exit_requests_status_check
  CHECK(status IN ('pending', 'awaiting_reception', 'approved', 'rejected'));

-- 3. Ajouter la colonne received_at si elle n'existe pas
ALTER TABLE exit_requests ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

-- 4. Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN exit_requests.received_at IS 'Date et heure de validation de la réception (passage à approved)';

-- 5. Ajouter la colonne order_link aux produits si elle n'existe pas
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_link TEXT;

-- 6. Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN products.order_link IS 'URL du fournisseur pour commander le produit';
