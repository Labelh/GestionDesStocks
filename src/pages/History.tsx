import React, { useState } from 'react';
import { useApp } from '../context/AppContextSupabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const History: React.FC = () => {
  const { stockMovements, products } = useApp();
  const [filterProduct, setFilterProduct] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const filteredMovements = stockMovements.filter(movement => {
    const matchesProduct = !filterProduct || movement.productId === filterProduct;
    const matchesType = !filterType || movement.movementType === filterType;
    const matchesUser = !filterUser || movement.userId === filterUser;

    let matchesDate = true;
    if (dateFrom || dateTo) {
      const movementDate = new Date(movement.timestamp);
      if (dateFrom) {
        matchesDate = matchesDate && movementDate >= new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && movementDate <= toDate;
      }
    }

    return matchesProduct && matchesType && matchesUser && matchesDate;
  });

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'entry': return 'Entrée';
      case 'exit': return 'Sortie';
      case 'adjustment': return 'Ajustement';
      case 'initial': return 'Initial';
      default: return type;
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'entry': return 'movement-entry';
      case 'exit': return 'movement-exit';
      case 'adjustment': return 'movement-adjustment';
      case 'initial': return 'movement-initial';
      default: return '';
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // En-tête
    doc.setFontSize(20);
    doc.text('Historique des Mouvements de Stock', 14, 22);
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 30);

    // Filtres appliqués
    let yPos = 36;
    doc.setFontSize(9);
    if (filterProduct || filterType || filterUser || dateFrom || dateTo) {
      doc.text('Filtres appliqués:', 14, yPos);
      yPos += 5;
      if (filterProduct) {
        const product = products.find(p => p.id === filterProduct);
        doc.text(`- Produit: ${product?.designation || 'N/A'}`, 14, yPos);
        yPos += 5;
      }
      if (filterType) {
        doc.text(`- Type: ${getMovementTypeLabel(filterType)}`, 14, yPos);
        yPos += 5;
      }
      if (dateFrom || dateTo) {
        const dateRange = `Du ${dateFrom || 'début'} au ${dateTo || 'aujourd\'hui'}`;
        doc.text(`- Période: ${dateRange}`, 14, yPos);
        yPos += 5;
      }
      yPos += 3;
    }

    // Tableau
    const tableData = filteredMovements.map(movement => [
      new Date(movement.timestamp).toLocaleString('fr-FR'),
      movement.productReference,
      movement.productDesignation,
      getMovementTypeLabel(movement.movementType),
      movement.quantity.toString(),
      movement.previousStock.toString(),
      movement.newStock.toString(),
      movement.userName,
      movement.reason,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date/Heure', 'Référence', 'Produit', 'Type', 'Quantité', 'Stock avant', 'Stock après', 'Utilisateur', 'Motif']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [197, 90, 58] },
    });

    doc.save(`historique_stock_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    const data = filteredMovements.map(movement => ({
      'Date/Heure': new Date(movement.timestamp).toLocaleString('fr-FR'),
      'Référence': movement.productReference,
      'Produit': movement.productDesignation,
      'Type': getMovementTypeLabel(movement.movementType),
      'Quantité': movement.quantity,
      'Stock avant': movement.previousStock,
      'Stock après': movement.newStock,
      'Utilisateur': movement.userName,
      'Motif': movement.reason,
      'Notes': movement.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historique');

    // Ajuster la largeur des colonnes
    const maxWidth = data.reduce((w, r) => Math.max(w, r['Date/Heure'].length), 10);
    worksheet['!cols'] = [
      { wch: maxWidth },
      { wch: 12 },
      { wch: 30 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 40 },
      { wch: 40 },
    ];

    XLSX.writeFile(workbook, `historique_stock_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const uniqueUsers = Array.from(new Set(stockMovements.map(m => ({ id: m.userId, name: m.userName }))
    .map(u => JSON.stringify(u))))
    .map(u => JSON.parse(u));

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMovements = filteredMovements.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterProduct, filterType, filterUser, dateFrom, dateTo]);

  return (
    <div className="history-page">
      <h1>Historique</h1>

      {/* Stats en haut */}
      <div className="movements-stats">
        <div className="stat-card">
          <h4>Total des mouvements</h4>
          <span className="stat-value">{filteredMovements.length}</span>
        </div>
        <div className="stat-card">
          <h4>Entrées</h4>
          <span className="stat-value entry">{filteredMovements.filter(m => m.movementType === 'entry').length}</span>
        </div>
        <div className="stat-card">
          <h4>Sorties</h4>
          <span className="stat-value exit">{filteredMovements.filter(m => m.movementType === 'exit').length}</span>
        </div>
        <div className="stat-card">
          <h4>Ajustements</h4>
          <span className="stat-value adjustment">{filteredMovements.filter(m => m.movementType === 'adjustment').length}</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-card">
        <h3>Filtres</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Produit</label>
            <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
              <option value="">Tous les produits</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.reference} - {product.designation}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Type de mouvement</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Tous les types</option>
              <option value="entry">Entrée</option>
              <option value="exit">Sortie</option>
              <option value="adjustment">Ajustement</option>
              <option value="initial">Initial</option>
            </select>
          </div>

          <div className="form-group">
            <label>Utilisateur</label>
            <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="">Tous les utilisateurs</option>
              {uniqueUsers.map((user: any) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date de début</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Date de fin</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ opacity: 0 }}>Actions</label>
            <button
              onClick={() => {
                setFilterProduct('');
                setFilterType('');
                setFilterUser('');
                setDateFrom('');
                setDateTo('');
              }}
              className="btn btn-secondary"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Boutons d'exportation en dessous des filtres */}
      <div className="export-buttons-section">
        <div className="export-group">
          <h3>Exporter l'historique</h3>
          <div className="export-buttons-row">
            <button onClick={exportToPDF} className="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
              </svg>
              Export PDF
            </button>
            <button onClick={exportToExcel} className="btn btn-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/>
              </svg>
              Export Excel
            </button>
          </div>
        </div>
        <div className="export-group">
          <h3>Exporter les produits</h3>
          <div className="export-buttons-row">
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
        </div>
      </div>

      {filteredMovements.length === 0 ? (
        <p className="no-data">Aucun mouvement trouvé</p>
      ) : (
        <div className="movements-table-container">
          <table className="movements-table">
            <thead>
              <tr>
                <th>Date/Heure</th>
                <th>Produit</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Stock avant</th>
                <th>Stock après</th>
                <th>Utilisateur</th>
                <th>Motif</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.map(movement => (
                <tr key={movement.id} className={getMovementTypeColor(movement.movementType)}>
                  <td className="date-cell">
                    {new Date(movement.timestamp).toLocaleDateString('fr-FR')}
                    <br />
                    <small>{new Date(movement.timestamp).toLocaleTimeString('fr-FR')}</small>
                  </td>
                  <td>
                    <strong>{movement.productReference}</strong>
                    <br />
                    <small>{movement.productDesignation}</small>
                  </td>
                  <td>
                    <span className={`type-badge ${getMovementTypeColor(movement.movementType)}`}>
                      {getMovementTypeLabel(movement.movementType)}
                    </span>
                  </td>
                  <td className="quantity-cell">
                    {movement.movementType === 'exit' ? '-' : '+'}{movement.quantity}
                  </td>
                  <td>{movement.previousStock}</td>
                  <td><strong>{movement.newStock}</strong></td>
                  <td>{movement.userName}</td>
                  <td>{movement.reason}</td>
                  <td>{movement.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

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
              <div className="pagination-info">
                Page {currentPage} sur {totalPages} ({filteredMovements.length} mouvements)
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
              >
                Suivant →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default History;
