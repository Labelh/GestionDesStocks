import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { ExitRequest } from '../types';

const Requests: React.FC = () => {
  const { exitRequests, updateExitRequest, currentUser, getProductById } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [selectedBasket, setSelectedBasket] = useState<string | null>(null);
  const [rejectingBasket, setRejectingBasket] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const filteredRequests = filterStatus
    ? exitRequests.filter(r => r.status === filterStatus)
    : exitRequests;

  // Regrouper les demandes par panier (même requestedBy + requestedAt à la minute près)
  const basketsMap = useMemo(() => {
    const baskets = new Map<string, ExitRequest[]>();

    filteredRequests.forEach(request => {
      // Créer une clé unique basée sur l'utilisateur et la date/heure à la minute près
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

  const handleApproveBasket = useCallback(async (basketKey: string) => {
    const basket = basketsMap.get(basketKey);
    if (!basket) return;

    const pendingRequests = basket.filter(r => r.status === 'pending');
    if (pendingRequests.length === 0) {
      alert('Aucune demande en attente dans ce panier');
      return;
    }

    if (!window.confirm(`Approuver ${pendingRequests.length} demande(s) de ce panier ?`)) {
      return;
    }

    try {
      for (const request of pendingRequests) {
        await updateExitRequest(request.id, {
          status: 'approved',
          approvedBy: currentUser?.id,
          approvedAt: new Date(),
        });
      }
      setSelectedBasket(null);
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      alert('Erreur lors de l\'approbation du panier');
    }
  }, [basketsMap, updateExitRequest, currentUser]);

  const handleRejectBasket = useCallback(async (basketKey: string) => {
    if (!notes.trim()) {
      alert('Veuillez indiquer la raison du refus');
      return;
    }

    const basket = basketsMap.get(basketKey);
    if (!basket) return;

    const pendingRequests = basket.filter(r => r.status === 'pending');
    if (pendingRequests.length === 0) {
      alert('Aucune demande en attente dans ce panier');
      return;
    }

    try {
      for (const request of pendingRequests) {
        await updateExitRequest(request.id, {
          status: 'rejected',
          approvedBy: currentUser?.id,
          approvedAt: new Date(),
          notes: notes,
        });
      }
      setRejectingBasket(null);
      setSelectedBasket(null);
      setNotes('');
    } catch (error) {
      console.error('Erreur lors du refus:', error);
      alert('Erreur lors du refus du panier');
    }
  }, [basketsMap, notes, updateExitRequest, currentUser]);

  const getBasketStatus = useCallback((basket: ExitRequest[]) => {
    const statuses = basket.map(r => r.status);
    if (statuses.every(s => s === 'approved')) return 'approved';
    if (statuses.every(s => s === 'rejected')) return 'rejected';
    if (statuses.every(s => s === 'pending')) return 'pending';
    return 'mixed';
  }, []);

  return (
    <div className="requests-page">
      <h1>Gestion des Demandes</h1>

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
        <div className="requests-list">
          {sortedBaskets.map(([basketKey, basket]) => {
            const basketStatus = getBasketStatus(basket);
            const firstRequest = basket[0];
            const hasPendingRequests = basket.some(r => r.status === 'pending');
            const totalQuantity = basket.reduce((sum, r) => sum + r.quantity, 0);

            return (
              <div key={basketKey} className={`request-item ${basketStatus}`}>
                <div className="request-main">
                  <div className="request-info">
                    <div className="request-product-ref">Panier de {basket.length} article{basket.length > 1 ? 's' : ''}</div>
                    <h3>
                      {new Date(firstRequest.requestedAt).toLocaleDateString('fr-FR')} à {new Date(firstRequest.requestedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </h3>
                    <p><strong>Demandé par:</strong> {firstRequest.requestedBy}</p>
                    <p><strong>Nombre d'articles:</strong> {basket.length}</p>
                    <p><strong>Quantité totale:</strong> {totalQuantity}</p>
                    <p><strong>Date:</strong> {new Date(firstRequest.requestedAt).toLocaleString('fr-FR')}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                      <button
                        onClick={() => setSelectedBasket(selectedBasket === basketKey ? null : basketKey)}
                        className="btn btn-secondary"
                      >
                        {selectedBasket === basketKey ? 'Masquer les détails' : 'Voir les détails'}
                      </button>
                      {hasPendingRequests && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleApproveBasket(basketKey)}
                            className="btn-icon btn-approve"
                            title="Approuver le panier"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => setRejectingBasket(basketKey)}
                            className="btn-icon btn-reject"
                            title="Refuser le panier"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {rejectingBasket === basketKey && (
                  <div className="reject-form">
                    <textarea
                      placeholder="Raison du refus..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                    <div className="reject-actions">
                      <button onClick={() => { setRejectingBasket(null); setNotes(''); }} className="btn btn-secondary">
                        Annuler
                      </button>
                      <button onClick={() => handleRejectBasket(basketKey)} className="btn btn-danger">
                        Confirmer le Refus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal détails du panier */}
      {selectedBasket && (
        <div className="modal-overlay" onClick={() => setSelectedBasket(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <h2>Détails du Panier</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Demandé par {basketsMap.get(selectedBasket)![0].requestedBy} le {new Date(basketsMap.get(selectedBasket)![0].requestedAt).toLocaleString('fr-FR')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
              {basketsMap.get(selectedBasket)!.map(request => {
                const product = getProductById(request.productId);
                const hasInsufficientStock = product && product.currentStock < request.quantity;

                return (
                  <div
                    key={request.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1rem',
                      background: 'var(--card-bg)',
                      borderRadius: '8px',
                      border: hasInsufficientStock ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                      alignItems: 'center'
                    }}
                  >
                    {product && product.photo ? (
                      <img
                        src={product.photo}
                        alt={request.productDesignation}
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    ) : (
                      <div style={{
                        width: '100px',
                        height: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        fontSize: '2.5rem'
                      }}>
                        📦
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{request.productDesignation}</h3>
                      <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {request.productReference}
                      </p>
                      <p style={{ margin: '0.25rem 0', fontSize: '1rem' }}>
                        <strong>Quantité demandée:</strong> {request.quantity} {product?.unit}
                      </p>
                      {product && (
                        <p style={{
                          margin: '0.25rem 0',
                          fontSize: '0.95rem',
                          color: hasInsufficientStock ? '#f59e0b' : 'var(--text-color)'
                        }}>
                          <strong>Stock actuel:</strong> {product.currentStock} {product.unit}
                          {hasInsufficientStock && ' ⚠️ Stock insuffisant'}
                        </p>
                      )}
                      {request.status === 'rejected' && request.notes && (
                        <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.9rem' }}>
                          <strong>Raison du refus:</strong> {request.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
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

export default Requests;
