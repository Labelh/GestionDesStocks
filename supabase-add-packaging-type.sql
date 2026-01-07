-- Script SQL pour ajouter le champ packaging_type à la table products
-- Ce champ permet de distinguer les produits à l'unité ou en lot

-- Supprimer la colonne si elle existe déjà (pour réinitialiser)
ALTER TABLE products
DROP COLUMN IF EXISTS packaging_type;

-- Ajouter la colonne packaging_type
ALTER TABLE products
ADD COLUMN packaging_type VARCHAR(20) DEFAULT 'unit' CHECK (packaging_type IN ('unit', 'lot'));

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN products.packaging_type IS 'Type de conditionnement: unit (unité), lot (boîte/lot)';

-- Mettre à jour les produits existants avec des valeurs par défaut intelligentes
-- Les produits avec "boîte", "lot", "paquet" dans le nom → lot
UPDATE products
SET packaging_type = 'lot'
WHERE LOWER(designation) LIKE '%boîte%'
   OR LOWER(designation) LIKE '%boite%'
   OR LOWER(designation) LIKE '%lot%'
   OR LOWER(designation) LIKE '%paquet%'
   OR LOWER(designation) LIKE '%carton%';

-- Afficher un résumé
SELECT
  packaging_type,
  COUNT(*) as nombre_produits
FROM products
GROUP BY packaging_type
ORDER BY packaging_type;
