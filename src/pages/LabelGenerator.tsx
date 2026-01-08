import React, { useState, useMemo, useCallback } from 'react';
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
  const [drawerFilter, setDrawerFilter] = useState('');
  const [includeBarcodes, setIncludeBarcodes] = useState(true);

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

  // Extraire les tiroirs uniques (zone-tiroir)
  const drawers = useMemo(() => {
    return Array.from(new Set(
      products
        .map(p => {
          if (!p.location) return '';
          const parts = formatLocation(p.location).split('-');
          return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : '';
        })
        .filter(drawer => drawer)
    )).sort();
  }, [products, formatLocation]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.designation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesZone = !storageZoneFilter ||
        (product.location && formatLocation(product.location).startsWith(storageZoneFilter));

      const matchesDrawer = !drawerFilter ||
        (product.location && formatLocation(product.location).startsWith(drawerFilter));

      return matchesSearch && matchesZone && matchesDrawer;
    });
  }, [products, searchTerm, storageZoneFilter, drawerFilter, formatLocation]);

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

  const handleSelectAllFromDrawer = () => {
    if (!drawerFilter) return;

    const productsInDrawer = filteredProducts.filter(product =>
      product.location && formatLocation(product.location).startsWith(drawerFilter)
    );

    const newSelections = [...selectedProducts];

    productsInDrawer.forEach(product => {
      const existing = newSelections.find(p => p.product.id === product.id);
      if (!existing) {
        newSelections.push({ product, quantity: 1 });
      }
    });

    setSelectedProducts(newSelections);
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

    // Configuration des étiquettes selon le mode (avec ou sans codes-barres)
    let cols: number, rows: number, labelWidth: number, labelHeight: number;
    let paddingX: number, paddingY: number;

    if (includeBarcodes) {
      // Avec codes-barres : format actuel (4x12 = 48 étiquettes/page)
      cols = 4;
      rows = 12;
      labelWidth = 52.5; // 210mm / 4 colonnes
      labelHeight = 24.75; // 297mm / 12 lignes
      paddingX = 2.5;
      paddingY = 2;
    } else {
      // Sans codes-barres : format compact (7x29 = 203 étiquettes/page)
      // 3cm x 1cm = 30mm x 10mm
      cols = 7;
      rows = 29;
      labelWidth = 30; // 3cm
      labelHeight = 10; // 1cm
      paddingX = 1.5;
      paddingY = 1;
    }

    const pageMarginX = 0; // Pas de marge
    const pageMarginY = 0; // Pas de marge

    // Fonction pour dessiner les lignes de découpe en pointillés
    const drawCutLines = () => {
      doc.setDrawColor(200, 200, 200); // Couleur gris clair
      const dashLength = 2;
      const gapLength = 2;

      // Lignes verticales en pointillés (sur toute la hauteur)
      for (let col = 1; col < cols; col++) { // Changé <= en < pour exclure le bord droit
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
      for (let row = 1; row < rows; row++) { // Changé <= en < pour exclure le bord bas
        const y = row * labelHeight;
        let currentX = 0;
        const endX = pageWidth;

        while (currentX < endX) {
          const segmentEnd = Math.min(currentX + dashLength, endX);
          doc.line(currentX, y, segmentEnd, y);
          currentX = segmentEnd + gapLength;
        }
      }

      // Ajouter les pointillés sur les bords extérieurs
      // Bord gauche (x=0)
      let currentY = 0;
      while (currentY < pageHeight) {
        const segmentEnd = Math.min(currentY + dashLength, pageHeight);
        doc.line(0, currentY, 0, segmentEnd);
        currentY = segmentEnd + gapLength;
      }

      // Bord droit (x=pageWidth)
      currentY = 0;
      while (currentY < pageHeight) {
        const segmentEnd = Math.min(currentY + dashLength, pageHeight);
        doc.line(pageWidth, currentY, pageWidth, segmentEnd);
        currentY = segmentEnd + gapLength;
      }

      // Bord haut (y=0)
      let currentX = 0;
      while (currentX < pageWidth) {
        const segmentEnd = Math.min(currentX + dashLength, pageWidth);
        doc.line(currentX, 0, segmentEnd, 0);
        currentX = segmentEnd + gapLength;
      }

      // Bord bas (y=pageHeight)
      currentX = 0;
      while (currentX < pageWidth) {
        const segmentEnd = Math.min(currentX + dashLength, pageWidth);
        doc.line(currentX, pageHeight, segmentEnd, pageHeight);
        currentX = segmentEnd + gapLength;
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

        if (includeBarcodes) {
          // MODE AVEC CODE-BARRES
          const canvas = document.createElement('canvas');
          try {
            JsBarcode(canvas, product.reference, {
              format: 'CODE128',
              width: 1.5,
              height: 40,
              displayValue: false,
              margin: 0,
            });

            const barcodeImage = canvas.toDataURL('image/png');

            // Calculer l'emplacement d'abord
            const location = formatLocation(product.location) || 'N/A';
            doc.setFontSize(5.5);
            const locationWidth = doc.getTextWidth(location);
            const boxPadding = 1;
            const locationBoxWidth = locationWidth + 2 * boxPadding;

            // Espace disponible pour la désignation et la référence (toute la largeur moins l'emplacement)
            const availableWidth = labelWidth - 2 * paddingX - locationBoxWidth - 2;

            // Désignation en noir (première ligne, tronquée si nécessaire)
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');

            let designation = product.designation;
            if (doc.getTextWidth(designation) > availableWidth) {
              // Tronquer la désignation
              while (doc.getTextWidth(designation + '...') > availableWidth && designation.length > 0) {
                designation = designation.substring(0, designation.length - 1);
              }
              designation += '...';
            }

            const designationY = y + paddingY + 2.5; // Première ligne
            doc.text(designation, x + paddingX, designationY);

            // Référence en orange-rouge (deuxième ligne)
            doc.setTextColor(255, 87, 34);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            const referenceY = y + paddingY + 7; // Deuxième ligne
            doc.text(product.reference, x + paddingX, referenceY);

            // Emplacement dans une forme avec fond gris, aligné à droite en haut
            const boxHeight = 4;
            const boxX = x + labelWidth - paddingX - locationBoxWidth;
            const boxY = y + paddingY;

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
              boxY + boxHeight / 2 + 1.2
            );

            // Code-barres en bas, centré horizontalement
            const barcodeWidth = labelWidth - 2 * paddingX;
            const barcodeHeight = 10;
            const barcodeX = x + paddingX;
            const barcodeY = y + labelHeight - barcodeHeight - paddingY;

            doc.addImage(
              barcodeImage,
              'PNG',
              barcodeX,
              barcodeY,
              barcodeWidth,
              barcodeHeight
            );

          } catch (error) {
            console.error('Error generating barcode for PDF:', error);
          }
        } else {
          // MODE SANS CODE-BARRES (format compact 3cm x 1cm)
          const location = formatLocation(product.location) || 'N/A';

          // Badge d'emplacement plus compact
          doc.setFontSize(5);
          const locationWidth = doc.getTextWidth(location);
          const boxPadding = 0.6;
          const locationBoxWidth = locationWidth + 2 * boxPadding;
          const boxHeight = 2.8; // Réduit de 4 à 2.8

          // Calculer la position du badge d'emplacement (en bas à droite)
          const boxX = x + labelWidth - paddingX - locationBoxWidth;
          const boxY = y + labelHeight - paddingY - boxHeight;

          // Dessiner le rectangle avec fond gris pour l'emplacement
          doc.setFillColor(220, 220, 220);
          doc.roundedRect(boxX, boxY, locationBoxWidth, boxHeight, 0.4, 0.4, 'F');

          // Texte de l'emplacement
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(5);
          doc.setFont('helvetica', 'normal');
          doc.text(
            location,
            boxX + boxPadding,
            boxY + boxHeight / 2 + 1
          );

          // Espace disponible pour la désignation (toute la largeur)
          const designationAvailableWidth = labelWidth - 2 * paddingX;

          // Désignation sur potentiellement 2 lignes
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'normal');

          let designation = product.designation;
          const words = designation.split(' ');
          let line1 = '';
          let line2 = '';

          // Construire la première ligne
          for (let i = 0; i < words.length; i++) {
            const testLine = line1 ? line1 + ' ' + words[i] : words[i];
            if (doc.getTextWidth(testLine) <= designationAvailableWidth) {
              line1 = testLine;
            } else {
              // Commencer la deuxième ligne avec le mot qui ne rentre pas
              line2 = words.slice(i).join(' ');
              break;
            }
          }

          // Tronquer la deuxième ligne si elle est trop longue
          if (line2 && doc.getTextWidth(line2) > designationAvailableWidth) {
            while (doc.getTextWidth(line2 + '...') > designationAvailableWidth && line2.length > 0) {
              line2 = line2.substring(0, line2.length - 1);
            }
            line2 += '...';
          }

          // Afficher la désignation
          const line1Y = y + paddingY + 2.5;
          doc.text(line1, x + paddingX, line1Y);

          if (line2) {
            const line2Y = y + paddingY + 5.5;
            doc.text(line2, x + paddingX, line2Y);
          }

          // Référence en orange-rouge (en bas à gauche)
          doc.setTextColor(255, 87, 34);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          const referenceY = y + labelHeight - paddingY - 0.8;
          doc.text(product.reference, x + paddingX, referenceY);
        }

        labelCount++;
      }
    });

    doc.save(`etiquettes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getTotalLabels = () => {
    return selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
  };

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

          <div className="filter-section">
            <select
              value={drawerFilter}
              onChange={(e) => setDrawerFilter(e.target.value)}
              className="zone-filter"
            >
              <option value="">Tous les tiroirs</option>
              {drawers.map(drawer => (
                <option key={drawer} value={drawer}>{drawer}</option>
              ))}
            </select>

            {drawerFilter && (
              <button
                onClick={handleSelectAllFromDrawer}
                className="btn-select-zone"
                title="Sélectionner tous les produits de ce tiroir"
              >
                Sélectionner tout le tiroir
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
                <div className="barcode-option" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: 'var(--card-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1rem'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}>
                    <input
                      type="checkbox"
                      checked={includeBarcodes}
                      onChange={(e) => setIncludeBarcodes(e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span>Inclure les codes-barres</span>
                  </label>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginLeft: '0.5rem'
                  }}>
                    {includeBarcodes
                      ? '(Format: 52.5mm × 24.75mm - 48 étiquettes/page)'
                      : '(Format: 30mm × 10mm - 203 étiquettes/page)'}
                  </div>
                </div>
                <button
                  onClick={generatePDF}
                  className="btn btn-primary"
                  disabled={selectedProducts.length === 0}
                >
                  Générer le PDF ({getTotalLabels()} étiquettes)
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
