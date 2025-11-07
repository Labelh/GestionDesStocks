import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { Product } from '../types';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import './LabelGenerator.css';

interface LabelData {
  product: Product;
  quantity: number;
}

const LabelGenerator: React.FC = () => {
  const { products } = useApp();
  const [selectedProducts, setSelectedProducts] = useState<LabelData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [storageZoneFilter, setStorageZoneFilter] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement }>({});

  const formatLocation = (location: string) => {
    if (!location) return '';
    return location
      .replace(/Étagère\s*/gi, '')
      .replace(/Position\s*/gi, '')
      .replace(/\s*-\s*/g, '-')
      .replace(/\.+/g, '-')
      .replace(/-+/g, '-');
  };

  // Extraire les zones de stockage uniques
  const storageZones = Array.from(new Set(
    products
      .map(p => p.location ? formatLocation(p.location).split('-')[0] : '')
      .filter(zone => zone)
  )).sort();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesZone = !storageZoneFilter ||
      (product.location && formatLocation(product.location).startsWith(storageZoneFilter));

    return matchesSearch && matchesZone;
  });

  const handleAddProduct = (product: Product) => {
    const existing = selectedProducts.find(p => p.product.id === product.id);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p =>
        p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.product.id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts(selectedProducts.map(p =>
      p.product.id === productId ? { ...p, quantity } : p
    ));
  };

  const handleSelectAllFromZone = () => {
    if (!storageZoneFilter) return;

    const productsInZone = filteredProducts.filter(product =>
      product.location && formatLocation(product.location).startsWith(storageZoneFilter)
    );

    const newSelections = [...selectedProducts];

    productsInZone.forEach(product => {
      const existing = newSelections.find(p => p.product.id === product.id);
      if (!existing) {
        newSelections.push({ product, quantity: 1 });
      }
    });

    setSelectedProducts(newSelections);
  };

  // Générer tous les codes-barres pour la prévisualisation
  useEffect(() => {
    if (previewMode) {
      // Délai pour s'assurer que tous les canvas sont montés
      setTimeout(() => {
        selectedProducts.forEach(({ product, quantity }) => {
          for (let i = 0; i < quantity; i++) {
            const canvasId = `${product.id}-${i}`;
            const canvas = canvasRefs.current[canvasId];
            if (canvas) {
              try {
                JsBarcode(canvas, product.reference, {
                  format: 'CODE128',
                  width: 1.5,
                  height: 30,
                  displayValue: false,
                  margin: 0,
                });
              } catch (error) {
                console.error('Error generating barcode:', error);
              }
            }
          }
        });
      }, 100);
    }
  }, [previewMode, selectedProducts]);

  const generateLabels = () => {
    setPreviewMode(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Dimensions de la page A4
    const pageWidth = 210;
    const pageHeight = 297;

    // Marges de la page
    const pageMarginX = 5; // Marge gauche/droite de la page
    const pageMarginY = 5; // Marge haut/bas de la page

    // Configuration des étiquettes (3 colonnes x 8 lignes = 24 étiquettes par page)
    const cols = 3;
    const rows = 8;
    const labelWidth = (pageWidth - 2 * pageMarginX) / cols; // ~66.67mm
    const labelHeight = (pageHeight - 2 * pageMarginY) / rows; // ~35.875mm

    // Marges internes pour chaque étiquette
    const paddingX = 4;
    const paddingY = 4;

    // Fonction pour dessiner les lignes de découpe en pointillés
    const drawCutLines = () => {
      doc.setDrawColor(200, 200, 200); // Couleur gris clair
      const dashLength = 2;
      const gapLength = 2;

      // Lignes verticales en pointillés
      for (let col = 1; col < cols; col++) {
        const x = pageMarginX + col * labelWidth;
        let currentY = pageMarginY;
        const endY = pageHeight - pageMarginY;

        while (currentY < endY) {
          const segmentEnd = Math.min(currentY + dashLength, endY);
          doc.line(x, currentY, x, segmentEnd);
          currentY = segmentEnd + gapLength;
        }
      }

      // Lignes horizontales en pointillés
      for (let row = 1; row < rows; row++) {
        const y = pageMarginY + row * labelHeight;
        let currentX = pageMarginX;
        const endX = pageWidth - pageMarginX;

        while (currentX < endX) {
          const segmentEnd = Math.min(currentX + dashLength, endX);
          doc.line(currentX, y, segmentEnd, y);
          currentX = segmentEnd + gapLength;
        }
      }
    };

    let labelCount = 0;
    let pageCount = 0;

    // Dessiner les lignes de découpe sur la première page
    drawCutLines();

    selectedProducts.forEach(({ product, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        // Calculer la position de l'étiquette sur la grille
        const col = labelCount % cols;
        const row = Math.floor((labelCount % (cols * rows)) / cols);

        // Si on commence une nouvelle page (sauf pour la première étiquette)
        if (labelCount > 0 && labelCount % (cols * rows) === 0) {
          doc.addPage();
          pageCount++;
          drawCutLines(); // Dessiner les lignes sur la nouvelle page
        }

        // Position de départ de l'étiquette (avec marges de page)
        const x = pageMarginX + col * labelWidth;
        const y = pageMarginY + row * labelHeight;

        // Dessiner la bordure de l'étiquette (optionnel, pour le débogage)
        // doc.rect(x, y, labelWidth, labelHeight);

        // Générer le code-barres sur un canvas temporaire
        const canvas = document.createElement('canvas');
        try {
          JsBarcode(canvas, product.reference, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: false,
            margin: 0,
          });

          let currentY = y + paddingY;

          // Ajouter le code-barres au PDF (aligné à gauche)
          const barcodeImage = canvas.toDataURL('image/png');
          const barcodeWidth = 55; // Largeur du code-barres
          const barcodeHeight = 14; // Hauteur du code-barres
          doc.addImage(
            barcodeImage,
            'PNG',
            x + paddingX,
            currentY,
            barcodeWidth,
            barcodeHeight
          );
          currentY += barcodeHeight + 4; // Espacement entre code-barres et référence

          // Référence en orange-rouge, alignée à gauche
          doc.setTextColor(197, 90, 58); // Couleur orange-rouge (var(--primary-color))
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(
            product.reference,
            x + paddingX,
            currentY
          );
          currentY += 4.5; // Espacement minimal pour passer à la ligne suivante

          // Désignation en noir, alignée à gauche
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const designation = product.designation.length > 45
            ? product.designation.substring(0, 42) + '...'
            : product.designation;

          const lines = doc.splitTextToSize(designation, labelWidth - 2 * paddingX);
          doc.text(
            lines,
            x + paddingX,
            currentY
          );
          currentY += (lines.length * 3.5); // Espacement minimal pour passer à la ligne suivante

          // Emplacement en noir, aligné à gauche
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          const location = formatLocation(product.location) || 'N/A';
          doc.text(
            location,
            x + paddingX,
            currentY
          );

        } catch (error) {
          console.error('Error generating barcode for PDF:', error);
        }

        labelCount++;
      }
    });

    doc.save(`etiquettes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getTotalLabels = () => {
    return selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
  };

  const renderPreview = () => {
    const labels: JSX.Element[] = [];
    selectedProducts.forEach(({ product, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        const canvasId = `${product.id}-${i}`;
        labels.push(
          <div key={canvasId} className="label-preview">
            <canvas
              ref={(el) => {
                if (el) {
                  canvasRefs.current[canvasId] = el;
                }
              }}
              className="label-barcode"
            />
            <div className="label-reference">{product.reference}</div>
            <div className="label-designation">{product.designation}</div>
            <div className="label-location">{formatLocation(product.location) || 'N/A'}</div>
          </div>
        );
      }
    });
    return labels;
  };

  if (previewMode) {
    return (
      <div className="label-generator-page">
        <div className="page-header">
          <h1>Prévisualisation des Étiquettes</h1>
          <div className="header-actions">
            <button onClick={() => setPreviewMode(false)} className="btn btn-secondary">
              ← Retour
            </button>
            <button onClick={generatePDF} className="btn btn-primary">
              Générer le PDF
            </button>
          </div>
        </div>

        <div className="preview-info">
          <p>Total: <strong>{getTotalLabels()} étiquettes</strong></p>
          <p>Pages: <strong>{Math.ceil(getTotalLabels() / 24)}</strong></p>
          <p className="preview-note">Format: 3 colonnes × 8 lignes (24 étiquettes par page)</p>
        </div>

        <div className="labels-grid">
          {renderPreview()}
        </div>
      </div>
    );
  }

  return (
    <div className="label-generator-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Générateur d'Étiquettes</h1>
          <p className="page-subtitle">Créez et imprimez vos étiquettes de produits</p>
        </div>
      </div>

      <div className="generator-container">
        <div className="products-selection">
          <h2>Sélectionner les Produits</h2>
          <input
            type="text"
            placeholder="Rechercher par référence ou désignation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <div className="filter-section">
            <select
              value={storageZoneFilter}
              onChange={(e) => setStorageZoneFilter(e.target.value)}
              className="zone-filter"
            >
              <option value="">Toutes les zones</option>
              {storageZones.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>

            {storageZoneFilter && (
              <button
                onClick={handleSelectAllFromZone}
                className="btn-select-zone"
                title="Sélectionner tous les produits de cette zone"
              >
                Sélectionner toute la zone
              </button>
            )}
          </div>

          <div className="products-list">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-item">
                <div className="product-info">
                  <div className="product-ref">{product.reference}</div>
                  <div className="product-name">{product.designation}</div>
                  <div className="product-location">{formatLocation(product.location) || 'N/A'}</div>
                </div>
                <button
                  onClick={() => handleAddProduct(product)}
                  className="btn-add"
                  title="Ajouter"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="selected-products">
          <h2>Produits Sélectionnés ({getTotalLabels()} étiquettes)</h2>

          {selectedProducts.length === 0 ? (
            <p className="no-selection">Aucun produit sélectionné</p>
          ) : (
            <>
              <div className="selected-list">
                {selectedProducts.map(({ product, quantity }) => (
                  <div key={product.id} className="selected-item">
                    <div className="selected-info">
                      <div className="selected-ref">{product.reference}</div>
                      <div className="selected-name">{product.designation}</div>
                    </div>
                    <div className="selected-controls">
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                        className="quantity-input"
                      />
                      <button
                        onClick={() => handleRemoveProduct(product.id)}
                        className="btn-remove"
                        title="Retirer"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="preview-actions">
                <button
                  onClick={generateLabels}
                  className="btn btn-primary"
                  disabled={selectedProducts.length === 0}
                >
                  Prévisualiser ({getTotalLabels()} étiquettes)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabelGenerator;
