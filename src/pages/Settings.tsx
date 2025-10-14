import React, { useState } from 'react';
import { useApp } from '../context/AppContextSupabase';

const Settings: React.FC = () => {
  const { categories, addCategory, deleteCategory, units, addUnit, deleteUnit, storageZones, addStorageZone, deleteStorageZone } = useApp();

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newUnit, setNewUnit] = useState({ name: '', abbreviation: '', isDefault: false });
  const [newZone, setNewZone] = useState({ name: '', description: '' });

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.name.trim()) {
      addCategory(newCategory);
      setNewCategory({ name: '', description: '' });
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
                    <td><strong>{category.name}</strong></td>
                    <td>{category.description || '-'}</td>
                    <td>
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
                    <td><strong>{zone.name}</strong></td>
                    <td>{zone.description || '-'}</td>
                    <td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
