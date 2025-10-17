import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { PendingExit } from '../types';
import './ExitSheet.css';

const ExitSheet: React.FC = () => {
  const { getPendingExits, clearPendingExits } = useApp();
  const [pendingExits, setPendingExits] = useState<PendingExit[]>([]);

  useEffect(() => {
    loadPendingExits();
  }, []);

  const loadPendingExits = () => {
    setPendingExits(getPendingExits());
  };

  const handlePrint = () => {
    window.print();
    // Après l'impression, vider le tableau
    setTimeout(() => {
      clearPendingExits();
      setPendingExits([]);
    }, 500);
  };

  const getLocation = (exit: PendingExit): string => {
    const parts: string[] = [];
    if (exit.storageZone) parts.push(exit.storageZone);
    if (exit.shelf) parts.push(`Étagère ${exit.shelf}`);
    if (exit.position) parts.push(`Position ${exit.position}`);
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
        <button
          onClick={handlePrint}
          className="btn btn-primary"
          disabled={pendingExits.length === 0}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Imprimer et Vider
        </button>
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
                <th>N°</th>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Emplacement</th>
                <th>Quantité</th>
                <th>Demandeur</th>
                <th className="no-print">Récupéré</th>
              </tr>
            </thead>
            <tbody>
              {pendingExits.map((exit, index) => (
                <tr key={exit.id}>
                  <td>{index + 1}</td>
                  <td className="reference">{exit.productReference}</td>
                  <td className="designation">{exit.productDesignation}</td>
                  <td className="location">{getLocation(exit)}</td>
                  <td className="quantity">{exit.quantity}</td>
                  <td>{exit.requestedBy}</td>
                  <td className="checkbox-cell">
                    <div className="checkbox"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="print-footer">
            <div className="signature-section">
              <div className="signature-box">
                <div className="signature-label">Préparé par:</div>
                <div className="signature-line"></div>
              </div>
              <div className="signature-box">
                <div className="signature-label">Vérifié par:</div>
                <div className="signature-line"></div>
              </div>
              <div className="signature-box">
                <div className="signature-label">Reçu par:</div>
                <div className="signature-line"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitSheet;
