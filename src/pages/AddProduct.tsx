import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { useNavigate } from 'react-router-dom';

const AddProduct: React.FC = () => {
  const { addProduct, categories, units, storageZones, products } = useApp();
  const navigate = useNavigate();
  const [nextReference, setNextReference] = useState('');

  // Générer la prochaine référence automatiquement
  useEffect(() => {
    const generateNextReference = () => {
      if (products.length === 0) {
        return 'RF00001';
      }

      // Trouver le plus grand numéro de référence
      const refNumbers = products
        .map(p => p.reference)
        .filter(ref => ref.startsWith('RF'))
        .map(ref => parseInt(ref.substring(2)))
        .filter(num => !isNaN(num));

      const maxNum = refNumbers.length > 0 ? Math.max(...refNumbers) : 0;
      const nextNum = maxNum + 1;
      return `RF${String(nextNum).padStart(5, '0')}`;
    };

    setNextReference(generateNextReference());
  }, [products]);

  const [formData, setFormData] = useState({
    designation: '',
    category: '',
    storageZone: '',
    shelf: '',
    position: '',
    location: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    unit: '',
    photo: '',
    orderLink: '',
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

    if (!formData.designation.trim()) newErrors.designation = 'La désignation est requise';
    if (!formData.category) newErrors.category = 'La catégorie est requise';
    if (!formData.storageZone) newErrors.storageZone = 'La zone de stockage est requise';
    if (!formData.shelf || isNaN(parseInt(formData.shelf)) || parseInt(formData.shelf) < 1) {
      newErrors.shelf = 'L\'étagère doit être un nombre supérieur à 0';
    }
    if (!formData.position || isNaN(parseInt(formData.position)) || parseInt(formData.position) < 1) {
      newErrors.position = 'La position doit être un nombre supérieur à 0';
    }
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

    const locationStr = `${formData.storageZone}.${formData.shelf}.${formData.position}`;

    addProduct({
      reference: nextReference,
      designation: formData.designation,
      category: formData.category,
      storageZone: formData.storageZone,
      shelf: parseInt(formData.shelf),
      position: parseInt(formData.position),
      location: locationStr,
      currentStock: parseFloat(formData.currentStock),
      minStock: parseFloat(formData.minStock),
      maxStock: parseFloat(formData.maxStock),
      unit: formData.unit,
      photo: formData.photo || undefined,
      orderLink: formData.orderLink || undefined,
    });

    navigate('/products');
  };

  return (
    <div className="add-product-page">
      <h1>Ajouter un Produit</h1>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-row">
          <div className="form-group">
            <label>Référence (auto-générée)</label>
            <input
              type="text"
              value={nextReference}
              disabled
              style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
            />
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
            <label htmlFor="storageZone">Zone de stockage *</label>
            <select
              id="storageZone"
              name="storageZone"
              value={formData.storageZone}
              onChange={handleChange}
              className={errors.storageZone ? 'error' : ''}
            >
              <option value="">Sélectionner une zone</option>
              {storageZones.map(zone => (
                <option key={zone.id} value={zone.name}>{zone.name}</option>
              ))}
            </select>
            {errors.storageZone && <span className="error-text">{errors.storageZone}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="shelf">Étagère *</label>
            <input
              type="number"
              id="shelf"
              name="shelf"
              value={formData.shelf}
              onChange={handleChange}
              min="1"
              placeholder="Numéro de l'étagère"
              className={errors.shelf ? 'error' : ''}
            />
            {errors.shelf && <span className="error-text">{errors.shelf}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="position">Position *</label>
            <input
              type="number"
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              min="1"
              placeholder="Position sur l'étagère"
              className={errors.position ? 'error' : ''}
            />
            {errors.position && <span className="error-text">{errors.position}</span>}
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

        <div className="form-group">
          <label htmlFor="orderLink">Lien de Commande</label>
          <input
            type="url"
            id="orderLink"
            name="orderLink"
            value={formData.orderLink}
            onChange={handleChange}
            placeholder="https://exemple.com/produit"
          />
          <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            URL vers le site du fournisseur pour commander ce produit
          </small>
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
