import React, { useState } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { Product } from '../types';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

interface ProductLabel {
  product: Product;
  quantity: number;
}

const LabelGeneration: React.FC = () => {
  const { products } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<{ [productId: string]: number }>({});
  const [selectAll, setSelectAll] = useState(false);

  const filteredProducts = products.filter(product =>
    product.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectProduct = (productId: string, quantity: number) => {
    if (quantity > 0) {
      setSelectedProducts(prev => ({ ...prev, [productId]: quantity }));
    } else {
      const newSelected = { ...selectedProducts };
      delete newSelected[productId];
      setSelectedProducts(newSelected);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts({});
    } else {
      const allSelected: { [productId: string]: number } = {};
      filteredProducts.forEach(product => {
        allSelected[product.id] = 1;
      });
      setSelectedProducts(allSelected);
    }
    setSelectAll(!selectAll);
  };

  const formatLocation = (product: Product): string => {
    if (product.storageZone && product.shelf !== undefined && product.position !== undefined) {
      return `${product.storageZone}-${product.shelf}-${product.position}`;
    }
    return product.location
      .replace(/Étagère\s*/gi, '')
      .replace(/Position\s*/gi, '')
      .replace(/\s*-\s*/g, '-')
      .replace(/\.+/g, '-')
      .replace(/-+/g, '-');
  };

  const generateBarcodeDataURL = (text: string): string => {
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, text, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: false,
        margin: 0,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Erreur lors de la génération du code-barre:', error);
      return '';
    }
  };

  const generateLabels = () => {
    const labelsToPrint: ProductLabel[] = [];

    Object.entries(selectedProducts).forEach(([productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      if (product && quantity > 0) {
        labelsToPrint.push({ product, quantity });
      }
    });

    if (labelsToPrint.length === 0) {
      alert('Veuillez sélectionner au moins un produit');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Dimensions des étiquettes (en mm)
    const labelWidth = 100;
    const labelHeight = 60;
    const marginLeft = 5;
    const marginTop = 5;
    const spacing = 5;
    const labelsPerRow = 2;

    let currentX = marginLeft;
    let currentY = marginTop;
    let labelCount = 0;

    labelsToPrint.forEach(({ product, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        // Nouvelle page si nécessaire
        if (labelCount > 0 && currentY + labelHeight > 287) { // A4 height: 297mm
          doc.addPage();
          currentX = marginLeft;
          currentY = marginTop;
        }

        // Dessiner le cadre de l'étiquette
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(currentX, currentY, labelWidth, labelHeight);

        // Référence (en haut, en gras)
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(product.reference, currentX + labelWidth / 2, currentY + 8, { align: 'center' });

        // Désignation (multilignes si nécessaire)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const designation = product.designation.length > 50
          ? product.designation.substring(0, 50) + '...'
          : product.designation;

        const designationLines = doc.splitTextToSize(designation, labelWidth - 10);
        doc.text(designationLines, currentX + labelWidth / 2, currentY + 16, { align: 'center' });

        // Emplacement
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const location = formatLocation(product);
        doc.text(`Emplacement: ${location}`, currentX + labelWidth / 2, currentY + 30, { align: 'center' });

        // Code-barre
        try {
          const barcodeDataURL = generateBarcodeDataURL(product.reference);
          if (barcodeDataURL) {
            const barcodeWidth = 80;
            const barcodeHeight = 15;
            const barcodeX = currentX + (labelWidth - barcodeWidth) / 2;
            const barcodeY = currentY + 35;
            doc.addImage(barcodeDataURL, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);

            // Afficher la référence sous le code-barre
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(product.reference, currentX + labelWidth / 2, barcodeY + barcodeHeight + 4, { align: 'center' });
          }
        } catch (error) {
          console.error('Erreur lors de l\'ajout du code-barre au PDF:', error);
        }

        // Passer à la prochaine position
        labelCount++;
        currentX += labelWidth + spacing;

        if (labelCount % labelsPerRow === 0) {
          currentX = marginLeft;
          currentY += labelHeight + spacing;
        }
      }
    });

    doc.save(`etiquettes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const selectedCount = Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="products-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Génération d'Étiquettes</h1>
        {selectedCount > 0 && (
          <div style={{ padding: '0.5rem 1rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Étiquettes sélectionnées: </span>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent-color)' }}>{selectedCount}</span>
          </div>
        )}
      </div>

      <div className="filters" style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Rechercher par référence ou désignation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{ flex: 1 }}
        />
        <button
          onClick={handleSelectAll}
          className="btn btn-secondary"
        >
          {selectAll ? 'Tout désélectionner' : 'Tout sélectionner'}
        </button>
        <button
          onClick={generateLabels}
          className="btn btn-primary"
          disabled={selectedCount === 0}
        >
          Générer les Étiquettes ({selectedCount})
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <p className="no-data">Aucun produit trouvé</p>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Sélection</th>
                <th>Photo</th>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Emplacement</th>
                <th style={{ width: '120px' }}>Quantité</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!!selectedProducts[product.id]}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleSelectProduct(product.id, 1);
                        } else {
                          handleSelectProduct(product.id, 0);
                        }
                      }}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: 'var(--accent-color)'
                      }}
                    />
                  </td>
                  <td>
                    {product.photo ? (
                      <img src={product.photo} alt={product.designation} className="product-thumb" />
                    ) : (
                      <div className="product-thumb-placeholder">?</div>
                    )}
                  </td>
                  <td>{product.reference}</td>
                  <td>{product.designation}</td>
                  <td>{formatLocation(product)}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedProducts[product.id] || 0}
                      onChange={(e) => handleSelectProduct(product.id, parseInt(e.target.value) || 0)}
                      style={{
                        width: '80px',
                        padding: '0.4rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        background: 'var(--bg-color)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'var(--card-bg)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Instructions</h3>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Sélectionnez les produits pour lesquels vous souhaitez générer des étiquettes</li>
          <li>Définissez le nombre d'étiquettes à générer pour chaque produit</li>
          <li>Cliquez sur "Générer les Étiquettes" pour créer un PDF</li>
          <li>Chaque étiquette contient:
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>La référence du produit (en gras)</li>
              <li>La désignation complète</li>
              <li>L'emplacement de stockage</li>
              <li>Un code-barre scannable de la référence</li>
            </ul>
          </li>
          <li>Format: 2 étiquettes par ligne (100mm x 60mm chacune)</li>
        </ul>
      </div>
    </div>
  );
};

export default LabelGeneration;
