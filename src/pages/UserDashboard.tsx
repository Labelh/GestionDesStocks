import React from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';

const UserDashboard: React.FC = () => {
  const { products, exitRequests, currentUser } = useApp();

  const myRequests = exitRequests.filter(r => r.requestedBy === currentUser?.username);
  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const approvedRequests = myRequests.filter(r => r.status === 'approved');
  const rejectedRequests = myRequests.filter(r => r.status === 'rejected');

  const availableProducts = products.filter(p => p.currentStock > 0);

  return (
    <div className="user-dashboard">
      <h1>Tableau de Bord Utilisateur</h1>
      <p className="welcome-text">Bienvenue, {currentUser?.name}</p>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Produits Disponibles</h3>
          <p className="stat-value">{availableProducts.length}</p>
        </div>
        <div className="stat-card warning">
          <h3>Demandes en Attente</h3>
          <p className="stat-value">{pendingRequests.length}</p>
        </div>
        <div className="stat-card success">
          <h3>Demandes Approuvées</h3>
          <p className="stat-value">{approvedRequests.length}</p>
        </div>
        <div className="stat-card danger">
          <h3>Demandes Refusées</h3>
          <p className="stat-value">{rejectedRequests.length}</p>
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/new-request" className="btn btn-primary btn-large">
          + Nouvelle Demande de Sortie
        </Link>
        <Link to="/my-requests" className="btn btn-secondary btn-large">
          Voir Mes Demandes
        </Link>
      </div>

      {pendingRequests.length > 0 && (
        <div className="recent-requests">
          <h2>Demandes en Attente</h2>
          <div className="requests-list">
            {pendingRequests.slice(0, 5).map(request => (
              <div key={request.id} className="request-card pending">
                <h3>{request.productReference} - {request.productDesignation}</h3>
                <p>Quantité: {request.quantity}</p>
                <p className="date">
                  Demandé le {new Date(request.requestedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
