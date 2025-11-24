import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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

  const formatLocation = useCallback((location: string) => {
    if (!location) return '';
    return location
      .replace(/Étagère\s*/gi, '')
      .replace(/Position\s*/gi, '')
      .replace(/\s*-\s*/g, '-')
      .replace(/\.+/g, '-')
      .replace(/-+/g, '-');
  }, []);

  // Extraire les zones de stockage uniques
  const storageZones = useMemo(() => {
    return Array.from(new Set(
      products
        .map(p => p.location ? formatLocation(p.location).split('-')[0] : '')
        .filter(zone => zone)
    )).sort();
  }, [products, formatLocation]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.designation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesZone = !storageZoneFilter ||
        (product.location && formatLocation(product.location).startsWith(storageZoneFilter));

      return matchesSearch && matchesZone;
    });
  }, [products, searchTerm, storageZoneFilter, formatLocation]);

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

    // Configuration des étiquettes (2 colonnes x 29 lignes = 58 étiquettes par page)
    // Dimensions: 8cm (80mm) x 1cm (10mm)
    const cols = 2;
    const rows = 29;
    const pageMarginX = 0; // Pas de marge
    const pageMarginY = 0; // Pas de marge
    const labelWidth = 80; // 8cm
    const labelHeight = 10; // 1cm

    // Marges internes pour chaque étiquette
    const paddingX = 1.5;

    // Fonction pour dessiner les lignes de découpe en pointillés
    const drawCutLines = () => {
      doc.setDrawColor(200, 200, 200); // Couleur gris clair
      const dashLength = 2;
      const gapLength = 2;

      // Lignes verticales en pointillés (sur toute la hauteur)
      for (let col = 1; col <= cols; col++) {
        const x = col * labelWidth;
        let currentY = 0;
        const endY = pageHeight;

        while (currentY < endY) {
          const segmentEnd = Math.min(currentY + dashLength, endY);
          doc.line(x, currentY, x, segmentEnd);
          currentY = segmentEnd + gapLength;
        }
      }

      // Lignes horizontales en pointillés (sur toute la largeur)
      for (let row = 1; row <= rows; row++) {
        const y = row * labelHeight;
        let currentX = 0;
        const endX = pageWidth;

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
            width: 1.5,
            height: 40,
            displayValue: false,
            margin: 0,
          });

          // Layout: code-barres à gauche, texte à droite sur 2 lignes
          const barcodeImage = canvas.toDataURL('image/png');
          const barcodeWidth = 22; // Largeur augmentée du code-barres
          const barcodeHeight = 8; // Hauteur augmentée (proche de 1cm)

          // Code-barres à gauche, centré verticalement
          const barcodeY = y + (labelHeight - barcodeHeight) / 2;
          doc.addImage(
            barcodeImage,
            'PNG',
            x + paddingX,
            barcodeY,
            barcodeWidth,
            barcodeHeight
          );

          // Position de départ pour le texte (après le code-barres)
          const textStartX = x + paddingX + barcodeWidth + 2;

          // Calculer l'emplacement d'abord
          const location = formatLocation(product.location) || 'N/A';
          doc.setFontSize(5.5);
          const locationWidth = doc.getTextWidth(location);
          const boxPadding = 1;
          const locationBoxWidth = locationWidth + 2 * boxPadding;

          // Espace disponible pour la désignation et la référence
          const availableWidth = labelWidth - (textStartX - x) - paddingX - locationBoxWidth - 2;

          // Désignation en noir (ligne du haut, tronquée si nécessaire)
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'normal');

          let designation = product.designation;
          if (doc.getTextWidth(designation) > availableWidth) {
            // Tronquer la désignation
            while (doc.getTextWidth(designation + '...') > availableWidth && designation.length > 0) {
              designation = designation.substring(0, designation.length - 1);
            }
            designation += '...';
          }

          const designationY = y + labelHeight / 2 - 0.5; // Légèrement au-dessus du centre
          doc.text(designation, textStartX, designationY);

          // Référence en orange-rouge (ligne du bas)
          doc.setTextColor(255, 87, 34);
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'bold');
          const referenceY = y + labelHeight / 2 + 2.5; // Légèrement en dessous du centre
          doc.text(product.reference, textStartX, referenceY);

          // Emplacement dans une forme avec fond gris, aligné à droite
          const boxHeight = 3.5;
          const boxX = x + labelWidth - paddingX - locationBoxWidth;
          const boxY = y + (labelHeight - boxHeight) / 2;

          // Dessiner le rectangle avec fond gris
          doc.setFillColor(220, 220, 220);
          doc.roundedRect(boxX, boxY, locationBoxWidth, boxHeight, 0.5, 0.5, 'F');

          // Texte de l'emplacement
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'normal');
          doc.text(
            location,
            boxX + boxPadding,
            boxY + boxHeight / 2 + 1
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
            <div className="label-header">
              <div className="label-reference">{product.reference}</div>
              <div className="label-location">{formatLocation(product.location) || 'N/A'}</div>
            </div>
            <div className="label-designation">{product.designation}</div>
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
          <p>Pages: <strong>{Math.ceil(getTotalLabels() / 58)}</strong></p>
          <p className="preview-note">Format: 2 colonnes × 29 lignes (58 étiquettes par page) - Dimensions: 8cm × 1cm</p>
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
