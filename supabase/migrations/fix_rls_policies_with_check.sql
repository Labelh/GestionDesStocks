-- ================================================================
-- CORRECTION DES POLICIES RLS - Ajout de WITH CHECK
-- ================================================================
-- Ce script corrige les policies qui empêchent les INSERT
-- Exécutez ce script dans Supabase SQL Editor
-- ================================================================

-- 1. CATEGORIES - Supprimer et recréer
DROP POLICY IF EXISTS "Modification categories managers" ON categories;

CREATE POLICY "Modification categories managers"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- 2. UNITS - Supprimer et recréer
DROP POLICY IF EXISTS "Modification units managers" ON units;

CREATE POLICY "Modification units managers"
  ON units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- 3. STORAGE_ZONES - Supprimer et recréer
DROP POLICY IF EXISTS "Modification zones managers" ON storage_zones;

CREATE POLICY "Modification zones managers"
  ON storage_zones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- 4. PRODUCTS - Supprimer et recréer
DROP POLICY IF EXISTS "Modification produits managers uniquement" ON products;

CREATE POLICY "Modification produits managers uniquement"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- 5. ORDERS - Supprimer et recréer
DROP POLICY IF EXISTS "Managers gèrent commandes" ON orders;

CREATE POLICY "Managers gèrent commandes"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ================================================================
-- TERMINÉ !
-- Si vous voyez "Success. No rows returned", c'est parfait !
-- ================================================================
