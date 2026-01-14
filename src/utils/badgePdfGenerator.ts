import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { User } from '../types';
import { sanitizePdfText } from './pdfTextUtils';

/**
 * Génère un PDF contenant tous les codes-barres des badges utilisateurs
 * Format : Code 128, largeur max 5cm, sans marge
 */
export const generateBadgesPDF = (users: User[]) => {
  // Filtrer uniquement les utilisateurs avec un numéro de badge
  const usersWithBadge = users.filter(user => user.badgeNumber && user.badgeNumber.trim() !== '');

  if (usersWithBadge.length === 0) {
    alert('Aucun utilisateur n\'a de numéro de badge défini.');
    return;
  }

  // Créer un nouveau document PDF (A4)
  // 0 marge sur tous les côtés
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Dimensions de la page A4 en mm
  const pageWidth = 210;
  const pageHeight = 297;

  // Dimensions du code-barre
  const barcodeWidthMM = 50; // 5cm max
  const barcodeHeightMM = 15; // Hauteur adaptée (ratio environ 1:3.3)

  // Marges internes pour éviter que les codes-barres touchent les bords
  const marginX = 10;
  const marginY = 10;

  // Nombre de codes-barres par ligne (3 colonnes)
  const barcodesPerRow = 3;
  const spacingX = (pageWidth - 2 * marginX - barcodesPerRow * barcodeWidthMM) / (barcodesPerRow - 1);
  const spacingY = 5; // Espacement vertical entre les lignes

  // Fonction pour dessiner les lignes de découpe en pointillés
  const drawCutLines = () => {
    pdf.setDrawColor(200, 200, 200); // Couleur gris clair
    const dashLength = 2;
    const gapLength = 2;

    // Calculer les positions des colonnes
    const cols = barcodesPerRow;
    const colWidth = (pageWidth - 2 * marginX) / cols;

    // Lignes verticales intérieures
    for (let col = 1; col < cols; col++) {
      const x = marginX + col * colWidth;
      let currentY = 0;
      while (currentY < pageHeight) {
        const segmentEnd = Math.min(currentY + dashLength, pageHeight);
        pdf.line(x, currentY, x, segmentEnd);
        currentY = segmentEnd + gapLength;
      }
    }

    // Bords extérieurs
    // Bord gauche (x=0)
    let currentY = 0;
    while (currentY < pageHeight) {
      const segmentEnd = Math.min(currentY + dashLength, pageHeight);
      pdf.line(0, currentY, 0, segmentEnd);
      currentY = segmentEnd + gapLength;
    }

    // Bord droit (x=pageWidth)
    currentY = 0;
    while (currentY < pageHeight) {
      const segmentEnd = Math.min(currentY + dashLength, pageHeight);
      pdf.line(pageWidth, currentY, pageWidth, segmentEnd);
      currentY = segmentEnd + gapLength;
    }

    // Bord haut (y=0)
    let currentX = 0;
    while (currentX < pageWidth) {
      const segmentEnd = Math.min(currentX + dashLength, pageWidth);
      pdf.line(currentX, 0, segmentEnd, 0);
      currentX = segmentEnd + gapLength;
    }

    // Bord bas (y=pageHeight)
    currentX = 0;
    while (currentX < pageWidth) {
      const segmentEnd = Math.min(currentX + dashLength, pageWidth);
      pdf.line(currentX, pageHeight, segmentEnd, pageHeight);
      currentX = segmentEnd + gapLength;
    }
  };

  // Dessiner les lignes de découpe sur la première page
  drawCutLines();

  let currentX = marginX;
  let currentY = marginY;
  let barcodeCount = 0;

  usersWithBadge.forEach((user) => {
    // Créer un canvas temporaire pour générer le code-barre
    const canvas = document.createElement('canvas');

    try {
      // Générer le code-barre Code 128
      JsBarcode(canvas, user.badgeNumber!, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: false, // Pas de texte sous le code-barres
        margin: 5,
      });

      // Convertir le canvas en image base64
      const barcodeImage = canvas.toDataURL('image/png');

      // Calculer la position
      if (barcodeCount > 0 && barcodeCount % barcodesPerRow === 0) {
        // Nouvelle ligne
        currentX = marginX;
        currentY += barcodeHeightMM + spacingY + 10; // +10 pour le texte
      }

      // Vérifier si on doit créer une nouvelle page
      if (currentY + barcodeHeightMM + 10 > pageHeight - marginY) {
        pdf.addPage();
        drawCutLines(); // Dessiner les lignes sur la nouvelle page
        currentX = marginX;
        currentY = marginY;
      }

      // Ajouter le nom de l'utilisateur au-dessus du code-barre
      pdf.setFontSize(10);
      pdf.text(sanitizePdfText(user.name), currentX + barcodeWidthMM / 2, currentY, { align: 'center' });

      // Ajouter le code-barre au PDF
      pdf.addImage(
        barcodeImage,
        'PNG',
        currentX,
        currentY + 5, // +5mm pour l'espace après le nom
        barcodeWidthMM,
        barcodeHeightMM
      );

      // Passer à la position suivante
      currentX += barcodeWidthMM + spacingX;
      barcodeCount++;

    } catch (error) {
      console.error(`Erreur lors de la génération du code-barre pour ${user.name}:`, error);
    }
  });

  // Sauvegarder le PDF
  const date = new Date().toISOString().split('T')[0];
  pdf.save(`badges-utilisateurs-${date}.pdf`);
};
