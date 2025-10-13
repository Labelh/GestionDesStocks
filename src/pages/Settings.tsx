import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const Settings: React.FC = () => {
  const { categories, addCategory, deleteCategory, units, addUnit, deleteUnit } = useApp();

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newUnit, setNewUnit] = useState({ name: '', abbreviation: '', isDefault: false });

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
                      >
                        🗑️
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
                      >
                        🗑️
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
