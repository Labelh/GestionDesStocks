import React, { useState } from 'react';
import { useApp } from '../context/AppContextSupabase';

const Requests: React.FC = () => {
  const { exitRequests, updateExitRequest, currentUser, getProductById } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const filteredRequests = filterStatus
    ? exitRequests.filter(r => r.status === filterStatus)
    : exitRequests;

  const sortedRequests = [...filteredRequests].sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );

  const handleApprove = async (requestId: string) => {
    try {
      await updateExitRequest(requestId, {
        status: 'approved',
        approvedBy: currentUser?.id,
        approvedAt: new Date(),
      });
      setSelectedRequest(null);
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      alert('Erreur lors de l\'approbation de la demande');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!notes.trim()) {
      alert('Veuillez indiquer la raison du refus');
      return;
    }
    try {
      await updateExitRequest(requestId, {
        status: 'rejected',
        approvedBy: currentUser?.id,
        approvedAt: new Date(),
        notes: notes,
      });
      setSelectedRequest(null);
      setNotes('');
    } catch (error) {
      console.error('Erreur lors du refus:', error);
      alert('Erreur lors du refus de la demande');
    }
  };

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

      {sortedRequests.length === 0 ? (
        <p className="no-data">Aucune demande trouvée</p>
      ) : (
        <div className="requests-list">
          {sortedRequests.map(request => {
            const product = getProductById(request.productId);
            return (
              <div key={request.id} className={`request-item ${request.status}`}>
                {product && product.photo && (
                  <div className="request-photo">
                    <img src={product.photo} alt={request.productDesignation} />
                  </div>
                )}
                <div className="request-main">
                  <div className="request-info">
                    <div className="request-product-ref">{request.productReference}</div>
                    <h3>{request.productDesignation}</h3>
                    <p><strong>Demandé par:</strong> {request.requestedBy}</p>
                    <p><strong>Quantité:</strong> {request.quantity}</p>
                    <p><strong>Date:</strong> {new Date(request.requestedAt).toLocaleString()}</p>
                    {product && (
                      <p className={product.currentStock < request.quantity ? 'stock-warning' : ''}>
                        <strong>Stock actuel:</strong> {product.currentStock} {product.unit}
                        {product.currentStock < request.quantity && ' ⚠️ Stock insuffisant'}
                      </p>
                    )}
                    {request.status !== 'pending' && (
                      <>
                        <p><strong>Traité par:</strong> {request.approvedBy}</p>
                        <p><strong>Date de traitement:</strong> {request.approvedAt ? new Date(request.approvedAt).toLocaleString() : '-'}</p>
                        {request.notes && <p><strong>Notes:</strong> {request.notes}</p>}
                      </>
                    )}
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="request-actions">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="btn-icon btn-approve"
                      title="Approuver"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedRequest(request.id)}
                      className="btn-icon btn-reject"
                      title="Refuser"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                )}

                {selectedRequest === request.id && (
                  <div className="reject-form">
                    <textarea
                      placeholder="Raison du refus..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                    <div className="reject-actions">
                      <button onClick={() => { setSelectedRequest(null); setNotes(''); }} className="btn btn-secondary">
                        Annuler
                      </button>
                      <button onClick={() => handleReject(request.id)} className="btn btn-danger">
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
    </div>
  );
};

export default Requests;
