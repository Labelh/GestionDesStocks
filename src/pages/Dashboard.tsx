import React, { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { useNotifications } from '../components/NotificationSystem';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { products, exitRequests, stockMovements, getStockAlerts, getProductById, updateExitRequest, currentUser } = useApp();
  const { addNotification } = useNotifications();
  const alerts = getStockAlerts();
  const pendingRequests = exitRequests.filter(r => r.status === 'pending');

  // Calculer les statistiques de consommation du mois
  const consumptionStats = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
    const monthMovements = stockMovements.filter(
      m => m.movementType === 'exit' && m.timestamp >= monthAgo
    );

    const totalExits = monthMovements.reduce((sum, m) => sum + m.quantity, 0);
    const avgDailyConsumption = (totalExits / 30).toFixed(1);

    // Top 3 des produits les plus consommés
    const productConsumption: { [key: string]: { name: string; quantity: number } } = {};
    monthMovements.forEach(m => {
      if (!productConsumption[m.productId]) {
        productConsumption[m.productId] = { name: m.productDesignation, quantity: 0 };
      }
      productConsumption[m.productId].quantity += m.quantity;
    });

    const topProducts = Object.values(productConsumption)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    return { totalExits, avgDailyConsumption, topProducts };
  }, [stockMovements]);

  const handleApprove = async (requestId: string) => {
    try {
      await updateExitRequest(requestId, {
        status: 'approved',
        approvedBy: currentUser?.id,
        approvedAt: new Date(),
      });
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      alert('Erreur lors de l\'approbation de la demande');
    }
  };

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
      </div>

      {/* Widget Statistiques de Consommation */}
      <div className="consumption-widget">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Consommation ce mois</h2>
          <Link to="/statistics" className="btn btn-secondary">
            Voir les statistiques détaillées
          </Link>
        </div>
        <div className="consumption-stats-grid">
          <div className="consumption-stat">
            <div className="consumption-icon">📉</div>
            <div>
              <h3>Sorties totales</h3>
              <p className="stat-value">{consumptionStats.totalExits}</p>
            </div>
          </div>
          <div className="consumption-stat">
            <div className="consumption-icon">📊</div>
            <div>
              <h3>Moyenne journalière</h3>
              <p className="stat-value">{consumptionStats.avgDailyConsumption}</p>
            </div>
          </div>
        </div>
        {consumptionStats.topProducts.length > 0 && (
          <div className="top-consumed">
            <h3>Top 3 - Produits les plus consommés</h3>
            <div className="top-consumed-list">
              {consumptionStats.topProducts.map((product, idx) => (
                <div key={idx} className="top-consumed-item">
                  <span className={`rank rank-${idx + 1}`}>{idx + 1}</span>
                  <span className="product-name">{product.name}</span>
                  <span className="product-quantity">{product.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Demandes en Attente de Validation */}
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
                    {product && (
                      <p className={product.currentStock < request.quantity ? 'stock-warning' : ''}>
                        <strong>Stock:</strong> {product.currentStock} {product.unit}
                        {product.currentStock < request.quantity && ' ⚠️'}
                      </p>
                    )}
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      {new Date(request.requestedAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="btn btn-success btn-icon-only"
                        title="Approuver la demande"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </button>
                    </div>
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
