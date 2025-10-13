import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const AddProduct: React.FC = () => {
  const { addProduct, categories, units } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    category: '',
    location: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    unit: '',
    photo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.reference.trim()) newErrors.reference = 'La référence est requise';
    if (!formData.designation.trim()) newErrors.designation = 'La désignation est requise';
    if (!formData.category) newErrors.category = 'La catégorie est requise';
    if (!formData.location.trim()) newErrors.location = 'L\'emplacement est requis';
    if (!formData.unit) newErrors.unit = 'L\'unité est requise';

    const currentStock = parseFloat(formData.currentStock);
    const minStock = parseFloat(formData.minStock);
    const maxStock = parseFloat(formData.maxStock);

    if (isNaN(currentStock) || currentStock < 0) {
      newErrors.currentStock = 'Le stock actuel doit être un nombre positif';
    }
    if (isNaN(minStock) || minStock < 0) {
      newErrors.minStock = 'Le stock minimum doit être un nombre positif';
    }
    if (isNaN(maxStock) || maxStock <= 0) {
      newErrors.maxStock = 'Le stock maximum doit être un nombre positif';
    }
    if (!isNaN(minStock) && !isNaN(maxStock) && minStock > maxStock) {
      newErrors.minStock = 'Le stock minimum doit être inférieur au stock maximum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    addProduct({
      reference: formData.reference,
      designation: formData.designation,
      category: formData.category,
      location: formData.location,
      currentStock: parseFloat(formData.currentStock),
      minStock: parseFloat(formData.minStock),
      maxStock: parseFloat(formData.maxStock),
      unit: formData.unit,
      photo: formData.photo || undefined,
    });

    navigate('/products');
  };

  return (
    <div className="add-product-page">
      <h1>Ajouter un Produit</h1>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reference">Référence *</label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              className={errors.reference ? 'error' : ''}
            />
            {errors.reference && <span className="error-text">{errors.reference}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="designation">Désignation *</label>
            <input
              type="text"
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className={errors.designation ? 'error' : ''}
            />
            {errors.designation && <span className="error-text">{errors.designation}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Catégorie *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={errors.category ? 'error' : ''}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            {errors.category && <span className="error-text">{errors.category}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="location">Emplacement *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={errors.location ? 'error' : ''}
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="unit">Unité *</label>
            <select
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className={errors.unit ? 'error' : ''}
            >
              <option value="">Sélectionner une unité</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.abbreviation}>
                  {unit.name} ({unit.abbreviation})
                </option>
              ))}
            </select>
            {errors.unit && <span className="error-text">{errors.unit}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="currentStock">Stock Actuel *</label>
            <input
              type="number"
              id="currentStock"
              name="currentStock"
              value={formData.currentStock}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={errors.currentStock ? 'error' : ''}
            />
            {errors.currentStock && <span className="error-text">{errors.currentStock}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="minStock">Stock Minimum *</label>
            <input
              type="number"
              id="minStock"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={errors.minStock ? 'error' : ''}
            />
            {errors.minStock && <span className="error-text">{errors.minStock}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="maxStock">Stock Maximum *</label>
            <input
              type="number"
              id="maxStock"
              name="maxStock"
              value={formData.maxStock}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={errors.maxStock ? 'error' : ''}
            />
            {errors.maxStock && <span className="error-text">{errors.maxStock}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="photo">Photo du Produit</label>
          <input
            type="file"
            id="photo"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
          {formData.photo && (
            <div className="photo-preview">
              <img src={formData.photo} alt="Aperçu" />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/products')} className="btn btn-secondary">
            Annuler
          </button>
          <button type="submit" className="btn btn-primary">
            Ajouter le Produit
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
