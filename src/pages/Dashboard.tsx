import React, { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { useNotifications } from '../components/NotificationSystem';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { products, exitRequests, stockMovements, getStockAlerts } = useApp();
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

  // Calculer les prévisions de rupture de stock
  const stockPredictions = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return products
      .map(product => {
        // Calculer la consommation mensuelle pour ce produit
        const productExits = stockMovements.filter(
          m => m.productId === product.id &&
               m.movementType === 'exit' &&
               m.timestamp >= monthAgo
        );

        const monthlyConsumption = productExits.reduce((sum, m) => sum + m.quantity, 0);
        const dailyConsumption = monthlyConsumption / 30;

        // Calculer les jours restants avant rupture
        let daysRemaining = 0;
        if (dailyConsumption > 0) {
          daysRemaining = Math.floor(product.currentStock / dailyConsumption);
        } else {
          daysRemaining = 999; // Aucune consommation détectée
        }

        return {
          product,
          daysRemaining,
          dailyConsumption: dailyConsumption.toFixed(2),
          monthlyConsumption: monthlyConsumption.toFixed(0)
        };
      })
      .filter(p => p.daysRemaining < 30 && p.daysRemaining > 0) // Produits qui vont se terminer dans moins de 30 jours
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 10); // Top 10 des produits à risque
  }, [products, stockMovements]);

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

  // Calculer la valeur totale du stock
  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => {
      const unitPrice = p.unitPrice || 0;
      return sum + (p.currentStock * unitPrice);
    }, 0);
  }, [products]);

  // Statistiques des mouvements (7 derniers jours)
  const weekMovements = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentMovements = stockMovements.filter(m => m.timestamp >= weekAgo);

    const entries = recentMovements.filter(m => m.movementType === 'entry').length;
    const exits = recentMovements.filter(m => m.movementType === 'exit').length;
    const adjustments = recentMovements.filter(m => m.movementType === 'adjustment').length;

    return { entries, exits, adjustments, total: recentMovements.length };
  }, [stockMovements]);

  // Dernières activités (5 dernières)
  const recentActivities = useMemo(() => {
    return [...stockMovements]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [stockMovements]);

  // Taux de rotation du stock
  const stockTurnoverRate = useMemo(() => {
    if (totalProducts === 0) return 0;
    return (consumptionStats.totalExits / totalProducts).toFixed(1);
  }, [consumptionStats.totalExits, totalProducts]);

  return (
    <div className="dashboard">
      <h1>Dashboard Gestionnaire</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>Total Produits</h3>
            <p className="stat-value">{totalProducts}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Stock Faible</h3>
            <p className="stat-value">{lowStockCount}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Stock Critique</h3>
            <p className="stat-value">{criticalStockCount}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Valeur du Stock</h3>
            <p className="stat-value">{totalStockValue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Taux de Rotation</h3>
            <p className="stat-value">{stockTurnoverRate}x</p>
          </div>
        </div>
      </div>

      {/* Mouvements de la semaine */}
      <h2 style={{ marginBottom: '1rem' }}>Activité de la semaine (7 derniers jours)</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>Entrées</h3>
            <p className="stat-value">{weekMovements.entries}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Sorties</h3>
            <p className="stat-value">{weekMovements.exits}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Ajustements</h3>
            <p className="stat-value">{weekMovements.adjustments}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Total</h3>
            <p className="stat-value">{weekMovements.total}</p>
          </div>
        </div>
      </div>

      {/* Dernières Activités */}
      {recentActivities.length > 0 && (
        <div className="recent-activity-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Dernières Activités</h2>
            <Link to="/history" className="btn btn-secondary">
              Voir l'historique complet
            </Link>
          </div>
          <div className="activity-list">
            {recentActivities.map(movement => (
              <div key={movement.id} className={`activity-item movement-${movement.movementType}`}>
                <div className="activity-content">
                  <div className="activity-header">
                    <strong>{movement.productDesignation}</strong>
                    <span className="activity-date">
                      {new Date(movement.timestamp).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="activity-details">
                    <span className={`type-badge movement-${movement.movementType}`}>
                      {movement.movementType === 'entry' && 'Entrée'}
                      {movement.movementType === 'exit' && 'Sortie'}
                      {movement.movementType === 'adjustment' && 'Ajustement'}
                      {movement.movementType === 'initial' && 'Initial'}
                    </span>
                    <span>Quantité: <strong>{movement.quantity}</strong></span>
                    <span>Par: {movement.userName}</span>
                  </div>
                  {movement.reason && (
                    <p className="activity-reason">{movement.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques de Consommation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Consommation ce mois</h2>
        <Link to="/statistics" className="btn btn-secondary">
          Voir les statistiques détaillées
        </Link>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>Sorties totales</h3>
            <p className="stat-value">{consumptionStats.totalExits}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Moyenne journalière</h3>
            <p className="stat-value">{consumptionStats.avgDailyConsumption}</p>
          </div>
        </div>
      </div>


      {/* Prévisions de Rupture de Stock */}
      {stockPredictions.length > 0 && (
        <div className="alerts-section">
          <h2>Prévisions de Rupture de Stock</h2>
          <div className="predictions-grid">
            {stockPredictions.map(prediction => (
              <div
                key={prediction.product.id}
                className={`prediction-card ${prediction.daysRemaining <= 7 ? 'critical' : prediction.daysRemaining <= 14 ? 'warning' : 'normal'}`}
              >
                <div className="prediction-header">
                  <h3>{prediction.product.designation}</h3>
                  <span style={{ fontSize: '0.875rem', color: 'var(--accent-color)', fontWeight: '600' }}>
                    {prediction.product.reference}
                  </span>
                </div>
                <div className="prediction-body">
                  <div className="prediction-days">
                    <span className="days-number">{prediction.daysRemaining}</span>
                    <span className="days-label">jours</span>
                  </div>
                  <div className="prediction-details">
                    <p><strong>Stock:</strong> {prediction.product.currentStock} {prediction.product.unit}</p>
                    <p><strong>Conso. moy.:</strong> {prediction.dailyConsumption} / jour</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {stockPredictions.length > 10 && (
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
