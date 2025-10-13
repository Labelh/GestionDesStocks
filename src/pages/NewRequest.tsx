import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const NewRequest: React.FC = () => {
  const { products, addExitRequest, currentUser } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    reason: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableProducts = products.filter(p => p.currentStock > 0);

  const selectedProduct = products.find(p => p.id === formData.productId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.productId) {
      newErrors.productId = 'Veuillez sélectionner un produit';
    }

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = 'La quantité doit être supérieure à 0';
    } else if (selectedProduct && quantity > selectedProduct.currentStock) {
      newErrors.quantity = `Stock insuffisant (disponible: ${selectedProduct.currentStock})`;
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Veuillez indiquer la raison de la demande';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !selectedProduct || !currentUser) return;

    addExitRequest({
      productId: selectedProduct.id,
      productReference: selectedProduct.reference,
      productDesignation: selectedProduct.designation,
      quantity: parseFloat(formData.quantity),
      requestedBy: currentUser.username,
      reason: formData.reason,
    });

    navigate('/my-requests');
  };

  return (
    <div className="new-request-page">
      <h1>Nouvelle Demande de Sortie</h1>

      <form onSubmit={handleSubmit} className="request-form">
        <div className="form-group">
          <label htmlFor="productId">Produit *</label>
          <select
            id="productId"
            name="productId"
            value={formData.productId}
            onChange={handleChange}
            className={errors.productId ? 'error' : ''}
          >
            <option value="">Sélectionner un produit</option>
            {availableProducts.map(product => (
              <option key={product.id} value={product.id}>
                {product.reference} - {product.designation} (Stock: {product.currentStock} {product.unit})
              </option>
            ))}
          </select>
          {errors.productId && <span className="error-text">{errors.productId}</span>}
        </div>

        {selectedProduct && (
          <div className="product-info">
            <h3>Informations du Produit</h3>
            <p><strong>Référence:</strong> {selectedProduct.reference}</p>
            <p><strong>Désignation:</strong> {selectedProduct.designation}</p>
            <p><strong>Catégorie:</strong> {selectedProduct.category}</p>
            <p><strong>Emplacement:</strong> {selectedProduct.location}</p>
            <p><strong>Stock disponible:</strong> {selectedProduct.currentStock} {selectedProduct.unit}</p>
            {selectedProduct.photo && (
              <img src={selectedProduct.photo} alt={selectedProduct.designation} className="product-preview" />
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="quantity">Quantité *</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="Quantité demandée"
            className={errors.quantity ? 'error' : ''}
          />
          {errors.quantity && <span className="error-text">{errors.quantity}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="reason">Raison de la demande *</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={4}
            placeholder="Expliquez pourquoi vous avez besoin de ce produit..."
            className={errors.reason ? 'error' : ''}
          />
          {errors.reason && <span className="error-text">{errors.reason}</span>}
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/user-dashboard')} className="btn btn-secondary">
            Annuler
          </button>
          <button type="submit" className="btn btn-primary">
            Soumettre la Demande
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRequest;
