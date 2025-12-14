import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { useNotifications } from '../components/NotificationSystem';
import { Category, StorageZone } from '../types';
import { checkAndSendAlerts } from '../services/alertService';

const Settings: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, units, addUnit, deleteUnit, storageZones, addStorageZone, updateStorageZone, deleteStorageZone, currentUser, updateUserProfile, products, stockMovements } = useApp();
  const { addNotification } = useNotifications();

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newUnit, setNewUnit] = useState({ name: '', abbreviation: '', isDefault: false });
  const [newZone, setNewZone] = useState({ name: '', description: '' });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingZone, setEditingZone] = useState<StorageZone | null>(null);

  // Alertes settings
  const [alertEmail, setAlertEmail] = useState<string>('');
  const [enableStockAlerts, setEnableStockAlerts] = useState<boolean>(true);
  const [enableConsumptionAlerts, setEnableConsumptionAlerts] = useState<boolean>(true);
  const [isSavingAlerts, setIsSavingAlerts] = useState<boolean>(false);
  const [isTestingAlerts, setIsTestingAlerts] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser?.alertEmail) {
      setAlertEmail(currentUser.alertEmail);
    }
    if (currentUser?.enableStockAlerts !== undefined) {
      setEnableStockAlerts(currentUser.enableStockAlerts);
    }
    if (currentUser?.enableConsumptionAlerts !== undefined) {
      setEnableConsumptionAlerts(currentUser.enableConsumptionAlerts);
    }
  }, [currentUser]);

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

  const handleSaveAlerts = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAlerts(true);

    try {
      await updateUserProfile({
        alertEmail: alertEmail.trim() || undefined,
        enableStockAlerts,
        enableConsumptionAlerts
      });

      addNotification({
        type: 'success',
        title: 'Succès',
        message: 'Paramètres des alertes enregistrés avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des alertes:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la sauvegarde des paramètres'
      });
    } finally {
      setIsSavingAlerts(false);
    }
  };

  const handleTestAlerts = async () => {
    setIsTestingAlerts(true);

    try {
      console.log('🔔 Test manuel des alertes...');
      await checkAndSendAlerts(products, stockMovements);

      addNotification({
        type: 'success',
        title: 'Test effectué',
        message: 'Vérification des alertes terminée. Consultez la console (F12) pour les détails.'
      });
    } catch (error) {
      console.error('Erreur lors du test des alertes:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors du test des alertes'
      });
    } finally {
      setIsTestingAlerts(false);
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

      <div className="settings-section">
        <h2>Alertes Intelligentes</h2>
        <p className="section-description">
          Configurez les notifications par email pour être alerté des stocks faibles et des consommations inhabituelles
        </p>

        <form onSubmit={handleSaveAlerts} className="add-form">
          <div className="form-row" style={{ flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: '100%', maxWidth: '500px' }}>
              <label htmlFor="alertEmail" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Adresse email pour les alertes
              </label>
              <input
                id="alertEmail"
                type="email"
                placeholder="exemple@domaine.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label className="checkbox-label" style={{ fontSize: '0.95rem' }}>
                <input
                  type="checkbox"
                  checked={enableStockAlerts}
                  onChange={(e) => setEnableStockAlerts(e.target.checked)}
                />
                <div>
                  <strong>Alertes de stock</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Recevoir une notification lorsqu'un produit atteint son seuil minimum
                  </div>
                </div>
              </label>

              <label className="checkbox-label" style={{ fontSize: '0.95rem' }}>
                <input
                  type="checkbox"
                  checked={enableConsumptionAlerts}
                  onChange={(e) => setEnableConsumptionAlerts(e.target.checked)}
                />
                <div>
                  <strong>Alertes de consommation</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Recevoir une notification en cas de consommation inhabituelle d'un produit
                  </div>
                </div>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSavingAlerts}
              style={{ marginTop: '0.5rem' }}
            >
              {isSavingAlerts ? 'Enregistrement...' : 'Enregistrer les paramètres'}
            </button>

            <button
              type="button"
              onClick={handleTestAlerts}
              className="btn"
              disabled={isTestingAlerts}
              style={{
                marginTop: '0.5rem',
                marginLeft: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              {isTestingAlerts ? 'Test en cours...' : '🔔 Tester les alertes maintenant'}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-color)' }}>💡 Comment fonctionne le système :</strong>
            <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', lineHeight: '1.6' }}>
              <li>Vérification automatique toutes les heures (managers uniquement)</li>
              <li>Détection des stocks faibles (stock actuel ≤ stock minimum)</li>
              <li>Analyse des consommations inhabituelles (+50% sur 3 derniers jours)</li>
              <li>Emails envoyés uniquement si alertes activées et email configuré</li>
            </ul>
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              ℹ️ Utilisez le bouton "Tester" pour vérifier immédiatement sans attendre.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
