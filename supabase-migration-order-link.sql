-- Migration pour ajouter le champ order_link à la table products

ALTER TABLE products ADD COLUMN IF NOT EXISTS order_link TEXT;

COMMENT ON COLUMN products.order_link IS 'Lien URL pour commander le produit';
