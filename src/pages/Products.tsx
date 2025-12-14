import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { useNotifications } from '../components/NotificationSystem';
import { Product } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import JsBarcode from 'jsbarcode';

const Products: React.FC = () => {
  const { products, updateProduct, deleteProduct, categories, units, storageZones, stockMovements, addOrder, getPendingOrders, updateOrder, getAverageDeliveryTime } = useApp();
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});
  const [receivingProduct, setReceivingProduct] = useState<Product | null>(null);
  const [receivedQuantity, setReceivedQuantity] = useState<number>(0);
  const [orderLinksProduct, setOrderLinksProduct] = useState<Product | null>(null);
  const [orderingProduct, setOrderingProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 25;
  const tableRef = useRef<HTMLDivElement>(null);

  // Vérifier si un produit est en commande
  const isProductInOrder = (productId: string) => {
    return getPendingOrders().some(order => order.product_id === productId);
  };

  // États pour le catalogue PDF
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogConfig, setCatalogConfig] = useState({
    includePhotos: true,
    includeBarcodes: true,
    includeStock: true,
    includeLocation: true,
    selectedCategories: [] as string[],
  });

  const getStockStatus = (product: Product) => {
    // Utiliser le stock minimum pour déterminer le statut
    if (product.minStock === 0) return 'normal'; // Pas de seuil défini = vert

    const ratio = product.currentStock / product.minStock;

    if (ratio < 0.5) return 'critical'; // Moins de 50% du min = rouge
    if (ratio < 1) return 'low'; // En dessous du min = jaune/orange
    return 'normal'; // Au-dessus du min = vert
  };

  const formatLocation = (location: string) => {
    // Nettoyer l'emplacement: supprimer "Étagère" et "Position" et garder uniquement les valeurs
    if (!location) return '';
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
                         product.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.customerReference && product.customerReference.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !filterCategory || product.category === filterCategory;

    let matchesStatus = true;
    if (filterStatus) {
      const status = getStockStatus(product);
      matchesStatus = status === filterStatus;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Remonter en haut lors du changement de page
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  // Réinitialiser la page lors du changement de filtre
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    // Copier tous les champs du produit
    setEditFormData({
      designation: product.designation,
      customerReference: product.customerReference || '',
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

      console.log('Début sauvegarde:', { editFormData, editingProduct });

      // Collecter uniquement les champs modifiés
      if (editFormData.designation !== undefined && editFormData.designation !== editingProduct.designation) {
        updates.designation = editFormData.designation;
      }
      if (editFormData.category !== undefined && editFormData.category !== editingProduct.category) {
        updates.category = editFormData.category;
      }
      if (editFormData.storageZone !== undefined && editFormData.storageZone !== editingProduct.storageZone) {
        console.log('Zone changée:', editFormData.storageZone, '!=', editingProduct.storageZone);
        updates.storageZone = editFormData.storageZone;
      }
      if (editFormData.shelf !== undefined && editFormData.shelf !== editingProduct.shelf) {
        console.log('Shelf changée:', editFormData.shelf, '!=', editingProduct.shelf);
        updates.shelf = editFormData.shelf;
      }
      if (editFormData.position !== undefined && editFormData.position !== editingProduct.position) {
        console.log('Position changée:', editFormData.position, '!=', editingProduct.position);
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
      if (updates.storageZone !== undefined || updates.shelf !== undefined || updates.position !== undefined) {
        const zone = updates.storageZone !== undefined ? updates.storageZone : editingProduct.storageZone;
        const shelf = updates.shelf !== undefined ? updates.shelf : editingProduct.shelf;
        const position = updates.position !== undefined ? updates.position : editingProduct.position;

        // Construire le location uniquement si les valeurs sont définies
        if (zone) {
          const shelfStr = shelf !== undefined && shelf !== null ? shelf : '';
          const positionStr = position !== undefined && position !== null ? position : '';
          updates.location = `${zone}.${shelfStr}.${positionStr}`;
        } else {
          updates.location = '';
        }
        console.log('Location calculé:', { zone, shelf, position, location: updates.location });
      }

      // Appeler updateProduct seulement si des changements existent
      if (Object.keys(updates).length > 0) {
        console.log('Updates envoyés:', updates);
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
    } catch (error) {
      console.error('Erreur lors de la réception:', error);
      alert('Erreur lors de la réception du produit');
    }
  };

  const handleCancelReception = () => {
    setReceivingProduct(null);
    setReceivedQuantity(0);
  };

  const handleOpenOrderLinks = (product: Product) => {
    setOrderLinksProduct(product);
  };

  const handleCloseOrderLinks = () => {
    setOrderLinksProduct(null);
  };

  const handleOpenOrder = (product: Product) => {
    setOrderingProduct(product);
    setOrderQuantity(0);
  };

  const handleSubmitOrder = async () => {
    if (!orderingProduct || orderQuantity <= 0) {
      alert('Veuillez saisir une quantité valide');
      return;
    }

    try {
      await addOrder({
        product_id: orderingProduct.id,
        product_reference: orderingProduct.reference,
        product_designation: orderingProduct.designation,
        quantity: orderQuantity,
      });

      addNotification({
        type: 'success',
        title: 'Commande enregistrée',
        message: `${orderQuantity} ${orderingProduct.unit} de ${orderingProduct.designation} commandé(s)`,
        duration: 5000,
      });

      setOrderingProduct(null);
      setOrderQuantity(0);
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'enregistrement de la commande',
        duration: 5000,
      });
    }
  };

  const handleCancelOrder = () => {
    setOrderingProduct(null);
    setOrderQuantity(0);
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

  const generateCatalogPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    const orangeColor = [255, 87, 34]; // Rouge-orange

    // Filtrer les produits selon les catégories sélectionnées
    let catalogProducts = products;
    if (catalogConfig.selectedCategories.length > 0) {
      catalogProducts = products.filter(p => catalogConfig.selectedCategories.includes(p.category));
    }

    // Grouper les produits par catégorie
    const productsByCategory: { [key: string]: Product[] } = {};
    catalogProducts.forEach(product => {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product);
    });

    const categoryNames = Object.keys(productsByCategory).sort();
    let currentPage = 0;
    const pageNumbers: { [category: string]: number } = {};

    // ===== SOMMAIRE (Style Kemet) =====
    // Bande de titre orange en haut
    doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.rect(0, 0, pageWidth, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CATALOGUE PRODUITS', pageWidth / 2, 8, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPosition = 25;
    let columnX = margin;
    const columnWidth = (pageWidth - 2 * margin - 10) / 2;

    categoryNames.forEach((category, index) => {
      pageNumbers[category] = currentPage + 1 + index; // Estimation

      // Si on dépasse la hauteur, passer à la deuxième colonne
      if (yPosition > pageHeight - 40 && columnX === margin) {
        columnX = margin + columnWidth + 10;
        yPosition = 25;
      }

      // Si les deux colonnes sont pleines, nouvelle page
      if (yPosition > pageHeight - 40 && columnX !== margin) {
        doc.addPage();
        currentPage++;

        // Bande orange en haut
        doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('CATALOGUE PRODUITS', pageWidth / 2, 8, { align: 'center' });

        columnX = margin;
        yPosition = 25;
      }

      // Catégorie avec fond gris clair
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(columnX - 2, yPosition - 5, columnWidth + 4, 7, 1, 1, 'F');

      doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(category, columnX, yPosition);
      yPosition += 8;

      // Liste des produits dans cette catégorie
      productsByCategory[category].forEach((product) => {
        if (yPosition > pageHeight - 40) {
          if (columnX === margin) {
            columnX = margin + columnWidth + 10;
            yPosition = 25;
          } else {
            doc.addPage();
            currentPage++;

            // Bande orange en haut
            doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
            doc.rect(0, 0, pageWidth, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('CATALOGUE PRODUITS', pageWidth / 2, 8, { align: 'center' });

            columnX = margin;
            yPosition = 25;
          }
        }

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const designation = product.designation.length > 35 ? product.designation.substring(0, 32) + '...' : product.designation;
        doc.text(designation, columnX + 2, yPosition);

        // Numéro de page à droite
        doc.text(`${pageNumbers[category]}`, columnX + columnWidth - 5, yPosition, { align: 'right' });

        yPosition += 5;
      });

      yPosition += 3; // Espace entre catégories
    });

    // ===== GÉNÉRER LES CATÉGORIES ET PRODUITS =====
    categoryNames.forEach((category) => {
      // Page de garde pour la catégorie (Style Kemet)
      doc.addPage();
      currentPage++;
      pageNumbers[category] = currentPage;

      // Bande orange en haut
      doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
      doc.rect(0, 0, pageWidth, 12, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CATALOGUE PRODUITS', pageWidth / 2, 8, { align: 'center' });

      // Titre de la catégorie
      doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text(category, margin, 35);

      // Numéro de page en bas à droite
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`${currentPage}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

      // Grille de produits (2 colonnes, style Kemet)
      const productsInCategory = productsByCategory[category];
      const cardWidth = (contentWidth - 10) / 2;
      const cardHeight = 102;
      let xPos = margin;
      let yPos = 50; // Démarrage après le titre
      let productIndex = 0;

      productsInCategory.forEach((product) => {
        if (productIndex % 6 === 0 && productIndex > 0) {
          // Nouvelle page
          doc.addPage();
          currentPage++;

          // Bande orange en haut
          doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
          doc.rect(0, 0, pageWidth, 12, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(category.toUpperCase(), pageWidth / 2, 8, { align: 'center' });

          // Numéro de page en bas à droite
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          doc.text(`${currentPage}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

          yPos = 20;
          xPos = margin;
        }

        const col = productIndex % 2;
        const row = Math.floor((productIndex % 6) / 2);

        xPos = margin + col * (cardWidth + 10);
        yPos = 50 + row * (cardHeight + 10);

        // Bordure de la carte arrondie (rectangle)
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 3, 3);

        const cardMargin = 5;
        let contentY = yPos + cardMargin;

        // Photo ou placeholder carré avec cadre
        if (catalogConfig.includePhotos) {
          const photoSize = cardWidth - 2 * cardMargin; // Carré qui prend toute la largeur avec marges
          const photoX = xPos + cardMargin;
          const photoY = contentY;

          if (product.photo) {
            try {
              // Image carrée
              doc.addImage(product.photo, 'JPEG', photoX, photoY, photoSize, photoSize);
              // Cadre carré
              doc.setDrawColor(220, 220, 220);
              doc.setLineWidth(0.3);
              doc.rect(photoX, photoY, photoSize, photoSize);
            } catch (error) {
              // Placeholder si erreur
              doc.setFillColor(245, 245, 245);
              doc.rect(photoX, photoY, photoSize, photoSize, 'F');
              doc.setDrawColor(220, 220, 220);
              doc.setLineWidth(0.3);
              doc.rect(photoX, photoY, photoSize, photoSize);
              doc.setTextColor(200, 200, 200);
              doc.setFontSize(32);
              doc.text('📦', photoX + photoSize / 2, photoY + photoSize / 2 + 6, { align: 'center' });
            }
          } else {
            // Placeholder élégant
            doc.setFillColor(245, 245, 245);
            doc.rect(photoX, photoY, photoSize, photoSize, 'F');
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.rect(photoX, photoY, photoSize, photoSize);
            doc.setTextColor(200, 200, 200);
            doc.setFontSize(32);
            doc.text('📦', photoX + photoSize / 2, photoY + photoSize / 2 + 6, { align: 'center' });
          }

          contentY += photoSize + 5;
        }

        // Informations texte sous l'image
        const textX = xPos + cardMargin;
        let textY = contentY;

        // Référence en orange-rouge à gauche et Badge catégorie à droite (même ligne)
        doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(product.reference, textX, textY);

        // Badge catégorie aligné à droite sur la même ligne
        const badgeText = product.category;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        const badgeWidth = doc.getTextWidth(badgeText) + 4;
        const badgeX = xPos + cardWidth - badgeWidth - cardMargin;
        const badgeY = textY - 3;

        doc.setFillColor(240, 240, 240);
        doc.roundedRect(badgeX, badgeY, badgeWidth, 5, 1, 1, 'F');
        doc.setTextColor(100, 100, 100);
        doc.text(badgeText, badgeX + 2, badgeY + 3.5);

        // Code-barres sous le badge, aligné à droite (si activé)
        let barcodeY = badgeY + 7;
        if (catalogConfig.includeBarcodes) {
          const canvas = document.createElement('canvas');
          try {
            JsBarcode(canvas, product.reference, {
              format: 'CODE128',
              width: 1,
              height: 20,
              displayValue: false,
              margin: 0,
            });
            const barcodeImage = canvas.toDataURL('image/png');
            const barcodeWidth = 35;
            const barcodeHeight = 7;
            doc.addImage(barcodeImage, 'PNG', xPos + cardWidth - barcodeWidth - cardMargin, barcodeY, barcodeWidth, barcodeHeight);
          } catch (error) {
            console.error('Error generating barcode:', error);
          }
        }

        textY += 3.5;

        // Désignation
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const maxDesignationWidth = cardWidth - 2 * cardMargin;
        const designationLines = doc.splitTextToSize(product.designation, maxDesignationWidth);
        doc.text(designationLines.slice(0, 2), textX, textY);
        textY += 3 * Math.min(designationLines.length, 2) + 1;

        // Emplacement (si activé)
        if (catalogConfig.includeLocation && product.location) {
          doc.setFontSize(7);
          doc.setTextColor(80, 80, 80);
          doc.text(`Emplacement: ${formatLocation(product.location)}`, textX, textY);
          textY += 3;
        }

        // Stock (si activé)
        if (catalogConfig.includeStock) {
          doc.setFontSize(7);
          doc.setTextColor(80, 80, 80);
          doc.text(`Stock: ${product.currentStock} ${product.unit} | Min: ${product.minStock} / Max: ${product.maxStock}`, textX, textY);
        }

        productIndex++;
      });
    });

    // ===== INDEX ALPHABÉTIQUE =====
    doc.addPage();
    currentPage++;

    // Bande orange en haut
    doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.rect(0, 0, pageWidth, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INDEX ALPHABÉTIQUE', pageWidth / 2, 8, { align: 'center' });

    // Trier tous les produits par ordre alphabétique de désignation
    const sortedProducts = [...catalogProducts].sort((a, b) =>
      a.designation.localeCompare(b.designation, 'fr', { sensitivity: 'base' })
    );

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    let indexY = 25;
    let indexColumnX = margin;
    const indexColumnWidth = (pageWidth - 2 * margin - 10) / 2;

    sortedProducts.forEach((product) => {
      // Si on dépasse la hauteur, passer à la deuxième colonne
      if (indexY > pageHeight - 30 && indexColumnX === margin) {
        indexColumnX = margin + indexColumnWidth + 10;
        indexY = 25;
      }

      // Si les deux colonnes sont pleines, nouvelle page
      if (indexY > pageHeight - 30 && indexColumnX !== margin) {
        doc.addPage();
        currentPage++;

        // Bande orange en haut
        doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('INDEX ALPHABÉTIQUE', pageWidth / 2, 8, { align: 'center' });

        // Numéro de page
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(`${currentPage}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

        indexColumnX = margin;
        indexY = 25;
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      // Désignation tronquée si nécessaire
      let designation = product.designation;
      const maxWidth = indexColumnWidth - 20;
      if (doc.getTextWidth(designation) > maxWidth) {
        while (doc.getTextWidth(designation + '...') > maxWidth && designation.length > 0) {
          designation = designation.substring(0, designation.length - 1);
        }
        designation += '...';
      }

      doc.text(designation, indexColumnX, indexY);

      // Référence à droite
      doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(product.reference, indexColumnX + indexColumnWidth - 5, indexY, { align: 'right' });

      indexY += 5;
    });

    // Numéro de page sur la dernière page
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`${currentPage}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

    doc.save(`catalogue_produits_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowCatalogModal(false);
  };

  return (
    <div className="products-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Gestion des Produits</h1>
        {(() => {
          const avgTime = getAverageDeliveryTime();
          return avgTime > 0 && (
            <div style={{ padding: '0.5rem 1rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Temps moyen de livraison: </span>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent-color)' }}>{avgTime} jours</span>
            </div>
          );
        })()}
      </div>

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
          Export PDF
        </button>
        <button onClick={exportProductsToExcel} className="btn btn-secondary">
          Export Excel
        </button>
        <button onClick={() => setShowCatalogModal(true)} className="btn btn-primary">
          Générer Catalogue PDF
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <p className="no-data">Aucun produit trouvé</p>
      ) : (
        <>
          <div ref={tableRef} className="products-table-container">
            <table className="products-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Catégorie</th>
                <th>Emplacement</th>
                <th>Stock Actuel</th>
                <th>Conso. Moy/j</th>
                <th>Jours avant rupture</th>
                <th>Prix Unitaire</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    {product.photo ? (
                      <img src={product.photo} alt={product.designation} className="product-thumb" />
                    ) : (
                      <div className="product-thumb-placeholder">?</div>
                    )}
                  </td>
                  <td>{product.reference}</td>
                  <td>
                    {product.designation}
                    {isProductInOrder(product.id) && (
                      <span style={{
                        display: 'inline-block',
                        marginLeft: '0.5rem',
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#fff',
                        background: '#3b82f6',
                        borderRadius: '4px',
                        verticalAlign: 'middle'
                      }}>
                        En commande
                      </span>
                    )}
                  </td>
                  <td>{product.category}</td>
                  <td
                    title={`Raw: ${product.location} | Zone: ${product.storageZone} | Shelf: ${product.shelf} | Position: ${product.position}`}
                  >
                    [{formatLocation(product.location)}]
                  </td>
                  <td>
                    <span className={`stock-value stock-${getStockStatus(product)}`}>
                      {product.currentStock}
                    </span>
                  </td>
                  <td>{productConsumption[product.id]?.toFixed(1) || '0.0'}</td>
                  <td>
                    {(() => {
                      const consumption = productConsumption[product.id] || 0;
                      if (consumption === 0) return '∞';
                      const daysUntilEmpty = Math.floor(product.currentStock / consumption);
                      return daysUntilEmpty > 999 ? '∞' : daysUntilEmpty;
                    })()}
                  </td>
                  <td>{product.unitPrice ? `${product.unitPrice.toFixed(2)} €` : '-'}</td>
                  <td>
                    <div className="actions">
                      <button onClick={() => handleEdit(product)} className="btn-icon btn-edit" title="Modifier">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {(product.orderLink1 || product.orderLink2 || product.orderLink3 || product.orderLink) && (
                        <button onClick={() => handleOpenOrderLinks(product)} className="btn-icon btn-gray" title="Fournisseur">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                          </svg>
                        </button>
                      )}
                      <button onClick={() => handleOpenOrder(product)} className="btn-icon btn-order" title="Commander">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1"/>
                          <circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="btn-icon btn-delete-red" title="Supprimer">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
              >
                ← Précédent
              </button>

              <span className="pagination-info">
                Page {currentPage} sur {totalPages} ({filteredProducts.length} produits)
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
              >
                Suivant →
              </button>
            </div>
          )}
        </>
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
                <label>Référence Client</label>
                <input
                  type="text"
                  value={editFormData.customerReference || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, customerReference: e.target.value })}
                  placeholder="Référence du client (optionnel)"
                />
              </div>
            </div>
            <div className="form-row">
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
              <div className="form-group"></div>
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
              <div className="form-group"></div>
            </div>

            <div className="form-row">
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <h2>Réception de Stock</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              {receivingProduct.reference} - {receivingProduct.designation}
            </p>

            {/* Commandes en attente */}
            {(() => {
              const pendingOrdersForProduct = getPendingOrders().filter(o => o.product_id === receivingProduct.id);
              return pendingOrdersForProduct.length > 0 && (
                <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--card-bg)', borderRadius: '8px', border: '2px solid var(--accent-color)' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600', color: 'var(--accent-color)' }}>📦 Commandes en attente</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {pendingOrdersForProduct.map(order => (
                      <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{order.quantity} {receivingProduct.unit}</span>
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '0.75rem', fontSize: '0.9rem' }}>
                            Commandé le {new Date(order.ordered_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const newStock = receivingProduct.currentStock + order.quantity;
                              await updateProduct(receivingProduct.id, { currentStock: newStock });
                              await updateOrder(order.id, {
                                status: 'received',
                                received_at: new Date()
                              });
                              handleCancelReception();
                            } catch (error) {
                              console.error('Erreur lors de la réception:', error);
                              alert('Erreur lors de la réception');
                            }
                          }}
                          className="btn btn-success"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                          ✓ Réceptionner
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Réception manuelle */}
            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>✏️ Réception manuelle</h3>

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

      {/* Modal Commander */}
      {orderingProduct && (
        <div className="modal-overlay" onClick={handleCancelOrder}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Commander un Produit</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              {orderingProduct.reference} - {orderingProduct.designation}
            </p>

            <div className="form-group">
              <label htmlFor="orderQuantity">Quantité commandée *</label>
              <input
                type="number"
                id="orderQuantity"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                min="1"
                placeholder="0"
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleCancelOrder} className="btn btn-secondary">Annuler</button>
              <button onClick={handleSubmitOrder} className="btn btn-primary">
                Enregistrer la Commande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configuration Catalogue */}
      {showCatalogModal && (
        <div className="modal-overlay" onClick={() => setShowCatalogModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Configuration du Catalogue PDF</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Personnalisez les informations à inclure dans votre catalogue
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Options d'affichage */}
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Options d'affichage</h3>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={catalogConfig.includePhotos}
                    onChange={(e) => setCatalogConfig({ ...catalogConfig, includePhotos: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Inclure les photos des produits</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={catalogConfig.includeBarcodes}
                    onChange={(e) => setCatalogConfig({ ...catalogConfig, includeBarcodes: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Inclure les codes-barres</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={catalogConfig.includeStock}
                    onChange={(e) => setCatalogConfig({ ...catalogConfig, includeStock: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Inclure les niveaux de stock</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={catalogConfig.includeLocation}
                    onChange={(e) => setCatalogConfig({ ...catalogConfig, includeLocation: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Inclure les emplacements</span>
                </label>
              </div>

              {/* Filtrage par catégories */}
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Filtrer par catégories</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Laissez vide pour inclure toutes les catégories
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {categories.map(cat => (
                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={catalogConfig.selectedCategories.includes(cat.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCatalogConfig({
                              ...catalogConfig,
                              selectedCategories: [...catalogConfig.selectedCategories, cat.name]
                            });
                          } else {
                            setCatalogConfig({
                              ...catalogConfig,
                              selectedCategories: catalogConfig.selectedCategories.filter(c => c !== cat.name)
                            });
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>{cat.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        ({products.filter(p => p.category === cat.name).length} produits)
                      </span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            <div className="modal-actions">
              <button onClick={() => setShowCatalogModal(false)} className="btn btn-secondary">
                Annuler
              </button>
              <button
                onClick={generateCatalogPDF}
                className="btn btn-primary"
                disabled={catalogConfig.selectedCategories.length > 0 && products.filter(p => catalogConfig.selectedCategories.includes(p.category)).length === 0}
              >
                Générer le Catalogue PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
