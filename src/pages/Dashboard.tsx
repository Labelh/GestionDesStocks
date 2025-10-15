import React, { useEffect } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { useNotifications } from '../components/NotificationSystem';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { products, exitRequests, getStockAlerts, stockMovements, getProductById } = useApp();
  const { addNotification } = useNotifications();
  const alerts = getStockAlerts();
  const pendingRequests = exitRequests.filter(r => r.status === 'pending');
  const awaitingReceptionRequests = exitRequests.filter(r => r.status === 'awaiting_reception');
  const approvedRequests = exitRequests.filter(r => r.status === 'approved');

  // Notifications automatiques pour les stocks faibles
  useEffect(() => {
    const criticalAlerts = alerts.filter(a => a.alertType === 'critical');
    const lowAlerts = alerts.filter(a => a.alertType === 'low');

    if (criticalAlerts.length > 0) {
      addNotification({
        type: 'error',
        title: 'Stock critique!',
        message: `${criticalAlerts.length} produit(s) en stock critique nécessitent une attention immédiate.`,
        duration: 8000,
      });
    } else if (lowAlerts.length > 0) {
      addNotification({
        type: 'warning',
        title: 'Stock faible',
        message: `${lowAlerts.length} produit(s) ont un stock faible.`,
        duration: 6000,
      });
    }

    if (pendingRequests.length > 0) {
      addNotification({
        type: 'info',
        title: 'Demandes en attente',
        message: `Vous avez ${pendingRequests.length} demande(s) en attente de validation.`,
        duration: 6000,
      });
    }
  }, []); // Exécuté uniquement au montage du composant

  const totalProducts = products.length;
  const lowStockCount = alerts.filter(a => a.alertType === 'low').length;
  const criticalStockCount = alerts.filter(a => a.alertType === 'critical').length;

  // Calculer la valeur totale du stock (approximation)
  const totalStockValue = products.reduce((sum, p) => sum + p.currentStock, 0);

  // Activités récentes (10 derniers mouvements)
  const recentActivities = stockMovements.slice(0, 10);

  // Statistiques des mouvements du jour
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMovements = stockMovements.filter(m => {
    const movementDate = new Date(m.timestamp);
    movementDate.setHours(0, 0, 0, 0);
    return movementDate.getTime() === today.getTime();
  });
  const todayEntries = todayMovements.filter(m => m.movementType === 'entry').length;
  const todayExits = todayMovements.filter(m => m.movementType === 'exit').length;

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'entry': return 'Entrée';
      case 'exit': return 'Sortie';
      case 'adjustment': return 'Ajustement';
      case 'initial': return 'Initial';
      default: return type;
    }
  };

  return (
    <div className="dashboard">
      <h1>Dashboard Gestionnaire</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Produits</h3>
          <p className="stat-value">{totalProducts}</p>
        </div>
        <div className="stat-card warning">
          <h3>Stock Faible</h3>
          <p className="stat-value">{lowStockCount}</p>
        </div>
        <div className="stat-card danger">
          <h3>Stock Critique</h3>
          <p className="stat-value">{criticalStockCount}</p>
        </div>
        <div className="stat-card info">
          <h3>Demandes en Attente</h3>
          <p className="stat-value">{pendingRequests.length}</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
          <h3>En Attente de Réception</h3>
          <p className="stat-value">{awaitingReceptionRequests.length}</p>
        </div>
        <div className="stat-card success">
          <h3>Commandes Réceptionnées</h3>
          <p className="stat-value">{approvedRequests.length}</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <h3>Quantité Totale en Stock</h3>
          <p className="stat-value">{totalStockValue.toFixed(0)}</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}>
          <h3>Mouvements Aujourd'hui</h3>
          <p className="stat-value">{todayMovements.length}</p>
          <small style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            ↑ {todayEntries} entrées · ↓ {todayExits} sorties
          </small>
        </div>
      </div>

      {/* Activité Récente */}
      <div className="recent-activity-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Activité Récente</h2>
          <Link to="/history" className="btn btn-secondary">Voir l'historique complet</Link>
        </div>
        {recentActivities.length === 0 ? (
          <p className="no-data">Aucune activité récente</p>
        ) : (
          <div className="activity-list">
            {recentActivities.map(activity => (
              <div key={activity.id} className={`activity-item movement-${activity.movementType}`}>
                <div className="activity-icon">
                  {activity.movementType === 'entry' && '↑'}
                  {activity.movementType === 'exit' && '↓'}
                  {activity.movementType === 'adjustment' && '⚙'}
                  {activity.movementType === 'initial' && '★'}
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <strong>{activity.productReference}</strong> - {activity.productDesignation}
                    <span className={`type-badge movement-${activity.movementType}`}>
                      {getMovementTypeLabel(activity.movementType)}
                    </span>
                  </div>
                  <div className="activity-details">
                    <span>Quantité: <strong>{activity.quantity}</strong></span>
                    <span>•</span>
                    <span>{activity.previousStock} → {activity.newStock}</span>
                    <span>•</span>
                    <span>{activity.userName}</span>
                    <span>•</span>
                    <span className="activity-date">
                      {new Date(activity.timestamp).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {activity.reason && (
                    <div className="activity-reason">{activity.reason}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demandes en Attente Améliorées */}
      {pendingRequests.length > 0 && (
        <div className="pending-requests-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Demandes en Attente de Validation</h2>
            <Link to="/requests" className="btn btn-primary">
              Gérer les demandes
            </Link>
          </div>
          <div className="requests-grid">
            {pendingRequests.slice(0, 5).map(request => {
              const product = getProductById(request.productId);
              return (
                <div key={request.id} className="request-card pending">
                  <div className="request-card-header">
                    {product && product.photo && (
                      <img src={product.photo} alt={request.productDesignation} className="request-card-photo" />
                    )}
                    <div>
                      <h3>{request.productReference}</h3>
                      <p>{request.productDesignation}</p>
                    </div>
                  </div>
                  <div className="request-card-body">
                    <p><strong>Demandé par:</strong> {request.requestedBy}</p>
                    <p><strong>Quantité:</strong> {request.quantity}</p>
                    <p><strong>Raison:</strong> {request.reason}</p>
                    {product && (
                      <p className={product.currentStock < request.quantity ? 'stock-warning' : ''}>
                        <strong>Stock:</strong> {product.currentStock} {product.unit}
                        {product.currentStock < request.quantity && ' ⚠️'}
                      </p>
                    )}
                  </div>
                  <div className="request-card-footer">
                    <small>{new Date(request.requestedAt).toLocaleString()}</small>
                  </div>
                </div>
              );
            })}
          </div>
          {pendingRequests.length > 5 && (
            <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)' }}>
              + {pendingRequests.length - 5} autre(s) demande(s)
            </p>
          )}
        </div>
      )}

      {/* Alertes de Stock */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h2>Alertes de Stock</h2>
          <div className="alerts-list">
            {alerts.slice(0, 5).map(alert => (
              <div
                key={alert.product.id}
                className={`alert-card ${alert.alertType}`}
              >
                <div className="alert-header">
                  <h3>{alert.product.reference} - {alert.product.designation}</h3>
                  <span className={`alert-badge ${alert.alertType}`}>
                    {alert.alertType === 'critical' ? 'Critique' : 'Faible'}
                  </span>
                </div>
                <div className="alert-details">
                  <p>
                    <strong>Stock actuel:</strong> {alert.product.currentStock} {alert.product.unit}
                  </p>
                  <p>
                    <strong>Stock minimum:</strong> {alert.product.minStock} {alert.product.unit}
                  </p>
                  <p>
                    <strong>Emplacement:</strong> {alert.product.location}
                  </p>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${alert.alertType}`}
                      style={{ width: `${alert.percentage}%` }}
                    ></div>
                  </div>
                  <p className="percentage">{alert.percentage}% du stock maximum</p>
                </div>
              </div>
            ))}
          </div>
          {alerts.length > 5 && (
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/products" className="btn btn-secondary">
                Voir tous les produits
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
