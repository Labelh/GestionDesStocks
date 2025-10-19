import React, { useState } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { useNotifications } from '../components/NotificationSystem';

const Orders: React.FC = () => {
  const { orders, updateOrder, updateProduct, getProductById } = useApp();
  const { addNotification } = useNotifications();
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  const filteredOrders = filterStatus
    ? orders.filter(o => o.status === filterStatus)
    : orders;

  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime()
  );

  const handleReceiveOrder = async (orderId: string) => {
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
  };

  const handleCancelOrder = async (orderId: string) => {
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
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'status-badge medium';
      case 'received': return 'status-badge normal';
      case 'cancelled': return 'status-badge critical';
      default: return 'status-badge';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'received': return 'Reçue';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

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
        <div className="orders-list">
          {sortedOrders.map(order => {
            const product = getProductById(order.product_id);
            return (
              <div key={order.id} className={`order-item ${order.status}`}>
                {product && product.photo && (
                  <div className="order-photo">
                    <img src={product.photo} alt={order.product_designation} />
                  </div>
                )}
                <div className="order-main">
                  <div className="order-info">
                    <div className="order-product-ref">{order.product_reference}</div>
                    <h3>{order.product_designation}</h3>
                    <p><strong>Quantité:</strong> {order.quantity} {product?.unit}</p>
                    <p><strong>Commandé par:</strong> {order.ordered_by_name}</p>
                    <p><strong>Date de commande:</strong> {new Date(order.ordered_at).toLocaleString('fr-FR')}</p>
                    {order.status === 'received' && order.received_at && (
                      <p><strong>Date de réception:</strong> {new Date(order.received_at).toLocaleString('fr-FR')}</p>
                    )}
                    <span className={getStatusBadgeClass(order.status)}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="order-actions">
                    <button
                      onClick={() => handleReceiveOrder(order.id)}
                      className="btn-icon btn-approve"
                      title="Réceptionner"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="btn-icon btn-reject"
                      title="Annuler"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
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

export default Orders;
