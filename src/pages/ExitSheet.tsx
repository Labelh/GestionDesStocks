import React, { useState } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { PendingExit } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sanitizePdfText } from '../utils/pdfTextUtils';
import './ExitSheet.css';

const ExitSheet: React.FC = () => {
  const { pendingExits, removePendingExit } = useApp();
  const [selectedExits, setSelectedExits] = useState<Set<string>>(new Set());

  const handlePrint = async () => {
    if (selectedExits.size === 0) {
      alert('Veuillez sélectionner au moins un article récupéré');
      return;
    }

    // Créer le PDF en mode paysage (landscape)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;

    // Titre
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FEUILLE DE SORTIE', pageWidth / 2, 15, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    doc.text(`Date: ${dateStr}`, pageWidth / 2, 22, { align: 'center' });

    // Préparer les données du tableau (uniquement les articles sélectionnés)
    const selectedExitsData = pendingExits.filter(exit => selectedExits.has(exit.id));
    const tableData = selectedExitsData.map((exit, index) => [
      index + 1,
      sanitizePdfText(exit.productReference),
      sanitizePdfText(exit.productDesignation),
      sanitizePdfText(getLocation(exit)),
      exit.quantity,
      sanitizePdfText(exit.requestedBy),
      '[ ]' // Case à cocher (☑ remplacé par [ ])
    ]);

    // Générer le tableau
    autoTable(doc, {
      startY: 28,
      head: [['N°', 'Référence', 'Désignation', 'Emplacement', 'Quantité', 'Demandeur', 'Récupéré']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: 'left',
        minCellHeight: 8,
      },
      headStyles: {
        fillColor: [249, 55, 5],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        minCellHeight: 8,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 30, textColor: [249, 55, 5], fontStyle: 'bold' },
        2: { cellWidth: 100 },
        3: { cellWidth: 45 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 35 },
        6: { cellWidth: 20, halign: 'center', fontSize: 14 }
      },
    });

    // Sauvegarder le PDF
    doc.save(`feuille-sortie-${dateStr}.pdf`);

    // Supprimer uniquement les articles sélectionnés/récupérés
    try {
      for (const exitId of selectedExits) {
        await removePendingExit(exitId);
      }
      setSelectedExits(new Set());
    } catch (error) {
      console.error('Erreur lors de la suppression des sorties:', error);
      alert('Erreur lors de la suppression des articles récupérés');
    }
  };

  const toggleSelection = (exitId: string) => {
    setSelectedExits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exitId)) {
        newSet.delete(exitId);
      } else {
        newSet.add(exitId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedExits.size === pendingExits.length) {
      setSelectedExits(new Set());
    } else {
      setSelectedExits(new Set(pendingExits.map(exit => exit.id)));
    }
  };

  const getLocation = (exit: PendingExit): string => {
    const parts: string[] = [];
    if (exit.storageZone) parts.push(exit.storageZone);
    if (exit.shelf) parts.push(String(exit.shelf));
    if (exit.position) parts.push(String(exit.position));
    return parts.join(' - ') || 'Non spécifié';
  };

  return (
    <div className="exit-sheet-page">
      <div className="page-header no-print">
        <div>
          <h1>Feuille de Sortie</h1>
          <p className="subtitle">
            {pendingExits.length} produit{pendingExits.length > 1 ? 's' : ''} en attente de sortie
          </p>
        </div>
      </div>

      {pendingExits.length === 0 ? (
        <div className="empty-state no-print">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <h3>Aucune sortie en attente</h3>
          <p>Les produits approuvés pour sortie apparaîtront ici</p>
        </div>
      ) : (
        <div className="print-content">
          <div className="print-header">
            <h1>FEUILLE DE SORTIE</h1>
            <div className="print-date">
              Date: {new Date().toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </div>
          </div>

          <table className="exit-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedExits.size === pendingExits.length && pendingExits.length > 0}
                    onChange={toggleSelectAll}
                    title="Tout sélectionner / Tout désélectionner"
                  />
                </th>
                <th>N°</th>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Emplacement</th>
                <th>Quantité</th>
                <th>Demandeur</th>
              </tr>
            </thead>
            <tbody>
              {pendingExits.map((exit, index) => (
                <tr key={exit.id} className={selectedExits.has(exit.id) ? 'selected' : ''}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={selectedExits.has(exit.id)}
                      onChange={() => toggleSelection(exit.id)}
                    />
                  </td>
                  <td>{index + 1}</td>
                  <td className="reference">{exit.productReference}</td>
                  <td className="designation">{exit.productDesignation}</td>
                  <td className="location">{getLocation(exit)}</td>
                  <td className="quantity">{exit.quantity}</td>
                  <td>{exit.requestedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-actions no-print">
            <div style={{ marginBottom: '10px', color: '#666' }}>
              {selectedExits.size} / {pendingExits.length} article{selectedExits.size > 1 ? 's' : ''} sélectionné{selectedExits.size > 1 ? 's' : ''}
            </div>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              disabled={selectedExits.size === 0}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Générer PDF et Retirer les Articles Sélectionnés
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitSheet;
