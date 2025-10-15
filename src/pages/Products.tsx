import React, { useState } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { Product } from '../types';

const Products: React.FC = () => {
  const { products, updateProduct, deleteProduct, categories, units, storageZones } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    // Copier tous les champs du produit
    setEditFormData({
      designation: product.designation,
      category: product.category,
      storageZone: product.storageZone,
      shelf: product.shelf,
      position: product.position,
      currentStock: product.currentStock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      unit: product.unit,
      orderLink: product.orderLink || '',
      photo: product.photo || '',
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData({ ...editFormData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    try {
      const updates: Partial<Product> = {};

      // Collecter uniquement les champs modifiés
      if (editFormData.designation !== undefined && editFormData.designation !== editingProduct.designation) {
        updates.designation = editFormData.designation;
      }
      if (editFormData.category !== undefined && editFormData.category !== editingProduct.category) {
        updates.category = editFormData.category;
      }
      if (editFormData.storageZone !== undefined && editFormData.storageZone !== editingProduct.storageZone) {
        updates.storageZone = editFormData.storageZone;
      }
      if (editFormData.shelf !== undefined && editFormData.shelf !== editingProduct.shelf) {
        updates.shelf = editFormData.shelf;
      }
      if (editFormData.position !== undefined && editFormData.position !== editingProduct.position) {
        updates.position = editFormData.position;
      }
      if (editFormData.currentStock !== undefined && editFormData.currentStock !== editingProduct.currentStock) {
        updates.currentStock = editFormData.currentStock;
      }
      if (editFormData.minStock !== undefined && editFormData.minStock !== editingProduct.minStock) {
        updates.minStock = editFormData.minStock;
      }
      if (editFormData.maxStock !== undefined && editFormData.maxStock !== editingProduct.maxStock) {
        updates.maxStock = editFormData.maxStock;
      }
      if (editFormData.unit !== undefined && editFormData.unit !== editingProduct.unit) {
        updates.unit = editFormData.unit;
      }
      if (editFormData.orderLink !== undefined && editFormData.orderLink !== editingProduct.orderLink) {
        updates.orderLink = editFormData.orderLink;
      }
      if (editFormData.photo !== undefined && editFormData.photo !== editingProduct.photo) {
        updates.photo = editFormData.photo;
      }

      // Mettre à jour location si nécessaire
      if (updates.storageZone || updates.shelf !== undefined || updates.position !== undefined) {
        const zone = updates.storageZone || editingProduct.storageZone || '';
        const shelf = updates.shelf !== undefined ? updates.shelf : editingProduct.shelf;
        const position = updates.position !== undefined ? updates.position : editingProduct.position;
        updates.location = `${zone}.${shelf}.${position}`;
      }

      // Appeler updateProduct seulement si des changements existent
      if (Object.keys(updates).length > 0) {
        await updateProduct(editingProduct.id, updates);
      }

      setEditingProduct(null);
      setEditFormData({});
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du produit');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditFormData({});
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du produit');
      }
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) return 'critical';
    if (product.currentStock <= product.minStock) return 'low';
    return 'normal';
  };

  return (
    <div className="products-page">
      <h1>Gestion des Produits</h1>

      <div className="filters">
        <input
          type="text"
          placeholder="Rechercher par référence ou désignation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <p className="no-data">Aucun produit trouvé</p>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Catégorie</th>
                <th>Zone</th>
                <th>Étagère</th>
                <th>Position</th>
                <th>Stock Actuel</th>
                <th>Stock Min/Max</th>
                <th>Unité</th>
                <th>Statut</th>
                <th>Lien</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className={getStockStatus(product)}>
                  <td>
                    {product.photo ? (
                      <img src={product.photo} alt={product.designation} className="product-thumb" />
                    ) : (
                      <div className="product-thumb-placeholder">?</div>
                    )}
                  </td>
                  <td>{product.reference}</td>
                  <td>{product.designation}</td>
                  <td>{product.category}</td>
                  <td>{product.storageZone}</td>
                  <td>{product.shelf}</td>
                  <td>{product.position}</td>
                  <td className="stock-value">{product.currentStock}</td>
                  <td>{product.minStock} / {product.maxStock}</td>
                  <td>{product.unit}</td>
                  <td>
                    <span className={`status-badge ${getStockStatus(product)}`}>
                      {getStockStatus(product) === 'critical' ? 'Critique' :
                       getStockStatus(product) === 'low' ? 'Faible' : 'Normal'}
                    </span>
                  </td>
                  <td>
                    {product.orderLink ? (
                      <a href={product.orderLink} target="_blank" rel="noopener noreferrer" className="btn-icon btn-gray" title="Commander">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    ) : (
                      <span className="btn-icon btn-disabled" title="Aucun lien">-</span>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => handleEdit(product)} className="btn-icon btn-edit" title="Modifier">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="btn-icon btn-delete" title="Supprimer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingProduct && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Modifier le Produit</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Désignation</label>
                <input
                  type="text"
                  value={editFormData.designation || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
                <select
                  value={editFormData.category || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Zone de stockage</label>
                <select
                  value={editFormData.storageZone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, storageZone: e.target.value })}
                >
                  {storageZones.map(zone => (
                    <option key={zone.id} value={zone.name}>{zone.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>N° Étagère</label>
                <input
                  type="number"
                  value={editFormData.shelf !== undefined ? editFormData.shelf : ''}
                  min="1"
                  onChange={(e) => setEditFormData({ ...editFormData, shelf: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="form-group">
                <label>N° Position</label>
                <input
                  type="number"
                  value={editFormData.position !== undefined ? editFormData.position : ''}
                  min="1"
                  onChange={(e) => setEditFormData({ ...editFormData, position: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Stock Actuel</label>
                <input
                  type="number"
                  value={editFormData.currentStock !== undefined ? editFormData.currentStock : ''}
                  step="0.01"
                  min="0"
                  onChange={(e) => setEditFormData({ ...editFormData, currentStock: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Stock Minimum</label>
                <input
                  type="number"
                  value={editFormData.minStock !== undefined ? editFormData.minStock : ''}
                  step="0.01"
                  min="0"
                  onChange={(e) => setEditFormData({ ...editFormData, minStock: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Stock Maximum</label>
                <input
                  type="number"
                  value={editFormData.maxStock !== undefined ? editFormData.maxStock : ''}
                  step="0.01"
                  min="0"
                  onChange={(e) => setEditFormData({ ...editFormData, maxStock: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Unité</label>
              <select
                value={editFormData.unit || ''}
                onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
              >
                {units.map(unit => (
                  <option key={unit.id} value={unit.abbreviation}>
                    {unit.name} ({unit.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="orderLink">Lien de Commande</label>
              <input
                type="url"
                id="orderLink"
                value={editFormData.orderLink || ''}
                onChange={(e) => setEditFormData({ ...editFormData, orderLink: e.target.value })}
                placeholder="https://exemple.com/produit"
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                URL vers le site du fournisseur pour commander ce produit
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="photo">Photo du Produit</label>
              <input
                type="file"
                id="photo"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              {editFormData.photo && (
                <div className="photo-preview">
                  <img src={editFormData.photo} alt="Aperçu" />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={handleCancelEdit} className="btn btn-secondary">Annuler</button>
              <button onClick={handleSaveEdit} className="btn btn-primary">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
