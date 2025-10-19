import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { ExitRequest } from '../types';

const MyRequests: React.FC = () => {
  const { exitRequests, currentUser, deleteExitRequest } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedBasket, setSelectedBasket] = useState<string | null>(null);

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Refusée';
      default: return status;
    }
  };

  const handleCancelBasket = (basketKey: string) => {
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
  };

  const getBasketStatus = (basket: ExitRequest[]) => {
    const statuses = basket.map(r => r.status);
    if (statuses.every(s => s === 'approved')) return 'approved';
    if (statuses.every(s => s === 'rejected')) return 'rejected';
    if (statuses.every(s => s === 'pending')) return 'pending';
    return 'mixed';
  };

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
        <div className="requests-grid">
          {sortedBaskets.map(([basketKey, basket]) => {
            const basketStatus = getBasketStatus(basket);
            const firstRequest = basket[0];
            const hasPendingRequests = basket.some(r => r.status === 'pending');

            return (
              <div
                key={basketKey}
                className={`request-card ${basketStatus}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedBasket(selectedBasket === basketKey ? null : basketKey)}
              >
                <div className="request-content-wrapper">
                  <div className="request-product-photo-placeholder" style={{ fontSize: '2rem' }}>
                    🛒
                  </div>
                  <div className="request-details">
                    <h3 className="request-designation">Panier de {basket.length} article{basket.length > 1 ? 's' : ''}</h3>
                    <p className="request-reference">
                      <span className="product-reference-highlight">
                        {new Date(firstRequest.requestedAt).toLocaleDateString('fr-FR')} à {new Date(firstRequest.requestedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="request-body">
                  <p><strong>Statut:</strong> <span className={`status-badge ${basketStatus}`}>
                    {basketStatus === 'mixed' ? 'Mixte' : getStatusLabel(basketStatus)}
                  </span></p>
                  <p><strong>Demandé le:</strong> {new Date(firstRequest.requestedAt).toLocaleString('fr-FR')}</p>
                  {hasPendingRequests && (
                    <div style={{ marginTop: '1rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelBasket(basketKey);
                        }}
                        className="btn btn-danger"
                      >
                        Annuler le panier
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
                      <strong>Référence:</strong> {request.productReference}
                    </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.95rem' }}>
                      <strong>Quantité:</strong> {request.quantity}
                    </p>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Statut:</strong> <span className={`status-badge ${request.status}`}>{getStatusLabel(request.status)}</span>
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
