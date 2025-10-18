import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { useNavigate } from 'react-router-dom';

const AddProduct: React.FC = () => {
  const { addProduct, categories, units, storageZones, getAllProductReferences } = useApp();
  const navigate = useNavigate();
  const [nextReference, setNextReference] = useState('');

  // Générer la prochaine référence automatiquement
  useEffect(() => {
    const generateNextReference = async () => {
      // Récupérer TOUTES les références (y compris les produits supprimés)
      const allReferences = await getAllProductReferences();

      if (allReferences.length === 0) {
        return 'RF00001';
      }

      // Trouver le plus grand numéro de référence
      const refNumbers = allReferences
        .filter(ref => ref.startsWith('RF'))
        .map(ref => parseInt(ref.substring(2)))
        .filter(num => !isNaN(num));

      const maxNum = refNumbers.length > 0 ? Math.max(...refNumbers) : 0;
      const nextNum = maxNum + 1;
      return `RF${String(nextNum).padStart(5, '0')}`;
    };

    generateNextReference().then(ref => setNextReference(ref));
  }, [getAllProductReferences]);

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
    unitPrice: '',
    photo: '',
    supplier1: '',
    orderLink1: '',
    supplier2: '',
    orderLink2: '',
    supplier3: '',
    orderLink3: '',
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

    // Validate unit price (optional field, but if provided must be valid)
    if (formData.unitPrice && (isNaN(parseFloat(formData.unitPrice)) || parseFloat(formData.unitPrice) < 0)) {
      newErrors.unitPrice = 'Le prix unitaire doit être un nombre positif';
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
      unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
      photo: formData.photo || undefined,
      supplier1: formData.supplier1 || undefined,
      orderLink1: formData.orderLink1 || undefined,
      supplier2: formData.supplier2 || undefined,
      orderLink2: formData.orderLink2 || undefined,
      supplier3: formData.supplier3 || undefined,
      orderLink3: formData.orderLink3 || undefined,
    });

    navigate('/products');
  };

  return (
    <div className="add-product-page">
      <h1>Ajouter un Produit</h1>

      <form onSubmit={handleSubmit} className="product-form">
        {/* Informations générales */}
        <div className="form-section">
          <h2 className="form-section-title">Informations générales</h2>

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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="unitPrice">Prix Unitaire (€)</label>
              <input
                type="number"
                id="unitPrice"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className={errors.unitPrice ? 'error' : ''}
              />
              {errors.unitPrice && <span className="error-text">{errors.unitPrice}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="photo">Photo du Produit</label>
              <input
                type="file"
                id="photo"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>

          {formData.photo && (
            <div className="photo-preview">
              <img src={formData.photo} alt="Aperçu" />
            </div>
          )}
        </div>

        {/* Localisation */}
        <div className="form-section">
          <h2 className="form-section-title">Localisation</h2>

          <div className="form-row">
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
          </div>

          <div className="form-row">
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

            <div className="form-group"></div>
          </div>
        </div>

        {/* Gestion du stock */}
        <div className="form-section">
          <h2 className="form-section-title">Gestion du stock</h2>

          <div className="form-row">
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

            <div className="form-group"></div>
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
        </div>

        {/* Fournisseurs et commandes */}
        <div className="form-section">
          <h2 className="form-section-title">Fournisseurs et commandes</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supplier1">Fournisseur 1</label>
              <input
                type="text"
                id="supplier1"
                name="supplier1"
                value={formData.supplier1}
                onChange={handleChange}
                placeholder="Nom du fournisseur"
              />
            </div>

            <div className="form-group">
              <label htmlFor="orderLink1">Lien de Commande 1</label>
              <input
                type="url"
                id="orderLink1"
                name="orderLink1"
                value={formData.orderLink1}
                onChange={handleChange}
                placeholder="https://exemple.com/produit"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supplier2">Fournisseur 2</label>
              <input
                type="text"
                id="supplier2"
                name="supplier2"
                value={formData.supplier2}
                onChange={handleChange}
                placeholder="Nom du fournisseur"
              />
            </div>

            <div className="form-group">
              <label htmlFor="orderLink2">Lien de Commande 2</label>
              <input
                type="url"
                id="orderLink2"
                name="orderLink2"
                value={formData.orderLink2}
                onChange={handleChange}
                placeholder="https://exemple.com/produit"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supplier3">Fournisseur 3</label>
              <input
                type="text"
                id="supplier3"
                name="supplier3"
                value={formData.supplier3}
                onChange={handleChange}
                placeholder="Nom du fournisseur"
              />
            </div>

            <div className="form-group">
              <label htmlFor="orderLink3">Lien de Commande 3</label>
              <input
                type="url"
                id="orderLink3"
                name="orderLink3"
                value={formData.orderLink3}
                onChange={handleChange}
                placeholder="https://exemple.com/produit"
              />
            </div>
          </div>
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
