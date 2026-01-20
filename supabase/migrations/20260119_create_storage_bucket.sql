-- =====================================================
-- Migration: Création du bucket Storage pour les photos
-- Date: 2026-01-19
-- =====================================================

-- 1. Créer le bucket pour les photos de produits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-photos',
  'product-photos',
  true,  -- Public pour permettre l'accès direct aux images
  5242880,  -- 5 Mo max par fichier
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Politique RLS: Permettre à tout le monde de VOIR les photos (public)
CREATE POLICY "Photos publiques en lecture"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-photos');

-- 3. Politique RLS: Seuls les utilisateurs authentifiés peuvent AJOUTER des photos
CREATE POLICY "Utilisateurs authentifiés peuvent ajouter"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-photos');

-- 4. Politique RLS: Seuls les utilisateurs authentifiés peuvent MODIFIER des photos
CREATE POLICY "Utilisateurs authentifiés peuvent modifier"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-photos');

-- 5. Politique RLS: Seuls les utilisateurs authentifiés peuvent SUPPRIMER des photos
CREATE POLICY "Utilisateurs authentifiés peuvent supprimer"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-photos');
