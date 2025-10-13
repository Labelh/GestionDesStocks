import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';

const Products: React.FC = () => {
  const { products, updateProduct, deleteProduct } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});

  const categories = [...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditFormData(product);
  };

  const handleSaveEdit = () => {
    if (editingProduct) {
      updateProduct(editingProduct.id, editFormData);
      setEditingProduct(null);
      setEditFormData({});
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditFormData({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      deleteProduct(id);
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
            <option key={cat} value={cat}>{cat}</option>
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
                <th>Emplacement</th>
                <th>Stock Actuel</th>
                <th>Stock Min/Max</th>
                <th>Unité</th>
                <th>Statut</th>
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
                  <td>{product.location}</td>
                  <td className="stock-value">{product.currentStock}</td>
                  <td>{product.minStock} / {product.maxStock}</td>
                  <td>{product.unit}</td>
                  <td>
                    <span className={`status-badge ${getStockStatus(product)}`}>
                      {getStockStatus(product) === 'critical' ? 'Critique' :
                       getStockStatus(product) === 'low' ? 'Faible' : 'Normal'}
                    </span>
                  </td>
                  <td className="actions">
                    <button onClick={() => handleEdit(product)} className="btn-icon btn-edit">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="btn-icon btn-delete">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Modifier le Produit</h2>
            <div className="form-group">
              <label>Stock Actuel</label>
              <input
                type="number"
                value={editFormData.currentStock || 0}
                onChange={(e) => setEditFormData({ ...editFormData, currentStock: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Stock Minimum</label>
              <input
                type="number"
                value={editFormData.minStock || 0}
                onChange={(e) => setEditFormData({ ...editFormData, minStock: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Stock Maximum</label>
              <input
                type="number"
                value={editFormData.maxStock || 0}
                onChange={(e) => setEditFormData({ ...editFormData, maxStock: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Emplacement</label>
              <input
                type="text"
                value={editFormData.location || ''}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
              />
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
