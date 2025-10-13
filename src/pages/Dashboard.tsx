import React from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { products, exitRequests, getStockAlerts } = useApp();
  const alerts = getStockAlerts();
  const pendingRequests = exitRequests.filter(r => r.status === 'pending');

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

      {alerts.length > 0 && (
        <div className="alerts-section">
          <h2>Alertes de Stock</h2>
          <div className="alerts-list">
            {alerts.map(alert => (
              <div
                key={alert.product.id}
                className={`alert-card ${alert.alertType}`}
              >
                <div className="alert-header">
                  <h3>{alert.product.reference} - {alert.product.designation}</h3>
                  <span className="alert-badge">
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
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className="pending-requests-section">
          <h2>Demandes en Attente</h2>
          <Link to="/requests" className="btn btn-primary">
            Voir toutes les demandes ({pendingRequests.length})
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
