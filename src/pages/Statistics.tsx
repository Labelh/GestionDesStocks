import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContextSupabase';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Statistics: React.FC = () => {
  const { stockMovements, products } = useApp();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculer la date de début selon la période
  const getStartDate = () => {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'quarter':
        return new Date(now.setMonth(now.getMonth() - 3));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  };

  // Filtrer les mouvements par période
  const filteredMovements = useMemo(() => {
    const startDate = getStartDate();
    return stockMovements.filter(m => m.timestamp >= startDate);
  }, [stockMovements, period]);

  // Calculer les produits les plus consommés
  const topConsumedProducts = useMemo(() => {
    const exitMovements = filteredMovements.filter(m => m.movementType === 'exit');
    const productConsumption: { [key: string]: { name: string; quantity: number } } = {};

    exitMovements.forEach(movement => {
      if (!productConsumption[movement.productId]) {
        productConsumption[movement.productId] = {
          name: movement.productDesignation,
          quantity: 0
        };
      }
      productConsumption[movement.productId].quantity += movement.quantity;
    });

    return Object.values(productConsumption)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredMovements]);

  // Calculer la consommation par catégorie
  const consumptionByCategory = useMemo(() => {
    const exitMovements = filteredMovements.filter(m => m.movementType === 'exit');
    const categoryConsumption: { [key: string]: number } = {};

    exitMovements.forEach(movement => {
      const product = products.find(p => p.id === movement.productId);
      const category = product?.category || 'Non catégorisé';

      if (!categoryConsumption[category]) {
        categoryConsumption[category] = 0;
      }
      categoryConsumption[category] += movement.quantity;
    });

    return Object.entries(categoryConsumption).map(([name, value]) => ({
      name,
      value
    }));
  }, [filteredMovements, products]);

  // Calculer les coûts par catégorie
  const costByCategory = useMemo(() => {
    const exitMovements = filteredMovements.filter(m => m.movementType === 'exit');
    const categoryCost: { [key: string]: number } = {};

    exitMovements.forEach(movement => {
      const product = products.find(p => p.id === movement.productId);
      const category = product?.category || 'Non catégorisé';
      const cost = (product?.unitPrice || 0) * movement.quantity;

      if (!categoryCost[category]) {
        categoryCost[category] = 0;
      }
      categoryCost[category] += cost;
    });

    return Object.entries(categoryCost).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }));
  }, [filteredMovements, products]);

  // Calculer l'évolution de la consommation dans le temps
  const consumptionOverTime = useMemo(() => {
    const exitMovements = filteredMovements.filter(m => m.movementType === 'exit');
    const dailyConsumption: { [key: string]: number } = {};

    exitMovements.forEach(movement => {
      const date = movement.timestamp.toISOString().split('T')[0];
      if (!dailyConsumption[date]) {
        dailyConsumption[date] = 0;
      }
      dailyConsumption[date] += movement.quantity;
    });

    return Object.entries(dailyConsumption)
      .map(([date, quantity]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        quantity
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredMovements]);

  // Calculer l'évolution des coûts dans le temps
  const costOverTime = useMemo(() => {
    const exitMovements = filteredMovements.filter(m => m.movementType === 'exit');
    const dailyCost: { [key: string]: number } = {};

    exitMovements.forEach(movement => {
      const date = movement.timestamp.toISOString().split('T')[0];
      const product = products.find(p => p.id === movement.productId);
      const cost = (product?.unitPrice || 0) * movement.quantity;

      if (!dailyCost[date]) {
        dailyCost[date] = 0;
      }
      dailyCost[date] += cost;
    });

    return Object.entries(dailyCost)
      .map(([date, cost]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        cost: parseFloat(cost.toFixed(2))
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredMovements, products]);

  // Calculer les statistiques globales
  const globalStats = useMemo(() => {
    const exitMovements = filteredMovements.filter(m => m.movementType === 'exit');
    const entryMovements = filteredMovements.filter(m => m.movementType === 'entry');

    const totalExits = exitMovements.reduce((sum, m) => sum + m.quantity, 0);
    const totalEntries = entryMovements.reduce((sum, m) => sum + m.quantity, 0);
    const daysInPeriod = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
    const avgDailyConsumption = totalExits / daysInPeriod;

    // Calculer les valeurs économiques
    const totalExitValue = exitMovements.reduce((sum, m) => {
      const product = products.find(p => p.id === m.productId);
      return sum + (product?.unitPrice || 0) * m.quantity;
    }, 0);

    const totalEntryValue = entryMovements.reduce((sum, m) => {
      const product = products.find(p => p.id === m.productId);
      return sum + (product?.unitPrice || 0) * m.quantity;
    }, 0);

    const avgDailyValue = totalExitValue / daysInPeriod;

    return {
      totalExits,
      totalEntries,
      avgDailyConsumption: avgDailyConsumption.toFixed(2),
      mostConsumedProduct: topConsumedProducts[0]?.name || 'N/A',
      productsWithMovements: new Set(exitMovements.map(m => m.productId)).size,
      totalExitValue: totalExitValue.toFixed(2),
      totalEntryValue: totalEntryValue.toFixed(2),
      avgDailyValue: avgDailyValue.toFixed(2)
    };
  }, [filteredMovements, topConsumedProducts, period, products]);

  // Calculer les prévisions de rupture de stock
  const stockoutPredictions = useMemo(() => {
    const predictions: Array<{
      product: string;
      currentStock: number;
      avgConsumption: number;
      daysLeft: number;
      category: string;
      unitPrice: number;
      estimatedCost: number;
    }> = [];

    products.forEach(product => {
      const productMovements = filteredMovements.filter(
        m => m.productId === product.id && m.movementType === 'exit'
      );

      if (productMovements.length > 0) {
        const totalConsumption = productMovements.reduce((sum, m) => sum + m.quantity, 0);
        const daysInPeriod = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
        const avgConsumption = totalConsumption / daysInPeriod;
        const daysLeft = avgConsumption > 0 ? product.currentStock / avgConsumption : 999;
        const estimatedCost = (product.unitPrice || 0) * product.currentStock;

        if (daysLeft < 30 && product.currentStock > 0) {
          predictions.push({
            product: product.designation,
            currentStock: product.currentStock,
            avgConsumption: parseFloat(avgConsumption.toFixed(2)),
            daysLeft: Math.floor(daysLeft),
            category: product.category,
            unitPrice: product.unitPrice || 0,
            estimatedCost: parseFloat(estimatedCost.toFixed(2))
          });
        }
      }
    });

    return predictions.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 10);
  }, [products, filteredMovements, period]);

  const COLORS = ['#cd7f32', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  return (
    <div className="statistics-page">
      <div className="page-header">
        <h1>Statistiques de Consommation</h1>
        <div className="filters">
          <select value={period} onChange={(e) => setPeriod(e.target.value as any)}>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="quarter">3 derniers mois</option>
            <option value="year">Dernière année</option>
          </select>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Toutes catégories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <h3>Sorties totales</h3>
            <p className="stat-value">{globalStats.totalExits}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Entrées totales</h3>
            <p className="stat-value">{globalStats.totalEntries}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Conso. moy. journalière</h3>
            <p className="stat-value">{globalStats.avgDailyConsumption}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>Plus consommé</h3>
            <p className="stat-value-text">{globalStats.mostConsumedProduct}</p>
          </div>
        </div>
      </div>

      {/* Cartes statistiques économiques */}
      <div className="stats-cards">
        <div className="stat-card economic">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Valeur des sorties</h3>
            <p className="stat-value">{globalStats.totalExitValue} €</p>
          </div>
        </div>
        <div className="stat-card economic">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <h3>Valeur des entrées</h3>
            <p className="stat-value">{globalStats.totalEntryValue} €</p>
          </div>
        </div>
        <div className="stat-card economic">
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <h3>Coût moy. journalier</h3>
            <p className="stat-value">{globalStats.avgDailyValue} €</p>
          </div>
        </div>
        <div className="stat-card economic">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <h3>Variation</h3>
            <p className="stat-value" style={{ color: parseFloat(globalStats.totalEntryValue) - parseFloat(globalStats.totalExitValue) >= 0 ? '#10b981' : '#ef4444' }}>
              {(parseFloat(globalStats.totalEntryValue) - parseFloat(globalStats.totalExitValue)).toFixed(2)} €
            </p>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="charts-grid">
        {/* Top 10 des produits consommés */}
        <div className="chart-container">
          <h2>Top 10 - Produits les plus consommés</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topConsumedProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                stroke="var(--text-color)"
              />
              <YAxis stroke="var(--text-color)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-color)'
                }}
              />
              <Bar dataKey="quantity" fill="#cd7f32" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Consommation par catégorie */}
        <div className="chart-container">
          <h2>Répartition par catégorie (Quantité)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={consumptionByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {consumptionByCategory.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-color)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Coûts par catégorie */}
        <div className="chart-container">
          <h2>Répartition des coûts par catégorie</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={costByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {costByCategory.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-color)'
                }}
                formatter={(value: number) => `${value.toFixed(2)} €`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Évolution de la consommation */}
        <div className="chart-container full-width">
          <h2>Évolution de la consommation (Quantité)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={consumptionOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" stroke="var(--text-color)" />
              <YAxis stroke="var(--text-color)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-color)'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="quantity" stroke="#cd7f32" strokeWidth={2} name="Quantité" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Évolution des coûts */}
        <div className="chart-container full-width">
          <h2>Évolution des coûts de consommation</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" stroke="var(--text-color)" />
              <YAxis stroke="var(--text-color)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-color)'
                }}
                formatter={(value: number) => `${value.toFixed(2)} €`}
              />
              <Legend />
              <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} name="Coût (€)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prévisions de rupture */}
      <div className="predictions-section">
        <h2>Prévisions de rupture de stock (30 prochains jours)</h2>
        {stockoutPredictions.length > 0 ? (
          <div className="predictions-table">
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Stock actuel</th>
                  <th>Conso. moy. / jour</th>
                  <th>Prix unitaire</th>
                  <th>Valeur stock</th>
                  <th>Jours restants</th>
                  <th>Alerte</th>
                </tr>
              </thead>
              <tbody>
                {stockoutPredictions.map((pred, idx) => (
                  <tr key={idx} className={pred.daysLeft <= 7 ? 'critical' : pred.daysLeft <= 14 ? 'warning' : ''}>
                    <td>{pred.product}</td>
                    <td>{pred.category}</td>
                    <td>{pred.currentStock}</td>
                    <td>{pred.avgConsumption}</td>
                    <td>{pred.unitPrice > 0 ? `${pred.unitPrice.toFixed(2)} €` : '-'}</td>
                    <td>{pred.estimatedCost > 0 ? `${pred.estimatedCost.toFixed(2)} €` : '-'}</td>
                    <td>{pred.daysLeft}</td>
                    <td>
                      {pred.daysLeft <= 7 ? '🔴 Urgent' : pred.daysLeft <= 14 ? '🟠 Attention' : '🟡 À surveiller'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">Aucune rupture de stock prévue dans les 30 prochains jours</p>
        )}
      </div>
    </div>
  );
};

export default Statistics;
