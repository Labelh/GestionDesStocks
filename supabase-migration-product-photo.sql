-- Migration pour ajouter la colonne product_photo à la table exit_requests
-- Cette colonne permet de stocker l'URL de la photo du produit pour affichage dans les demandes de sortie

-- Ajouter la colonne product_photo
ALTER TABLE exit_requests
ADD COLUMN IF NOT EXISTS product_photo TEXT;

-- Commentaire pour documentation
COMMENT ON COLUMN exit_requests.product_photo IS 'URL de la photo du produit pour affichage dans les demandes';
