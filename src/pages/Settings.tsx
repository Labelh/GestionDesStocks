import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { Category, StorageZone } from '../types';
import { supabase } from '../lib/supabase';
import { compressBase64Image } from '../lib/imageCompressor';
import * as offlineDB from '../lib/offlineDB';
import { migratePhotoToStorage, isBase64Image, getStorageStats } from '../lib/storageService';

const Settings: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, units, addUnit, deleteUnit, storageZones, addStorageZone, updateStorageZone, deleteStorageZone, currentUser } = useApp();

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newUnit, setNewUnit] = useState({ name: '', abbreviation: '', isDefault: false });
  const [newZone, setNewZone] = useState({ name: '', description: '' });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingZone, setEditingZone] = useState<StorageZone | null>(null);

  // État pour l'optimisation
  const [photoStats, setPhotoStats] = useState<{
    totalPhotos: number;
    totalSizeKo: number;
    compressedCount: number;
    uncompressedCount: number;
    loading: boolean;
  }>({ totalPhotos: 0, totalSizeKo: 0, compressedCount: 0, uncompressedCount: 0, loading: true });

  const [cacheStats, setCacheStats] = useState<{
    photosCount: number;
    loading: boolean;
  }>({ photosCount: 0, loading: true });

  const [compressionProgress, setCompressionProgress] = useState<{
    running: boolean;
    current: number;
    total: number;
    savedKo: number;
    errors: number;
  }>({ running: false, current: 0, total: 0, savedKo: 0, errors: 0 });

  const [migrationProgress, setMigrationProgress] = useState<{
    running: boolean;
    current: number;
    total: number;
    migrated: number;
    errors: number;
  }>({ running: false, current: 0, total: 0, migrated: 0, errors: 0 });

  const [storageStats, setStorageStats] = useState<{
    totalFiles: number;
    base64Count: number;
    storageCount: number;
    loading: boolean;
  }>({ totalFiles: 0, base64Count: 0, storageCount: 0, loading: true });

  // Charger les statistiques des photos au montage
  useEffect(() => {
    loadPhotoStats();
    loadCacheStats();
    loadStorageStats();
  }, []);

  const loadStorageStats = async () => {
    setStorageStats(prev => ({ ...prev, loading: true }));
    try {
      // D'abord récupérer uniquement les IDs des produits avec photo
      const { data: productIds, error: idsError } = await supabase
        .from('products')
        .select('id')
        .not('photo', 'is', null);

      if (idsError) throw idsError;

      let base64Count = 0;
      let storageCount = 0;

      // Charger les photos par lots de 10 pour éviter les timeouts
      const BATCH_SIZE = 10;
      const ids = productIds?.map(p => p.id) || [];

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('products')
          .select('id, photo')
          .in('id', batch);

        if (error) {
          console.warn('Erreur batch storage stats:', error);
          continue;
        }

        data?.forEach(p => {
          if (p.photo) {
            if (isBase64Image(p.photo)) {
              base64Count++;
            } else if (p.photo.startsWith('products/')) {
              storageCount++;
            }
          }
        });

        // Petit délai entre les lots
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Stats du Storage
      const stats = await getStorageStats();

      setStorageStats({
        totalFiles: stats.totalFiles,
        base64Count,
        storageCount,
        loading: false,
      });
    } catch (error) {
      console.error('Erreur chargement stats storage:', error);
      setStorageStats(prev => ({ ...prev, loading: false }));
    }
  };

  const loadPhotoStats = async () => {
    setPhotoStats(prev => ({ ...prev, loading: true }));
    try {
      // D'abord récupérer uniquement les IDs des produits avec photo
      const { data: productIds, error: idsError } = await supabase
        .from('products')
        .select('id')
        .not('photo', 'is', null);

      if (idsError) throw idsError;

      let totalSize = 0;
      let compressedCount = 0;
      let uncompressedCount = 0;
      let totalPhotos = 0;

      // Charger les photos par lots de 10 pour éviter les timeouts
      const BATCH_SIZE = 10;
      const ids = productIds?.map(p => p.id) || [];

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('products')
          .select('id, photo')
          .in('id', batch);

        if (error) {
          console.warn('Erreur batch photo stats:', error);
          continue;
        }

        data?.forEach(p => {
          if (p.photo) {
            totalPhotos++;
            // Seulement calculer la taille pour les photos base64
            if (isBase64Image(p.photo)) {
              const sizeBytes = p.photo.length * 0.75; // base64 est ~33% plus grand que les bytes réels
              totalSize += sizeBytes;

              // Considérer une photo comme "compressée" si elle fait moins de 100Ko
              if (sizeBytes < 100 * 1024) {
                compressedCount++;
              } else {
                uncompressedCount++;
              }
            } else {
              // Photo Storage = déjà optimisée
              compressedCount++;
            }
          }
        });

        // Petit délai entre les lots
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setPhotoStats({
        totalPhotos,
        totalSizeKo: Math.round(totalSize / 1024),
        compressedCount,
        uncompressedCount,
        loading: false,
      });
    } catch (error) {
      console.error('Erreur chargement stats photos:', error);
      setPhotoStats(prev => ({ ...prev, loading: false }));
    }
  };

  const loadCacheStats = async () => {
    setCacheStats(prev => ({ ...prev, loading: true }));
    try {
      const stats = await offlineDB.getPhotosCacheStats();
      setCacheStats({
        photosCount: stats.count,
        loading: false,
      });
    } catch (error) {
      console.error('Erreur chargement stats cache:', error);
      setCacheStats(prev => ({ ...prev, loading: false }));
    }
  };

  const compressAllPhotos = async () => {
    if (!window.confirm(
      'Cette opération va compresser toutes les photos de la base de données.\n\n' +
      'Cela peut prendre plusieurs minutes selon le nombre de photos.\n\n' +
      'Voulez-vous continuer ?'
    )) {
      return;
    }

    setCompressionProgress({ running: true, current: 0, total: 0, savedKo: 0, errors: 0 });

    try {
      // D'abord récupérer uniquement les IDs des produits avec photo
      const { data: productIds, error: idsError } = await supabase
        .from('products')
        .select('id')
        .not('photo', 'is', null);

      if (idsError) throw idsError;

      const ids = productIds?.map(p => p.id) || [];

      // Identifier les photos à compresser (charger par lots de 5)
      const toCompress: Array<{ id: string; photo: string }> = [];
      const BATCH_SIZE = 5;

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('products')
          .select('id, photo')
          .in('id', batch);

        if (error) {
          console.warn('Erreur batch identification:', error);
          continue;
        }

        data?.forEach(p => {
          if (p.photo && isBase64Image(p.photo)) {
            const sizeBytes = p.photo.length * 0.75;
            if (sizeBytes > 50 * 1024) { // Compresser si > 50Ko
              toCompress.push({ id: p.id, photo: p.photo });
            }
          }
        });

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setCompressionProgress(prev => ({ ...prev, total: toCompress.length }));

      if (toCompress.length === 0) {
        alert('Toutes les photos sont déjà optimisées !');
        setCompressionProgress({ running: false, current: 0, total: 0, savedKo: 0, errors: 0 });
        return;
      }

      let totalSaved = 0;
      let errorCount = 0;

      // Compresser une par une
      for (let i = 0; i < toCompress.length; i++) {
        const product = toCompress[i];

        try {
          const originalSize = product.photo.length;

          // Compresser l'image (max 600x600, qualité 70%)
          const compressedPhoto = await compressBase64Image(product.photo, {
            maxWidth: 600,
            maxHeight: 600,
            quality: 0.7,
          });

          const compressedSize = compressedPhoto.length;
          const savedBytes = (originalSize - compressedSize) * 0.75;

          // Ne mettre à jour que si on gagne au moins 10%
          if (compressedSize < originalSize * 0.9) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ photo: compressedPhoto })
              .eq('id', product.id);

            if (updateError) {
              console.error('Erreur mise à jour photo:', updateError);
              errorCount++;
            } else {
              totalSaved += savedBytes;
            }
          }
        } catch (err) {
          console.error('Erreur compression photo:', err);
          errorCount++;
        }

        setCompressionProgress(prev => ({
          ...prev,
          current: i + 1,
          savedKo: Math.round(totalSaved / 1024),
          errors: errorCount,
        }));

        // Petit délai pour ne pas surcharger
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Rafraîchir les stats
      await loadPhotoStats();

      // Vider le cache local pour forcer le re-téléchargement des nouvelles photos
      await offlineDB.clearAllCache();
      await loadCacheStats();

      alert(
        `Compression terminée !\n\n` +
        `Photos traitées: ${toCompress.length}\n` +
        `Espace économisé: ${Math.round(totalSaved / 1024)} Ko\n` +
        `Erreurs: ${errorCount}\n\n` +
        `Le cache local a été vidé pour charger les nouvelles photos.`
      );
    } catch (error) {
      console.error('Erreur compression:', error);
      alert('Erreur lors de la compression des photos');
    } finally {
      setCompressionProgress({ running: false, current: 0, total: 0, savedKo: 0, errors: 0 });
    }
  };

  const clearLocalCache = async () => {
    if (!window.confirm('Voulez-vous vider le cache local ?\n\nLes photos seront re-téléchargées au prochain chargement.')) {
      return;
    }

    try {
      await offlineDB.clearAllCache();
      await loadCacheStats();
      alert('Cache local vidé avec succès !');
    } catch (error) {
      console.error('Erreur vidage cache:', error);
      alert('Erreur lors du vidage du cache');
    }
  };

  const migratePhotosToStorage = async () => {
    if (!window.confirm(
      'Cette opération va migrer toutes les photos base64 vers Supabase Storage.\n\n' +
      'Avantages:\n' +
      '- Quota de stockage séparé (1 Go gratuit)\n' +
      '- Egress via CDN plus efficace\n' +
      '- Chargement plus rapide des images\n\n' +
      'IMPORTANT: Assurez-vous que le bucket "product-photos" existe dans Supabase Storage avec les politiques RLS appropriées.\n\n' +
      'Voulez-vous continuer ?'
    )) {
      return;
    }

    setMigrationProgress({ running: true, current: 0, total: 0, migrated: 0, errors: 0 });

    try {
      // D'abord récupérer uniquement les IDs des produits avec photo
      const { data: productIds, error: idsError } = await supabase
        .from('products')
        .select('id')
        .not('photo', 'is', null);

      if (idsError) throw idsError;

      const ids = productIds?.map(p => p.id) || [];

      // Identifier les photos base64 à migrer (charger par lots de 5)
      const toMigrate: Array<{ id: string; photo: string }> = [];
      const BATCH_SIZE = 5;

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('products')
          .select('id, photo')
          .in('id', batch);

        if (error) {
          console.warn('Erreur batch identification:', error);
          continue;
        }

        data?.forEach(p => {
          if (p.photo && isBase64Image(p.photo)) {
            toMigrate.push({ id: p.id, photo: p.photo });
          }
        });

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setMigrationProgress(prev => ({ ...prev, total: toMigrate.length }));

      if (toMigrate.length === 0) {
        alert('Toutes les photos sont déjà sur Storage !');
        setMigrationProgress({ running: false, current: 0, total: 0, migrated: 0, errors: 0 });
        return;
      }

      let migratedCount = 0;
      let errorCount = 0;

      // Migrer une par une
      for (let i = 0; i < toMigrate.length; i++) {
        const product = toMigrate[i];

        try {
          // Compresser d'abord si nécessaire (max 600x600, 70%)
          let photoToUpload = product.photo;
          if (product.photo.length > 100 * 1024) {
            try {
              photoToUpload = await compressBase64Image(product.photo, {
                maxWidth: 600,
                maxHeight: 600,
                quality: 0.7,
              });
            } catch {
              // En cas d'échec de compression, utiliser l'original
            }
          }

          // Migrer vers Storage
          const result = await migratePhotoToStorage(product.id, photoToUpload);

          if (result.success && result.newPath) {
            // Mettre à jour la BDD avec le nouveau chemin
            const { error: updateError } = await supabase
              .from('products')
              .update({ photo: result.newPath })
              .eq('id', product.id);

            if (updateError) {
              console.error('Erreur mise à jour BDD:', updateError);
              errorCount++;
            } else {
              migratedCount++;
            }
          } else {
            console.error('Erreur migration:', result.error);
            errorCount++;
          }
        } catch (err) {
          console.error('Erreur migration photo:', err);
          errorCount++;
        }

        setMigrationProgress(prev => ({
          ...prev,
          current: i + 1,
          migrated: migratedCount,
          errors: errorCount,
        }));

        // Petit délai pour ne pas surcharger
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Rafraîchir les stats
      await loadPhotoStats();
      await loadStorageStats();

      // Vider le cache local
      await offlineDB.clearAllCache();
      await loadCacheStats();

      alert(
        `Migration terminée !\n\n` +
        `Photos migrées: ${migratedCount}\n` +
        `Erreurs: ${errorCount}\n\n` +
        `Le cache local a été vidé.`
      );
    } catch (error) {
      console.error('Erreur migration:', error);
      alert('Erreur lors de la migration des photos');
    } finally {
      setMigrationProgress({ running: false, current: 0, total: 0, migrated: 0, errors: 0 });
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.name.trim()) {
      addCategory(newCategory);
      setNewCategory({ name: '', description: '' });
    }
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory && editingCategory.name.trim()) {
      updateCategory(editingCategory.id, { name: editingCategory.name, description: editingCategory.description });
      setEditingCategory(null);
    }
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUnit.name.trim() && newUnit.abbreviation.trim()) {
      addUnit(newUnit);
      setNewUnit({ name: '', abbreviation: '', isDefault: false });
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      deleteCategory(id);
    }
  };

  const handleDeleteUnit = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette unité ?')) {
      deleteUnit(id);
    }
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (newZone.name.trim()) {
      addStorageZone(newZone);
      setNewZone({ name: '', description: '' });
    }
  };

  const handleUpdateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingZone && editingZone.name.trim()) {
      updateStorageZone(editingZone.id, { name: editingZone.name, description: editingZone.description });
      setEditingZone(null);
    }
  };

  const handleDeleteZone = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) {
      deleteStorageZone(id);
    }
  };

  return (
    <div className="settings-page">
      <h1>Paramètres</h1>

      <div className="settings-section">
        <h2>Gestion des Catégories</h2>

        <form onSubmit={handleAddCategory} className="add-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Nom de la catégorie"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Description (optionnel)"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              className="form-input"
            />
            <button type="submit" className="btn btn-primary">
              Ajouter
            </button>
          </div>
        </form>

        <div className="items-list">
          {categories.length === 0 ? (
            <p className="no-data">Aucune catégorie</p>
          ) : (
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.id}>
                    {editingCategory?.id === category.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="form-input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingCategory.description || ''}
                            onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                            className="form-input"
                          />
                        </td>
                        <td>
                          <button
                            onClick={handleUpdateCategory}
                            className="btn-icon btn-edit"
                            title="Enregistrer"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="btn-icon btn-gray"
                            title="Annuler"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td><strong>{category.name}</strong></td>
                        <td>{category.description || '-'}</td>
                        <td>
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="btn-icon btn-edit"
                            title="Modifier"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9"/>
                              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="btn-icon btn-delete"
                            title="Supprimer"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                            </svg>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h2>Gestion des Unités</h2>
        <p className="section-description">
          Les unités permettent de définir comment mesurer vos stocks (pièces, kg, L, etc.)
        </p>

        <form onSubmit={handleAddUnit} className="add-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Nom de l'unité (ex: Kilogramme)"
              value={newUnit.name}
              onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Abréviation (ex: kg)"
              value={newUnit.abbreviation}
              onChange={(e) => setNewUnit({ ...newUnit, abbreviation: e.target.value })}
              className="form-input"
              style={{ maxWidth: '150px' }}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newUnit.isDefault}
                onChange={(e) => setNewUnit({ ...newUnit, isDefault: e.target.checked })}
              />
              Par défaut
            </label>
            <button type="submit" className="btn btn-primary">
              Ajouter
            </button>
          </div>
        </form>

        <div className="items-list">
          {units.length === 0 ? (
            <p className="no-data">Aucune unité</p>
          ) : (
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Abréviation</th>
                  <th>Par défaut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.map(unit => (
                  <tr key={unit.id}>
                    <td><strong>{unit.name}</strong></td>
                    <td>{unit.abbreviation}</td>
                    <td>{unit.isDefault ? '✓' : '-'}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="btn-icon btn-delete"
                        title="Supprimer"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h2>Gestion des Zones de Stockage</h2>
        <p className="section-description">
          Les zones de stockage permettent d'organiser vos produits par emplacement physique
        </p>

        <form onSubmit={handleAddZone} className="add-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Nom de la zone (ex: Zone A)"
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Description (optionnel)"
              value={newZone.description}
              onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
              className="form-input"
            />
            <button type="submit" className="btn btn-primary">
              Ajouter
            </button>
          </div>
        </form>

        <div className="items-list">
          {storageZones.length === 0 ? (
            <p className="no-data">Aucune zone de stockage</p>
          ) : (
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {storageZones.map(zone => (
                  <tr key={zone.id}>
                    {editingZone?.id === zone.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editingZone.name}
                            onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                            className="form-input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingZone.description || ''}
                            onChange={(e) => setEditingZone({ ...editingZone, description: e.target.value })}
                            className="form-input"
                          />
                        </td>
                        <td>
                          <button
                            onClick={handleUpdateZone}
                            className="btn-icon btn-edit"
                            title="Enregistrer"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingZone(null)}
                            className="btn-icon btn-gray"
                            title="Annuler"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td><strong>{zone.name}</strong></td>
                        <td>{zone.description || '-'}</td>
                        <td>
                          <button
                            onClick={() => setEditingZone(zone)}
                            className="btn-icon btn-edit"
                            title="Modifier"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9"/>
                              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteZone(zone.id)}
                            className="btn-icon btn-delete"
                            title="Supprimer"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                            </svg>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Section Optimisation - Visible uniquement pour les managers */}
      {currentUser?.role === 'manager' && (
        <div className="settings-section">
          <h2>Optimisation & Cache</h2>
          <p className="section-description">
            Outils pour optimiser la consommation de données et les performances
          </p>

          {/* Statistiques des photos */}
          <div style={{
            background: 'var(--hover-bg)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-color)' }}>
              Photos en base de données
            </h3>
            {photoStats.loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                    {photoStats.totalPhotos}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Photos totales</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
                    {photoStats.totalSizeKo > 1024
                      ? `${(photoStats.totalSizeKo / 1024).toFixed(1)} Mo`
                      : `${photoStats.totalSizeKo} Ko`}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Taille totale</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                    {photoStats.compressedCount}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Optimisées (&lt;100Ko)</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: photoStats.uncompressedCount > 0 ? '#f59e0b' : '#10b981' }}>
                    {photoStats.uncompressedCount}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>À optimiser (&gt;100Ko)</div>
                </div>
              </div>
            )}

            {/* Bouton de compression */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={compressAllPhotos}
                disabled={compressionProgress.running || photoStats.uncompressedCount === 0}
                className="btn btn-primary"
                style={{ position: 'relative', minWidth: '200px' }}
              >
                {compressionProgress.running ? (
                  <>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${compressionProgress.total > 0 ? (compressionProgress.current / compressionProgress.total) * 100 : 0}%`,
                      background: 'rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      transition: 'width 0.3s',
                    }} />
                    <span style={{ position: 'relative' }}>
                      {compressionProgress.current}/{compressionProgress.total} - {compressionProgress.savedKo} Ko économisés
                    </span>
                  </>
                ) : photoStats.uncompressedCount === 0 ? (
                  'Toutes les photos sont optimisées'
                ) : (
                  `Compresser ${photoStats.uncompressedCount} photos`
                )}
              </button>
              <button
                onClick={loadPhotoStats}
                disabled={photoStats.loading}
                className="btn btn-secondary"
              >
                Actualiser
              </button>
            </div>
          </div>

          {/* Statistiques du cache local */}
          <div style={{
            background: 'var(--hover-bg)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-color)' }}>
              Cache local (IndexedDB)
            </h3>
            {cacheStats.loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
            ) : (
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                    {cacheStats.photosCount}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Photos en cache</div>
                </div>
                <button
                  onClick={clearLocalCache}
                  className="btn btn-secondary"
                >
                  Vider le cache
                </button>
                <button
                  onClick={loadCacheStats}
                  disabled={cacheStats.loading}
                  className="btn btn-secondary"
                >
                  Actualiser
                </button>
              </div>
            )}
          </div>

          {/* Migration vers Storage */}
          <div style={{
            background: 'var(--hover-bg)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            border: storageStats.base64Count > 0 ? '2px solid #f59e0b' : '1px solid var(--border-color)',
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Migration vers Supabase Storage
              {storageStats.base64Count > 0 && (
                <span style={{
                  background: '#f59e0b',
                  color: 'white',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}>
                  RECOMMANDÉ
                </span>
              )}
            </h3>

            {storageStats.loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: storageStats.base64Count > 0 ? '#f59e0b' : '#10b981' }}>
                      {storageStats.base64Count}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Photos en BDD (base64)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                      {storageStats.storageCount}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Photos sur Storage</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                      {storageStats.totalFiles}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fichiers Storage</div>
                  </div>
                </div>

                {storageStats.base64Count > 0 && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    color: '#f59e0b',
                  }}>
                    <strong>Pourquoi migrer ?</strong> Les photos en base64 consomment l'egress de la BDD (5 Go/mois gratuit).
                    Le Storage a son propre quota (1 Go stockage + CDN optimisé).
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={migratePhotosToStorage}
                    disabled={migrationProgress.running || storageStats.base64Count === 0}
                    className="btn btn-primary"
                    style={{ position: 'relative', minWidth: '220px' }}
                  >
                    {migrationProgress.running ? (
                      <>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${migrationProgress.total > 0 ? (migrationProgress.current / migrationProgress.total) * 100 : 0}%`,
                          background: 'rgba(255,255,255,0.3)',
                          borderRadius: '8px',
                          transition: 'width 0.3s',
                        }} />
                        <span style={{ position: 'relative' }}>
                          {migrationProgress.current}/{migrationProgress.total} migrées
                        </span>
                      </>
                    ) : storageStats.base64Count === 0 ? (
                      'Toutes les photos sont sur Storage'
                    ) : (
                      `Migrer ${storageStats.base64Count} photos vers Storage`
                    )}
                  </button>
                  <button
                    onClick={loadStorageStats}
                    disabled={storageStats.loading}
                    className="btn btn-secondary"
                  >
                    Actualiser
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Conseils d'optimisation */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#3b82f6' }}>
              Conseils pour réduire la consommation Supabase
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li><strong>Storage :</strong> Migrez les photos vers Storage pour utiliser un quota séparé (1 Go gratuit).</li>
              <li><strong>Cache local :</strong> Les photos sont mises en cache dans le navigateur après le 1er chargement.</li>
              <li><strong>Compression :</strong> Compressez les photos existantes pour réduire leur taille de 50-80%.</li>
              <li><strong>CDN :</strong> Les photos sur Storage bénéficient du CDN de Supabase pour un chargement plus rapide.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
