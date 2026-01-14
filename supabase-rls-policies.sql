-- ================================================================
-- SCRIPT D'ACTIVATION ROW LEVEL SECURITY (RLS)
-- Gestion des Stocks - Protection des données
-- ================================================================
--
-- CE SCRIPT ACTIVE LA SÉCURITÉ AU NIVEAU DES LIGNES
-- Chaque utilisateur ne pourra voir que les données auxquelles il a droit
--
-- INSTRUCTIONS :
-- 1. Ouvrez Supabase : https://app.supabase.com
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez ce script complet
-- 4. Cliquez sur "Run" (ou Ctrl+Enter)
--
-- Durée : ~5 secondes
-- ================================================================

-- ================================================================
-- PARTIE 1 : ACTIVER RLS SUR TOUTES LES TABLES
-- ================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_exits ENABLE ROW LEVEL SECURITY;

-- Note: user_cart a déjà RLS activé depuis sa création

-- ================================================================
-- PARTIE 2 : POLITIQUES POUR USER_PROFILES
-- ================================================================

-- Tout le monde peut lire tous les profils (pour afficher noms, etc.)
CREATE POLICY "Utilisateurs peuvent lire tous les profils"
  ON user_profiles FOR SELECT
  USING (true);

-- Mais on ne peut modifier QUE son propre profil
CREATE POLICY "Utilisateurs peuvent modifier leur propre profil"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ================================================================
-- PARTIE 3 : POLITIQUES POUR PRODUCTS
-- ================================================================

-- Tout le monde peut voir les produits (users et managers)
CREATE POLICY "Lecture produits pour tous"
  ON products FOR SELECT
  USING (true);

-- Seuls les MANAGERS peuvent créer/modifier/supprimer des produits
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

-- ================================================================
-- PARTIE 4 : POLITIQUES POUR STOCK_MOVEMENTS
-- ================================================================

-- Tout le monde peut lire l'historique des mouvements
CREATE POLICY "Lecture mouvements pour tous"
  ON stock_movements FOR SELECT
  USING (true);

-- Les utilisateurs authentifiés peuvent créer des mouvements
-- (vérifie que user_id correspond à l'utilisateur connecté)
CREATE POLICY "Création mouvements utilisateurs authentifiés"
  ON stock_movements FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- ================================================================
-- PARTIE 5 : POLITIQUES POUR EXIT_REQUESTS
-- ================================================================

-- Les utilisateurs voient LEURS demandes
-- Les managers voient TOUTES les demandes
CREATE POLICY "Utilisateurs voient leurs demandes"
  ON exit_requests FOR SELECT
  USING (
    auth.uid()::text = requested_by::text OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Les utilisateurs peuvent créer leurs propres demandes
CREATE POLICY "Utilisateurs créent des demandes"
  ON exit_requests FOR INSERT
  WITH CHECK (auth.uid()::text = requested_by::text);

-- Les managers peuvent modifier toutes les demandes (approuver/rejeter)
CREATE POLICY "Managers modifient demandes"
  ON exit_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ================================================================
-- PARTIE 6 : POLITIQUES POUR ORDERS (Commandes)
-- ================================================================

-- Seuls les managers peuvent voir et gérer les commandes
CREATE POLICY "Managers voient commandes"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

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
-- PARTIE 7 : POLITIQUES POUR CATEGORIES
-- ================================================================

-- Tout le monde peut lire les catégories
CREATE POLICY "Lecture categories pour tous"
  ON categories FOR SELECT
  USING (true);

-- Seuls les managers peuvent modifier les catégories
-- WITH CHECK est requis pour les INSERT
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

-- ================================================================
-- PARTIE 8 : POLITIQUES POUR UNITS (Unités de mesure)
-- ================================================================

-- Tout le monde peut lire les unités
CREATE POLICY "Lecture units pour tous"
  ON units FOR SELECT
  USING (true);

-- Seuls les managers peuvent modifier les unités
-- WITH CHECK est requis pour les INSERT
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

-- ================================================================
-- PARTIE 9 : POLITIQUES POUR STORAGE_ZONES
-- ================================================================

-- Tout le monde peut lire les zones de stockage
CREATE POLICY "Lecture zones pour tous"
  ON storage_zones FOR SELECT
  USING (true);

-- Seuls les managers peuvent modifier les zones
-- WITH CHECK est requis pour les INSERT
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

-- ================================================================
-- PARTIE 10 : POLITIQUES POUR PENDING_EXITS
-- ================================================================

-- Tout le monde peut lire les sorties en attente
CREATE POLICY "Lecture pending_exits pour tous"
  ON pending_exits FOR SELECT
  USING (true);

-- Les utilisateurs authentifiés peuvent créer des sorties
CREATE POLICY "Création pending_exits authentifiés"
  ON pending_exits FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Les utilisateurs peuvent supprimer leurs propres sorties en attente
CREATE POLICY "Suppression pending_exits propres sorties"
  ON pending_exits FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ================================================================
-- TERMINÉ !
-- ================================================================
--
-- Si vous voyez "Success. No rows returned", c'est parfait !
--
-- VÉRIFICATION :
-- 1. Allez dans Table Editor > n'importe quelle table
-- 2. Cliquez sur "RLS enabled" - devrait être vert/activé
-- 3. Testez votre application - tout devrait fonctionner normalement
--
-- EN CAS D'ERREUR :
-- - "policy already exists" : Normal, vous pouvez ignorer
-- - "permission denied" : Vérifiez que vous êtes bien admin du projet
-- - Autre erreur : Copiez-moi le message exact
-- ================================================================
