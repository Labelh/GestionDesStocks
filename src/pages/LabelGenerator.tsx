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
  const [previewMode, setPreviewMode] = useState(false);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement }>({});

  const filteredProducts = products.filter(product =>
    product.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const formatLocation = (location: string) => {
    if (!location) return '';
    return location
      .replace(/Étagère\s*/gi, '')
      .replace(/Position\s*/gi, '')
      .replace(/\s*-\s*/g, '-')
      .replace(/\.+/g, '-')
      .replace(/-+/g, '-');
  };

  // Générer tous les codes-barres pour la prévisualisation
  useEffect(() => {
    if (previewMode) {
      selectedProducts.forEach(({ product }) => {
        const canvas = canvasRefs.current[product.id];
        if (canvas) {
          try {
            JsBarcode(canvas, product.reference, {
              format: 'CODE128',
              width: 2,
              height: 40,
              displayValue: false,
              margin: 0,
            });
          } catch (error) {
            console.error('Error generating barcode:', error);
          }
        }
      });
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

    // Configuration des étiquettes (3 colonnes x 8 lignes = 24 étiquettes par page)
    const cols = 3;
    const rows = 8;
    const labelWidth = pageWidth / cols; // ~70mm
    const labelHeight = pageHeight / rows; // ~37.125mm

    // Marges internes pour chaque étiquette
    const paddingX = 3;
    const paddingY = 3;

    let labelCount = 0;
    let pageCount = 0;

    selectedProducts.forEach(({ product, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        // Calculer la position de l'étiquette sur la grille
        const col = labelCount % cols;
        const row = Math.floor((labelCount % (cols * rows)) / cols);

        // Si on commence une nouvelle page (sauf pour la première étiquette)
        if (labelCount > 0 && labelCount % (cols * rows) === 0) {
          doc.addPage();
          pageCount++;
        }

        // Position de départ de l'étiquette
        const x = col * labelWidth;
        const y = row * labelHeight;

        // Dessiner la bordure de l'étiquette (optionnel, pour le débogage)
        // doc.rect(x, y, labelWidth, labelHeight);

        // Générer le code-barres sur un canvas temporaire
        const canvas = document.createElement('canvas');
        try {
          JsBarcode(canvas, product.reference, {
            format: 'CODE128',
            width: 2,
            height: 40,
            displayValue: false,
            margin: 0,
          });

          // Ajouter le code-barres au PDF
          const barcodeImage = canvas.toDataURL('image/png');
          const barcodeWidth = labelWidth - 2 * paddingX;
          const barcodeHeight = 15;
          doc.addImage(
            barcodeImage,
            'PNG',
            x + paddingX,
            y + paddingY,
            barcodeWidth,
            barcodeHeight
          );

          // Référence sous le code-barres
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(
            product.reference,
            x + labelWidth / 2,
            y + paddingY + barcodeHeight + 4,
            { align: 'center' }
          );

          // Désignation
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          const designation = product.designation.length > 35
            ? product.designation.substring(0, 32) + '...'
            : product.designation;

          const lines = doc.splitTextToSize(designation, labelWidth - 2 * paddingX);
          doc.text(
            lines,
            x + labelWidth / 2,
            y + paddingY + barcodeHeight + 9,
            { align: 'center', maxWidth: labelWidth - 2 * paddingX }
          );

          // Emplacement
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          const location = formatLocation(product.location) || 'N/A';
          doc.text(
            location,
            x + labelWidth / 2,
            y + labelHeight - paddingY - 2,
            { align: 'center' }
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
        labels.push(
          <div key={`${product.id}-${i}`} className="label-preview">
            <canvas
              ref={(el) => {
                if (el && !canvasRefs.current[product.id]) {
                  canvasRefs.current[product.id] = el;
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
        <h1>Générateur d'Étiquettes</h1>
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
