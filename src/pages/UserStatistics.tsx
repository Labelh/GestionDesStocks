import React, { useMemo } from 'react';
import { useApp } from '../context/AppContextSupabase';

const UserStatistics: React.FC = () => {
  const { currentUser, stockMovements, products } = useApp();

  // Filtrer les mouvements de sortie de l'utilisateur
  const userExits = useMemo(() => {
    if (!currentUser) return [];
    return stockMovements.filter(
      m => m.movementType === 'exit' && m.userId === currentUser.id
    );
  }, [stockMovements, currentUser]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const totalQuantity = userExits.reduce((sum, m) => sum + m.quantity, 0);
    const totalExits = userExits.length;

    // Produits les plus consommés
    const productConsumption: { [key: string]: { quantity: number; product: any } } = {};
    userExits.forEach(m => {
      if (!productConsumption[m.productId]) {
        productConsumption[m.productId] = {
          quantity: 0,
          product: products.find(p => p.id === m.productId)
        };
      }
      productConsumption[m.productId].quantity += m.quantity;
    });

    const topProducts = Object.entries(productConsumption)
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 10);

    // Consommation par mois (3 derniers mois)
    const now = new Date();
    const monthsData: { [key: string]: number } = {};
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      monthsData[key] = 0;
    }

    userExits.forEach(m => {
      const date = new Date(m.timestamp);
      const key = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (monthsData[key] !== undefined) {
        monthsData[key] += m.quantity;
      }
    });

    return {
      totalQuantity,
      totalExits,
      topProducts,
      monthsData
    };
  }, [userExits, products]);

  // Historique récent (10 derniers)
  const recentExits = useMemo(() => {
    return [...userExits]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [userExits]);

  if (!currentUser) return null;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--text-color)' }}>Mes Statistiques</h1>

      {/* Cartes de statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'var(--card-bg)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Total des sorties
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent-color)' }}>
            {stats.totalExits}
          </div>
        </div>

        <div style={{
          background: 'var(--card-bg)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Articles consommés
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent-color)' }}>
            {stats.totalQuantity}
          </div>
        </div>
      </div>

      {/* Consommation par mois */}
      <div style={{
        background: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-color)' }}>
          Consommation sur 3 mois
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', height: '200px' }}>
          {Object.entries(stats.monthsData).map(([month, qty]) => {
            const maxQty = Math.max(...Object.values(stats.monthsData), 1);
            const height = (qty / maxQty) * 100;
            return (
              <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  background: 'var(--accent-color)',
                  width: '100%',
                  height: `${height}%`,
                  borderRadius: '8px 8px 0 0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  padding: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'white',
                  minHeight: qty > 0 ? '40px' : '0'
                }}>
                  {qty > 0 ? qty : ''}
                </div>
                <div style={{
                  marginTop: '0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  textAlign: 'center'
                }}>
                  {month}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 10 produits consommés */}
      <div style={{
        background: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-color)' }}>
          Top 10 des produits consommés
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stats.topProducts.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              Aucune consommation enregistrée
            </p>
          ) : (
            stats.topProducts.map(([productId, data], index) => (
              <div key={productId} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--accent-color)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.9rem'
                }}>
                  {index + 1}
                </div>
                {data.product && data.product.photo ? (
                  <img
                    src={data.product.photo}
                    alt={data.product.designation}
                    style={{
                      width: '50px',
                      height: '50px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    background: 'var(--hover-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    📦
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.25rem' }}>
                    {data.product?.designation || 'Produit inconnu'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {data.product?.reference}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--accent-color)'
                }}>
                  {data.quantity}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Historique récent */}
      <div style={{
        background: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-color)' }}>
          Dernières sorties
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Date
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Produit
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Quantité
                </th>
              </tr>
            </thead>
            <tbody>
              {recentExits.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Aucune sortie enregistrée
                  </td>
                </tr>
              ) : (
                recentExits.map(exit => (
                  <tr key={exit.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', color: 'var(--text-color)' }}>
                      {new Date(exit.timestamp).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.25rem' }}>
                        {exit.productDesignation}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {exit.productReference}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: 'var(--accent-color)' }}>
                      {exit.quantity}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;
