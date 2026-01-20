/**
 * Service pour gérer les photos dans Supabase Storage
 * Les photos sont stockées dans le bucket 'product-photos'
 */

import { supabase } from './supabase';

const BUCKET_NAME = 'product-photos';

/**
 * Convertit une image base64 en Blob
 */
function base64ToBlob(base64: string): Blob {
  // Extraire le type MIME et les données
  const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Format base64 invalide');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Génère un nom de fichier unique pour un produit
 */
function generateFileName(productId: string): string {
  const timestamp = Date.now();
  return `${productId}_${timestamp}.jpg`;
}

/**
 * Upload une photo de produit vers Supabase Storage
 * @param productId - ID du produit
 * @param base64Image - Image en base64
 * @returns Le chemin du fichier dans le bucket (ou null en cas d'erreur)
 */
export async function uploadProductPhoto(
  productId: string,
  base64Image: string
): Promise<string | null> {
  try {
    const blob = base64ToBlob(base64Image);
    const fileName = generateFileName(productId);
    const filePath = `products/${fileName}`;

    // Supprimer l'ancienne photo si elle existe
    await deleteProductPhotosByProductId(productId);

    // Upload la nouvelle photo
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Erreur upload photo:', error);
      return null;
    }

    return filePath;
  } catch (error) {
    console.error('Erreur uploadProductPhoto:', error);
    return null;
  }
}

/**
 * Supprime toutes les photos d'un produit (par son ID)
 */
export async function deleteProductPhotosByProductId(productId: string): Promise<void> {
  try {
    // Lister les fichiers qui commencent par l'ID du produit
    const { data: files } = await supabase.storage
      .from(BUCKET_NAME)
      .list('products', {
        search: productId,
      });

    if (files && files.length > 0) {
      const filesToDelete = files
        .filter(f => f.name.startsWith(productId))
        .map(f => `products/${f.name}`);

      if (filesToDelete.length > 0) {
        await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
      }
    }
  } catch (error) {
    console.error('Erreur suppression photos:', error);
  }
}

/**
 * Supprime une photo par son chemin
 */
export async function deleteProductPhoto(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Erreur suppression photo:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Erreur deleteProductPhoto:', error);
    return false;
  }
}

/**
 * Obtient l'URL publique d'une photo
 * @param filePath - Chemin du fichier dans le bucket (ex: "products/abc123_1234567890.jpg")
 * @returns L'URL publique ou null
 */
export function getProductPhotoUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;

  // Si c'est déjà une URL complète ou du base64, le retourner tel quel
  if (filePath.startsWith('http') || filePath.startsWith('data:')) {
    return filePath;
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data?.publicUrl || null;
}

/**
 * Vérifie si une valeur est un chemin Storage (vs base64 ou URL)
 */
export function isStoragePath(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith('products/') && !value.startsWith('http') && !value.startsWith('data:');
}

/**
 * Vérifie si une valeur est du base64
 */
export function isBase64Image(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith('data:image/');
}

/**
 * Migration: Upload une photo base64 vers Storage et retourne le nouveau chemin
 */
export async function migratePhotoToStorage(
  productId: string,
  base64Photo: string
): Promise<{ success: boolean; newPath?: string; error?: string }> {
  try {
    // Vérifier que c'est bien du base64
    if (!isBase64Image(base64Photo)) {
      return { success: false, error: 'La photo n\'est pas en format base64' };
    }

    // Upload vers Storage
    const newPath = await uploadProductPhoto(productId, base64Photo);

    if (!newPath) {
      return { success: false, error: 'Échec de l\'upload vers Storage' };
    }

    return { success: true, newPath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Obtient des statistiques sur les photos
 */
export async function getStorageStats(): Promise<{
  totalFiles: number;
  error?: string;
}> {
  try {
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('products', { limit: 1000 });

    if (error) {
      return { totalFiles: 0, error: error.message };
    }

    return { totalFiles: files?.length || 0 };
  } catch (error) {
    return { totalFiles: 0, error: String(error) };
  }
}
