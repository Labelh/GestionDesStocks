-- Table pour stocker le panier de chaque utilisateur
-- Permet la synchronisation du panier entre différents appareils

CREATE TABLE IF NOT EXISTS user_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_reference TEXT NOT NULL,
  product_designation TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  max_stock NUMERIC NOT NULL,
  photo TEXT,
  storage_zone TEXT,
  shelf INTEGER,
  position INTEGER,
  unit TEXT,
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_cart_user_id ON user_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cart_product_id ON user_cart(product_id);

-- RLS (Row Level Security) pour que chaque utilisateur ne puisse voir que son propre panier
ALTER TABLE user_cart ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent lire leur propre panier
CREATE POLICY "Les utilisateurs peuvent lire leur propre panier"
  ON user_cart
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Les utilisateurs peuvent insérer dans leur propre panier
CREATE POLICY "Les utilisateurs peuvent insérer dans leur propre panier"
  ON user_cart
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Les utilisateurs peuvent mettre à jour leur propre panier
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre panier"
  ON user_cart
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Les utilisateurs peuvent supprimer de leur propre panier
CREATE POLICY "Les utilisateurs peuvent supprimer de leur propre panier"
  ON user_cart
  FOR DELETE
  USING (user_id = auth.uid());

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_user_cart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS trigger_update_user_cart_updated_at ON user_cart;
CREATE TRIGGER trigger_update_user_cart_updated_at
  BEFORE UPDATE ON user_cart
  FOR EACH ROW
  EXECUTE FUNCTION update_user_cart_updated_at();
