-- Migration: Ajout de la table pending_exits pour persister les sorties en attente
-- Cette table permet de conserver les articles dans le panier même après déconnexion

-- Table des sorties en attente (panier)
CREATE TABLE IF NOT EXISTS pending_exits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_reference TEXT NOT NULL,
  product_designation TEXT NOT NULL,
  storage_zone TEXT,
  shelf INTEGER,
  position INTEGER,
  quantity NUMERIC NOT NULL,
  requested_by TEXT NOT NULL,
  reason TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_pending_exits_user ON pending_exits(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_exits_added_at ON pending_exits(added_at);

-- Activer Row Level Security
ALTER TABLE pending_exits ENABLE ROW LEVEL SECURITY;

-- Policies: Les utilisateurs ne peuvent voir et gérer que leurs propres pending_exits
CREATE POLICY "Les utilisateurs peuvent lire leurs propres pending exits"
  ON pending_exits
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent créer leurs propres pending exits"
  ON pending_exits
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres pending exits"
  ON pending_exits
  FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres pending exits"
  ON pending_exits
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Les managers peuvent voir tous les pending exits
CREATE POLICY "Les managers peuvent lire tous les pending exits"
  ON pending_exits
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'manager'));
