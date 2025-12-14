-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des catégories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des unités
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  abbreviation TEXT UNIQUE NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des zones de stockage
CREATE TABLE storage_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des produits
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL,
  designation TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  storage_zone_id UUID REFERENCES storage_zones(id),
  shelf INTEGER,
  position INTEGER,
  location TEXT NOT NULL,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  max_stock NUMERIC NOT NULL DEFAULT 0,
  unit_id UUID NOT NULL REFERENCES units(id),
  unit_price NUMERIC DEFAULT 0,
  photo TEXT,
  order_link TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des demandes de sortie
CREATE TABLE exit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  product_reference TEXT NOT NULL,
  product_designation TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  notes TEXT
);

-- Table des mouvements de stock
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  product_reference TEXT NOT NULL,
  product_designation TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK(movement_type IN ('entry', 'exit', 'adjustment', 'initial')),
  quantity NUMERIC NOT NULL,
  previous_stock NUMERIC NOT NULL,
  new_stock NUMERIC NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils utilisateurs (étend auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'manager')),
  badge_number TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_products_reference ON products(reference);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
CREATE INDEX idx_exit_requests_status ON exit_requests(status);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_timestamp ON stock_movements(timestamp);
CREATE INDEX idx_user_profiles_badge_number ON user_profiles(badge_number);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at sur products
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insérer les données par défaut
INSERT INTO categories (name, description) VALUES
  ('Électronique', 'Composants électroniques'),
  ('Mécanique', 'Pièces mécaniques'),
  ('Consommables', 'Produits consommables');

INSERT INTO units (name, abbreviation, is_default) VALUES
  ('Pièce', 'pcs', TRUE),
  ('Kilogramme', 'kg', FALSE),
  ('Litre', 'L', FALSE),
  ('Mètre', 'm', FALSE),
  ('Unité unique', 'unité', FALSE);

INSERT INTO storage_zones (name, description) VALUES
  ('Zone A', 'Entrepôt principal'),
  ('Zone B', 'Stockage secondaire'),
  ('Zone C', 'Réserve');

-- Politiques de sécurité RLS (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies pour les catégories (tout le monde peut lire, seuls les managers peuvent modifier)
CREATE POLICY "Tout le monde peut lire les catégories" ON categories FOR SELECT USING (true);
CREATE POLICY "Les managers peuvent tout faire sur les catégories" ON categories FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'manager'));

-- Policies pour les unités
CREATE POLICY "Tout le monde peut lire les unités" ON units FOR SELECT USING (true);
CREATE POLICY "Les managers peuvent tout faire sur les unités" ON units FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'manager'));

-- Policies pour les zones de stockage
CREATE POLICY "Tout le monde peut lire les zones" ON storage_zones FOR SELECT USING (true);
CREATE POLICY "Les managers peuvent tout faire sur les zones" ON storage_zones FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'manager'));

-- Policies pour les produits
CREATE POLICY "Tout le monde peut lire les produits" ON products FOR SELECT USING (true);
CREATE POLICY "Les managers peuvent tout faire sur les produits" ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'manager'));

-- Policies pour les demandes de sortie
CREATE POLICY "Tout le monde peut lire les demandes" ON exit_requests FOR SELECT USING (true);
CREATE POLICY "Les utilisateurs peuvent créer des demandes" ON exit_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Les managers peuvent tout faire sur les demandes" ON exit_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'manager'));

-- Policies pour les mouvements de stock
CREATE POLICY "Tout le monde peut lire les mouvements" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Les utilisateurs connectés peuvent créer des mouvements" ON stock_movements FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policies pour les profils
CREATE POLICY "Les utilisateurs peuvent lire tous les profils" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil" ON user_profiles FOR UPDATE
  USING (id = auth.uid());
