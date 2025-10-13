import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const MyRequests: React.FC = () => {
  const { exitRequests, currentUser } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('');

  const myRequests = exitRequests.filter(r => r.requestedBy === currentUser?.username);

  const filteredRequests = filterStatus
    ? myRequests.filter(r => r.status === filterStatus)
    : myRequests;

  const sortedRequests = [...filteredRequests].sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Refusée';
      default: return status;
    }
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

      {sortedRequests.length === 0 ? (
        <p className="no-data">Aucune demande trouvée</p>
      ) : (
        <div className="requests-grid">
          {sortedRequests.map(request => (
            <div key={request.id} className={`request-card ${request.status}`}>
              <div className="request-header">
                <h3>{request.productReference} - {request.productDesignation}</h3>
                <span className={`status-badge ${request.status}`}>
                  {getStatusLabel(request.status)}
                </span>
              </div>
              <div className="request-body">
                <p><strong>Quantité:</strong> {request.quantity}</p>
                <p><strong>Raison:</strong> {request.reason}</p>
                <p><strong>Demandé le:</strong> {new Date(request.requestedAt).toLocaleString()}</p>
                {request.status === 'approved' && request.approvedBy && (
                  <>
                    <p><strong>Approuvé par:</strong> {request.approvedBy}</p>
                    <p><strong>Approuvé le:</strong> {request.approvedAt ? new Date(request.approvedAt).toLocaleString() : '-'}</p>
                  </>
                )}
                {request.status === 'rejected' && (
                  <p className="rejection-reason"><strong>Raison du refus:</strong> {request.notes || 'Non spécifiée'}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
