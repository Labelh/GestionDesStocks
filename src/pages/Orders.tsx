import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { useNotifications } from '../components/NotificationSystem';

const Orders: React.FC = () => {
  const { orders, updateOrder, updateProduct, getProductById } = useApp();
  const { addNotification } = useNotifications();
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  const sortedOrders = useMemo(() => {
    const filtered = filterStatus
      ? orders.filter(o => o.status === filterStatus)
      : orders;
    return [...filtered].sort(
      (a, b) => new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime()
    );
  }, [orders, filterStatus]);

  const handleReceiveOrder = useCallback(async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const product = getProductById(order.product_id);
    if (!product) {
      alert('Produit introuvable');
      return;
    }

    try {
      const newStock = product.currentStock + order.quantity;
      await updateProduct(product.id, { currentStock: newStock });
      await updateOrder(orderId, {
        status: 'received',
        received_at: new Date()
      });

      addNotification({
        type: 'success',
        title: 'Commande réceptionnée',
        message: `${order.quantity} ${product.unit} de ${product.designation} ajouté(s) au stock`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Erreur lors de la réception:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la réception de la commande',
        duration: 5000,
      });
    }
  }, [orders, getProductById, updateProduct, updateOrder, addNotification]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }

    try {
      await updateOrder(orderId, { status: 'cancelled' });
      addNotification({
        type: 'success',
        title: 'Commande annulée',
        message: 'La commande a été annulée',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'annulation de la commande',
        duration: 5000,
      });
    }
  }, [updateOrder, addNotification]);

  const getStatusBadgeClass = useCallback((status: string) => {
    switch (status) {
      case 'pending': return 'status-badge medium';
      case 'received': return 'status-badge normal';
      case 'cancelled': return 'status-badge critical';
      default: return 'status-badge';
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'received': return 'Reçue';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  }, []);

  return (
    <div className="orders-page">
      <h1>Commandes</h1>

      <div className="filters">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="received">Reçues</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      {sortedOrders.length === 0 ? (
        <p className="no-data">Aucune commande trouvée</p>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Quantité</th>
                <th>Commandé par</th>
                <th>Date de commande</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map(order => {
                const product = getProductById(order.product_id);
                return (
                  <tr key={order.id}>
                    <td>
                      {product && product.photo ? (
                        <img
                          src={product.photo}
                          alt={order.product_designation}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <div style={{
                          width: '50px',
                          height: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--bg-secondary)',
                          borderRadius: '4px',
                          fontSize: '1.5rem'
                        }}>
                          📦
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{order.product_reference}</td>
                    <td>{order.product_designation}</td>
                    <td>{order.quantity} {product?.unit}</td>
                    <td>{order.ordered_by_name}</td>
                    <td>
                      {new Date(order.ordered_at).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(order.ordered_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {order.status === 'received' && order.received_at && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          Reçue: {new Date(order.received_at).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(order.received_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(order.status)}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>
                      {order.status === 'pending' && (
                        <div className="actions">
                          <button
                            onClick={() => handleReceiveOrder(order.id)}
                            className="btn-icon btn-approve"
                            title="Réceptionner"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="btn-icon btn-reject"
                            title="Annuler"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
