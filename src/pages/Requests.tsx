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

  const handleApprove = (requestId: string) => {
    updateExitRequest(requestId, {
      status: 'approved',
      approvedBy: currentUser?.username,
      approvedAt: new Date(),
    });
    setSelectedRequest(null);
  };

  const handleReject = (requestId: string) => {
    if (!notes.trim()) {
      alert('Veuillez indiquer la raison du refus');
      return;
    }
    updateExitRequest(requestId, {
      status: 'rejected',
      approvedBy: currentUser?.username,
      approvedAt: new Date(),
      notes: notes,
    });
    setSelectedRequest(null);
    setNotes('');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Refusée';
      default: return status;
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
                <div className="request-main">
                  <div className="request-info">
                    <h3>{request.productReference} - {request.productDesignation}</h3>
                    <p><strong>Demandé par:</strong> {request.requestedBy}</p>
                    <p><strong>Quantité:</strong> {request.quantity}</p>
                    <p><strong>Raison:</strong> {request.reason}</p>
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
                  <div className="request-status">
                    <span className={`status-badge ${request.status}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="request-actions">
                    {product && product.currentStock >= request.quantity ? (
                      <>
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="btn btn-success"
                        >
                          ✓ Approuver
                        </button>
                        <button
                          onClick={() => setSelectedRequest(request.id)}
                          className="btn btn-danger"
                        >
                          ✗ Refuser
                        </button>
                      </>
                    ) : (
                      <div className="stock-error">
                        Stock insuffisant pour approuver cette demande
                        <button
                          onClick={() => setSelectedRequest(request.id)}
                          className="btn btn-danger"
                        >
                          ✗ Refuser
                        </button>
                      </div>
                    )}
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
