-- ================================================================
-- NETTOYAGE COMPLET DES POLICIES RLS
-- Supprime TOUS les doublons et recrée proprement
-- ================================================================

-- ================================================================
-- PARTIE 1: SUPPRESSION DE TOUTES LES POLICIES
-- ================================================================

-- CATEGORIES
DROP POLICY IF EXISTS "Lecture categories pour tous" ON categories;
DROP POLICY IF EXISTS "Les managers peuvent tout faire sur les catégories" ON categories;
DROP POLICY IF EXISTS "Modification categories managers" ON categories;
DROP POLICY IF EXISTS "Tout le monde peut lire les catégories" ON categories;

-- UNITS
DROP POLICY IF EXISTS "Lecture units pour tous" ON units;
DROP POLICY IF EXISTS "Les managers peuvent tout faire sur les unités" ON units;
DROP POLICY IF EXISTS "Modification units managers" ON units;
DROP POLICY IF EXISTS "Tout le monde peut lire les unités" ON units;

-- STORAGE_ZONES
DROP POLICY IF EXISTS "Lecture zones pour tous" ON storage_zones;
DROP POLICY IF EXISTS "Les managers peuvent tout faire sur les zones" ON storage_zones;
DROP POLICY IF EXISTS "Modification zones managers" ON storage_zones;
DROP POLICY IF EXISTS "Tout le monde peut lire les zones" ON storage_zones;

-- PRODUCTS
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;
DROP POLICY IF EXISTS "Lecture produits pour tous" ON products;
DROP POLICY IF EXISTS "Les managers peuvent tout faire sur les produits" ON products;
DROP POLICY IF EXISTS "Modification produits managers uniquement" ON products;
DROP POLICY IF EXISTS "Tout le monde peut lire les produits" ON products;
DROP POLICY IF EXISTS "Users can select all products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;

-- ORDERS
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent créer des commandes" ON orders;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent mettre à jour les
  co" ON orders;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent supprimer les commandes" ON orders;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent voir toutes les commande" ON orders;
DROP POLICY IF EXISTS "Managers gèrent commandes" ON orders;
DROP POLICY IF EXISTS "Managers voient commandes" ON orders;

-- EXIT_REQUESTS
DROP POLICY IF EXISTS "Les managers peuvent tout faire sur les demandes" ON exit_requests;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des demandes" ON exit_requests;
DROP POLICY IF EXISTS "Managers modifient demandes" ON exit_requests;
DROP POLICY IF EXISTS "Tout le monde peut lire les demandes" ON exit_requests;
DROP POLICY IF EXISTS "Utilisateurs créent des demandes" ON exit_requests;
DROP POLICY IF EXISTS "Utilisateurs voient leurs demandes" ON exit_requests;

-- PENDING_EXITS
DROP POLICY IF EXISTS "Création pending_exits authentifiés" ON pending_exits;
DROP POLICY IF EXISTS "Lecture pending_exits pour tous" ON pending_exits;
DROP POLICY IF EXISTS "Les managers peuvent lire tous les pending exits" ON pending_exits;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres pending exits" ON pending_exits;
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire leurs propres pending exits" ON pending_exits;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres pending exits" ON pending_exits;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres pending exits" ON pending_exits;
DROP POLICY IF EXISTS "Suppression pending_exits propres sorties" ON pending_exits;

-- STOCK_MOVEMENTS
DROP POLICY IF EXISTS "Création mouvements utilisateurs authentifiés" ON stock_movements;
DROP POLICY IF EXISTS "Lecture mouvements pour tous" ON stock_movements;
DROP POLICY IF EXISTS "Les utilisateurs connectés peuvent créer des mouvements" ON stock_movements;
DROP POLICY IF EXISTS "Tout le monde peut lire les mouvements" ON stock_movements;

-- USER_PROFILES
DROP POLICY IF EXISTS "Allow insert during signup" ON user_profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire tous les profils" ON user_profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur propre profil" ON user_profiles;
DROP POLICY IF EXISTS "Utilisateurs peuvent lire tous les profils" ON user_profiles;
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leur propre profil" ON user_profiles;

-- ================================================================
-- PARTIE 2: RECREATION DES POLICIES PROPRES
-- ================================================================

-- ----------------------------------------
-- USER_PROFILES
-- ----------------------------------------
CREATE POLICY "user_profiles_select"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "user_profiles_insert"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------
-- CATEGORIES
-- ----------------------------------------
CREATE POLICY "categories_select"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "categories_insert"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "categories_update"
  ON categories FOR UPDATE
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

CREATE POLICY "categories_delete"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ----------------------------------------
-- UNITS
-- ----------------------------------------
CREATE POLICY "units_select"
  ON units FOR SELECT
  USING (true);

CREATE POLICY "units_insert"
  ON units FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "units_update"
  ON units FOR UPDATE
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

CREATE POLICY "units_delete"
  ON units FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ----------------------------------------
-- STORAGE_ZONES
-- ----------------------------------------
CREATE POLICY "storage_zones_select"
  ON storage_zones FOR SELECT
  USING (true);

CREATE POLICY "storage_zones_insert"
  ON storage_zones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "storage_zones_update"
  ON storage_zones FOR UPDATE
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

CREATE POLICY "storage_zones_delete"
  ON storage_zones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ----------------------------------------
-- PRODUCTS
-- ----------------------------------------
CREATE POLICY "products_select"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "products_insert"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "products_update"
  ON products FOR UPDATE
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

CREATE POLICY "products_delete"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ----------------------------------------
-- ORDERS
-- ----------------------------------------
CREATE POLICY "orders_select"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "orders_insert"
  ON orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "orders_update"
  ON orders FOR UPDATE
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

CREATE POLICY "orders_delete"
  ON orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ----------------------------------------
-- EXIT_REQUESTS
-- ----------------------------------------
CREATE POLICY "exit_requests_select"
  ON exit_requests FOR SELECT
  USING (
    requested_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "exit_requests_insert"
  ON exit_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "exit_requests_update"
  ON exit_requests FOR UPDATE
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

CREATE POLICY "exit_requests_delete"
  ON exit_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ----------------------------------------
-- PENDING_EXITS
-- ----------------------------------------
CREATE POLICY "pending_exits_select"
  ON pending_exits FOR SELECT
  USING (true);

CREATE POLICY "pending_exits_insert"
  ON pending_exits FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pending_exits_update"
  ON pending_exits FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pending_exits_delete"
  ON pending_exits FOR DELETE
  USING (user_id = auth.uid());

-- ----------------------------------------
-- STOCK_MOVEMENTS
-- ----------------------------------------
CREATE POLICY "stock_movements_select"
  ON stock_movements FOR SELECT
  USING (true);

CREATE POLICY "stock_movements_insert"
  ON stock_movements FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ================================================================
-- TERMINÉ !
-- ================================================================
-- Si vous voyez "Success. No rows returned", c'est parfait !
--
-- Vérification : relancez la requête pg_policies pour confirmer
-- que chaque table n'a plus que 3-4 policies maximum.
-- ================================================================
