import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { Product } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Products: React.FC = () => {
  const { products, updateProduct, deleteProduct, categories, units, storageZones, stockMovements } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});
  const [receivingProduct, setReceivingProduct] = useState<Product | null>(null);
  const [receivedQuantity, setReceivedQuantity] = useState<number>(0);
  const [receptionNotes, setReceptionNotes] = useState('');
  const [orderLinksProduct, setOrderLinksProduct] = useState<Product | null>(null);

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) return 'critical';
    if (product.currentStock <= product.minStock) return 'low';
    const ratio = product.currentStock / product.maxStock;
    if (ratio <= 0.4) return 'medium';
    return 'normal';
  };

  const formatLocation = (location: string) => {
    // Nettoyer l'emplacement: supprimer "Étagère" et "Position" et garder uniquement les valeurs
    return location
      .replace(/Étagère\s*/gi, '')
      .replace(/Position\s*/gi, '')
      .replace(/\s*-\s*/g, '-')
      .replace(/\.+/g, '-')
      .replace(/-+/g, '-');
  };

  // Calculer la consommation moyenne par produit (sur 30 jours)
  const productConsumption = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const consumption: { [productId: string]: number } = {};

    products.forEach(product => {
      const productExits = stockMovements.filter(
        m => m.productId === product.id &&
             m.movementType === 'exit' &&
             m.timestamp >= monthAgo
      );

      const totalExits = productExits.reduce((sum, m) => sum + m.quantity, 0);
      const dailyAvg = totalExits / 30;

      consumption[product.id] = dailyAvg;
    });

    return consumption;
  }, [products, stockMovements]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;

    let matchesStatus = true;
    if (filterStatus) {
      const status = getStockStatus(product);
      matchesStatus = status === filterStatus;
    }

    return matchesSearch && matchesCategory && matchesStatus;
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
      unitPrice: product.unitPrice,
      supplier1: product.supplier1 || '',
      orderLink1: product.orderLink1 || product.orderLink || '',
      supplier2: product.supplier2 || '',
      orderLink2: product.orderLink2 || '',
      supplier3: product.supplier3 || '',
      orderLink3: product.orderLink3 || '',
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
      if (editFormData.unitPrice !== undefined && editFormData.unitPrice !== editingProduct.unitPrice) {
        updates.unitPrice = editFormData.unitPrice;
      }
      if (editFormData.supplier1 !== undefined && editFormData.supplier1 !== editingProduct.supplier1) {
        updates.supplier1 = editFormData.supplier1;
      }
      if (editFormData.orderLink1 !== undefined && editFormData.orderLink1 !== editingProduct.orderLink1) {
        updates.orderLink1 = editFormData.orderLink1;
      }
      if (editFormData.supplier2 !== undefined && editFormData.supplier2 !== editingProduct.supplier2) {
        updates.supplier2 = editFormData.supplier2;
      }
      if (editFormData.orderLink2 !== undefined && editFormData.orderLink2 !== editingProduct.orderLink2) {
        updates.orderLink2 = editFormData.orderLink2;
      }
      if (editFormData.supplier3 !== undefined && editFormData.supplier3 !== editingProduct.supplier3) {
        updates.supplier3 = editFormData.supplier3;
      }
      if (editFormData.orderLink3 !== undefined && editFormData.orderLink3 !== editingProduct.orderLink3) {
        updates.orderLink3 = editFormData.orderLink3;
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

  const handleOpenReception = (product: Product) => {
    setReceivingProduct(product);
    setReceivedQuantity(0);
    setReceptionNotes('');
  };

  const handleSubmitReception = async () => {
    if (!receivingProduct || receivedQuantity <= 0) {
      alert('Veuillez saisir une quantité valide');
      return;
    }

    try {
      const newStock = receivingProduct.currentStock + receivedQuantity;
      await updateProduct(receivingProduct.id, { currentStock: newStock });

      setReceivingProduct(null);
      setReceivedQuantity(0);
      setReceptionNotes('');
    } catch (error) {
      console.error('Erreur lors de la réception:', error);
      alert('Erreur lors de la réception du produit');
    }
  };

  const handleCancelReception = () => {
    setReceivingProduct(null);
    setReceivedQuantity(0);
    setReceptionNotes('');
  };

  const handleOpenOrderLinks = (product: Product) => {
    setOrderLinksProduct(product);
  };

  const handleCloseOrderLinks = () => {
    setOrderLinksProduct(null);
  };

  const exportProductsToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Liste des Produits', 14, 22);
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 30);

    const tableData = products.map(product => [
      product.reference,
      product.designation,
      product.category,
      product.location,
      product.currentStock.toString(),
      `${product.minStock} / ${product.maxStock}`,
      product.unit,
    ]);

    autoTable(doc, {
      startY: 36,
      head: [['Référence', 'Désignation', 'Catégorie', 'Emplacement', 'Stock actuel', 'Min/Max', 'Unité']],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [197, 90, 58] },
    });

    doc.save(`liste_produits_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportProductsToExcel = () => {
    const data = products.map(product => ({
      'Référence': product.reference,
      'Désignation': product.designation,
      'Catégorie': product.category,
      'Zone de stockage': product.storageZone || '',
      'Étagère': product.shelf || '',
      'Position': product.position || '',
      'Emplacement': product.location,
      'Stock actuel': product.currentStock,
      'Stock minimum': product.minStock,
      'Stock maximum': product.maxStock,
      'Unité': product.unit,
      'Créé le': new Date(product.createdAt).toLocaleString('fr-FR'),
      'Modifié le': new Date(product.updatedAt).toLocaleString('fr-FR'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');

    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 35 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 8 },
      { wch: 18 },
      { wch: 18 },
    ];

    XLSX.writeFile(workbook, `liste_produits_${new Date().toISOString().split('T')[0]}.xlsx`);
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
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les statuts</option>
          <option value="critical">Critique</option>
          <option value="low">Faible</option>
          <option value="medium">Moyen</option>
          <option value="normal">Normal</option>
        </select>
        <button onClick={exportProductsToPDF} className="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
          Export PDF
        </button>
        <button onClick={exportProductsToExcel} className="btn btn-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/>
          </svg>
          Export Excel
        </button>
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
                <th>Conso. Moy/j</th>
                <th>Unité</th>
                <th>Prix Unitaire</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
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
                  <td>[{formatLocation(product.location)}]</td>
                  <td className="stock-value">{product.currentStock}</td>
                  <td>{product.minStock} / {product.maxStock}</td>
                  <td>{productConsumption[product.id]?.toFixed(1) || '0.0'}</td>
                  <td>{product.unit}</td>
                  <td>{product.unitPrice ? `${product.unitPrice.toFixed(2)} €` : '-'}</td>
                  <td>
                    <span className={`status-badge ${getStockStatus(product)}`}>
                      {getStockStatus(product) === 'critical' ? 'Critique' :
                       getStockStatus(product) === 'low' ? 'Faible' : 'Normal'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => handleEdit(product)} className="btn-icon btn-edit" title="Modifier">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {(product.orderLink1 || product.orderLink2 || product.orderLink3 || product.orderLink) && (
                        <button onClick={() => handleOpenOrderLinks(product)} className="btn-icon btn-gray" title="Commander">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </button>
                      )}
                      <button onClick={() => handleOpenReception(product)} className="btn-icon btn-primary" title="Réceptionner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                          <path d="M16 11l-4 4-4-4"/>
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

            {/* Informations générales */}
            <div className="form-section">
              <h2 className="form-section-title">Informations générales</h2>
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
            </div>

            {/* Localisation */}
            <div className="form-section">
              <h2 className="form-section-title">Localisation</h2>
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
            </div>

            {/* Gestion du stock */}
            <div className="form-section">
              <h2 className="form-section-title">Gestion du stock</h2>
              <div className="form-row">
              <div className="form-group">
                <label>Stock Actuel</label>
                <input
                  type="number"
                  value={editFormData.currentStock !== undefined ? editFormData.currentStock : ''}
                  step="1"
                  min="0"
                  onChange={(e) => setEditFormData({ ...editFormData, currentStock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Stock Minimum</label>
                <input
                  type="number"
                  value={editFormData.minStock !== undefined ? editFormData.minStock : ''}
                  step="1"
                  min="0"
                  onChange={(e) => setEditFormData({ ...editFormData, minStock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Stock Maximum</label>
                <input
                  type="number"
                  value={editFormData.maxStock !== undefined ? editFormData.maxStock : ''}
                  step="1"
                  min="0"
                  onChange={(e) => setEditFormData({ ...editFormData, maxStock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="form-row">
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
                <label>Prix Unitaire (€)</label>
                <input
                  type="number"
                  value={editFormData.unitPrice !== undefined ? editFormData.unitPrice : ''}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  onChange={(e) => setEditFormData({ ...editFormData, unitPrice: parseFloat(e.target.value) || undefined })}
                />
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
                  value={editFormData.supplier1 || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, supplier1: e.target.value })}
                  placeholder="Nom du fournisseur"
                />
              </div>

              <div className="form-group">
                <label htmlFor="orderLink1">Lien de Commande 1</label>
                <input
                  type="url"
                  id="orderLink1"
                  value={editFormData.orderLink1 || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, orderLink1: e.target.value })}
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
                  value={editFormData.supplier2 || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, supplier2: e.target.value })}
                  placeholder="Nom du fournisseur"
                />
              </div>

              <div className="form-group">
                <label htmlFor="orderLink2">Lien de Commande 2</label>
                <input
                  type="url"
                  id="orderLink2"
                  value={editFormData.orderLink2 || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, orderLink2: e.target.value })}
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
                  value={editFormData.supplier3 || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, supplier3: e.target.value })}
                  placeholder="Nom du fournisseur"
                />
              </div>

              <div className="form-group">
                <label htmlFor="orderLink3">Lien de Commande 3</label>
                <input
                  type="url"
                  id="orderLink3"
                  value={editFormData.orderLink3 || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, orderLink3: e.target.value })}
                  placeholder="https://exemple.com/produit"
                />
              </div>
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
            </div>

            <div className="modal-actions">
              <button onClick={handleCancelEdit} className="btn btn-secondary">Annuler</button>
              <button onClick={handleSaveEdit} className="btn btn-primary">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {receivingProduct && (
        <div className="modal-overlay" onClick={handleCancelReception}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Réception de Stock</h2>
            <div className="form-group">
              <label>Produit</label>
              <input
                type="text"
                value={`${receivingProduct.reference} - ${receivingProduct.designation}`}
                disabled
                style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Stock Actuel</label>
                <input
                  type="text"
                  value={`${receivingProduct.currentStock} ${receivingProduct.unit}`}
                  disabled
                  style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label>Quantité Reçue *</label>
                <input
                  type="number"
                  value={receivedQuantity || ''}
                  step="1"
                  min="1"
                  onChange={(e) => setReceivedQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Quantité reçue"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Nouveau Stock</label>
                <input
                  type="text"
                  value={`${(receivingProduct.currentStock + receivedQuantity).toFixed(2)} ${receivingProduct.unit}`}
                  disabled
                  style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed', fontWeight: 'bold' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes (optionnel)</label>
              <textarea
                value={receptionNotes}
                onChange={(e) => setReceptionNotes(e.target.value)}
                placeholder="Notes sur la réception..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleCancelReception} className="btn btn-secondary">Annuler</button>
              <button onClick={handleSubmitReception} className="btn btn-primary">Valider la Réception</button>
            </div>
          </div>
        </div>
      )}

      {orderLinksProduct && (
        <div className="modal-overlay" onClick={handleCloseOrderLinks}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Liens de Commande</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              {orderLinksProduct.reference} - {orderLinksProduct.designation}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {(orderLinksProduct.orderLink1 || orderLinksProduct.orderLink) && (
                <a
                  href={orderLinksProduct.orderLink1 || orderLinksProduct.orderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: 'none',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      {orderLinksProduct.supplier1 || 'Fournisseur 1'}
                    </h3>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--primary-color)',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    <span>Ouvrir le lien</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </div>
                </a>
              )}

              {orderLinksProduct.orderLink2 && (
                <a
                  href={orderLinksProduct.orderLink2}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: 'none',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      {orderLinksProduct.supplier2 || 'Fournisseur 2'}
                    </h3>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--primary-color)',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    <span>Ouvrir le lien</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </div>
                </a>
              )}

              {orderLinksProduct.orderLink3 && (
                <a
                  href={orderLinksProduct.orderLink3}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: 'none',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      {orderLinksProduct.supplier3 || 'Fournisseur 3'}
                    </h3>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--primary-color)',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    <span>Ouvrir le lien</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </div>
                </a>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button onClick={handleCloseOrderLinks} className="btn btn-secondary">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
