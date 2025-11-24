import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { ExitRequest } from '../types';

const MyRequests: React.FC = () => {
  const { exitRequests, currentUser, deleteExitRequest } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedBasket, setSelectedBasket] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 25;

  const myRequests = exitRequests.filter(r => r.requestedBy === currentUser?.username);

  const filteredRequests = filterStatus
    ? myRequests.filter(r => r.status === filterStatus)
    : myRequests;

  // Regrouper les demandes par panier (même requestedAt à la minute près)
  const basketsMap = useMemo(() => {
    const baskets = new Map<string, ExitRequest[]>();

    filteredRequests.forEach(request => {
      // Créer une clé unique basée sur la date/heure à la minute près
      const basketKey = `${request.requestedBy}-${new Date(request.requestedAt).toISOString().slice(0, 16)}`;

      if (!baskets.has(basketKey)) {
        baskets.set(basketKey, []);
      }
      baskets.get(basketKey)!.push(request);
    });

    return baskets;
  }, [filteredRequests]);

  // Convertir en array et trier par date
  const sortedBaskets = useMemo(() => {
    return Array.from(basketsMap.entries())
      .sort((a, b) => {
        const dateA = new Date(a[1][0].requestedAt).getTime();
        const dateB = new Date(b[1][0].requestedAt).getTime();
        return dateB - dateA;
      });
  }, [basketsMap]);

  // Pagination
  const totalPages = Math.ceil(sortedBaskets.length / itemsPerPage);
  const paginatedBaskets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedBaskets.slice(startIndex, endIndex);
  }, [sortedBaskets, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelBasket = useCallback((basketKey: string) => {
    const basket = basketsMap.get(basketKey);
    if (!basket) return;

    const pendingRequests = basket.filter(r => r.status === 'pending');
    if (pendingRequests.length === 0) {
      alert('Aucune demande en attente dans ce panier');
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir annuler les ${pendingRequests.length} demande(s) en attente de ce panier ?`)) {
      pendingRequests.forEach(request => {
        deleteExitRequest(request.id);
      });
      setSelectedBasket(null);
    }
  }, [basketsMap, deleteExitRequest]);

  const getBasketStatus = useCallback((basket: ExitRequest[]) => {
    const statuses = basket.map(r => r.status);
    if (statuses.every(s => s === 'approved')) return 'approved';
    if (statuses.every(s => s === 'rejected')) return 'rejected';
    if (statuses.every(s => s === 'pending')) return 'pending';
    return 'mixed';
  }, []);

  return (
    <div className="my-requests-page">
      <h1>Mes Demandes de Sortie</h1>

      <div className="filters">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Refusées</option>
        </select>
      </div>

      {sortedBaskets.length === 0 ? (
        <p className="no-data">Aucune demande trouvée</p>
      ) : (
        <>
          <div ref={tableRef} className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Date de la demande</th>
                  <th>Nombre d'articles</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBaskets.map(([basketKey, basket]) => {
                const basketStatus = getBasketStatus(basket);
                const firstRequest = basket[0];
                const hasPendingRequests = basket.some(r => r.status === 'pending');

                return (
                  <tr key={basketKey}>
                    <td>
                      {new Date(firstRequest.requestedAt).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(firstRequest.requestedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>{basket.length} article{basket.length > 1 ? 's' : ''}</td>
                    <td>
                      <span className={`stock-value stock-${basketStatus}`}>
                        {basketStatus === 'pending' && 'En attente'}
                        {basketStatus === 'approved' && 'Approuvé'}
                        {basketStatus === 'rejected' && 'Refusé'}
                        {basketStatus === 'mixed' && 'Mixte'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          onClick={() => setSelectedBasket(basketKey)}
                          className="btn-icon btn-edit"
                          title="Voir détails"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        {hasPendingRequests && (
                          <button
                            onClick={() => handleCancelBasket(basketKey)}
                            className="btn-icon btn-delete-red"
                            title="Annuler le panier"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '1.5rem',
            padding: '1rem'
          }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Précédent
            </button>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={page === currentPage ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{
                    padding: '0.5rem 0.75rem',
                    minWidth: '2.5rem'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Suivant
            </button>
          </div>
        )}
        </>
      )}

      {/* Modal détails du panier */}
      {selectedBasket && (
        <div className="modal-overlay" onClick={() => setSelectedBasket(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <h2>Détails du Panier</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Demandé le {new Date(basketsMap.get(selectedBasket)![0].requestedAt).toLocaleString('fr-FR')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
              {basketsMap.get(selectedBasket)!.map(request => (
                <div
                  key={request.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'var(--card-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    alignItems: 'center'
                  }}
                >
                  {request.productPhoto ? (
                    <img
                      src={request.productPhoto}
                      alt={request.productDesignation}
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  ) : (
                    <div style={{
                      width: '80px',
                      height: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      fontSize: '2rem'
                    }}>
                      📦
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{request.productDesignation}</h3>
                    <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {request.productReference}
                    </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.95rem' }}>
                      <strong>Quantité:</strong> {request.quantity}
                    </p>
                    {request.status === 'rejected' && request.notes && (
                      <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.9rem' }}>
                        <strong>Raison:</strong> {request.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button onClick={() => setSelectedBasket(null)} className="btn btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
