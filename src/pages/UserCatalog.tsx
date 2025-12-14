import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { useNotifications } from '../components/NotificationSystem';
import ExitFlow from '../components/ExitFlow';
import { CartItem } from '../types';
import '../styles/catalog.css';

const UserCatalog: React.FC = () => {
  const { products, currentUser, stockMovements, loading, getPendingOrders } = useApp();
  const { addNotification } = useNotifications();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showExitFlow, setShowExitFlow] = useState(false);
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

  // Vérifier si un produit est en commande et obtenir la quantité totale
  const getProductOrderQuantity = (productId: string): number => {
    const pendingOrders = getPendingOrders().filter(order => order.product_id === productId);
    return pendingOrders.reduce((total, order) => total + order.quantity, 0);
  };

  // Tous les produits (y compris ceux en rupture de stock)
  const availableProducts = products;

  // Calculer les produits les plus commandés par l'utilisateur actuel
  const topOrderedProducts = useMemo(() => {
    if (!currentUser) return [];

    const userExitMovements = stockMovements.filter(
      m => m.movementType === 'exit' && m.userId === currentUser.id
    );
    const productCounts: { [key: string]: number } = {};

    userExitMovements.forEach(movement => {
      productCounts[movement.productId] = (productCounts[movement.productId] || 0) + movement.quantity;
    });

    const topProductIds = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    return availableProducts.filter(p => topProductIds.includes(p.id));
  }, [availableProducts, stockMovements, currentUser]);

  // Filtrer par catégorie et recherche
  const filteredProducts = useMemo(() => {
    let filtered = availableProducts;

    // Filtrer par catégorie
    if (selectedCategory === 'top-ordered') {
      filtered = topOrderedProducts;
    } else if (selectedCategory !== 'all') {
      filtered = availableProducts.filter(p => p.category === selectedCategory);
    }

    // Filtrer par recherche (référence ou désignation)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.reference.toLowerCase().includes(search) ||
        p.designation.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [availableProducts, selectedCategory, topOrderedProducts, searchTerm]);

  // Categories uniques
  const uniqueCategories = useMemo(() => {
    const cats = ['all', 'top-ordered', ...new Set(availableProducts.map(p => p.category))];
    return cats;
  }, [availableProducts]);

  const getQuantity = (productId: string) => quantities[productId] || 1;

  const setQuantity = (productId: string, value: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const maxQty = product.currentStock;
    const newValue = Math.max(1, Math.min(value, maxQty));
    setQuantities({ ...quantities, [productId]: newValue });
  };

  const incrementQuantity = (productId: string) => {
    setQuantity(productId, getQuantity(productId) + 1);
  };

  const decrementQuantity = (productId: string) => {
    setQuantity(productId, getQuantity(productId) - 1);
  };

  const getCartQuantityForProduct = (productId: string): number => {
    const item = cart.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const addToCart = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const quantity = getQuantity(productId);
    const alreadyInCart = getCartQuantityForProduct(productId);

    // Vérifier si la quantité totale ne dépasse pas le stock
    if (alreadyInCart + quantity > product.currentStock) {
      alert(`Stock insuffisant ! Disponible: ${product.currentStock}, Déjà dans le panier: ${alreadyInCart}`);
      return;
    }

    // Activer l'état de chargement pour ce produit
    setAddingToCart(prev => ({ ...prev, [productId]: true }));

    // Simuler un léger délai pour montrer l'animation
    await new Promise(resolve => setTimeout(resolve, 300));

    // Vérifier si le produit est déjà dans le panier
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
      // Mettre à jour la quantité
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      // Ajouter au panier
      setCart([...cart, {
        productId: product.id,
        productReference: product.reference,
        productDesignation: product.designation,
        quantity,
        maxStock: product.currentStock,
        photo: product.photo,
        storageZone: product.storageZone,
        shelf: product.shelf,
        position: product.position,
        unit: product.unit,
      }]);
    }

    // Réinitialiser la quantité
    setQuantities({ ...quantities, [productId]: 1 });

    // Désactiver l'état de chargement
    setAddingToCart(prev => ({ ...prev, [productId]: false }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const emptyCart = () => {
    setCart([]);
  };

  const startExitFlow = () => {
    if (!currentUser || cart.length === 0) return;
    setShowExitFlow(true);
  };

  const handleExitFlowComplete = () => {
    setShowExitFlow(false);
    emptyCart();
    addNotification({
      type: 'success',
      title: 'Sortie terminée !',
      message: 'Tous les articles ont été sortis avec succès',
      duration: 5000,
    });
  };

  const handleExitFlowCancel = (processedProductIds: string[]) => {
    setShowExitFlow(false);
    // Retirer du panier les articles qui ont déjà été traités
    if (processedProductIds.length > 0) {
      setCart(prevCart => prevCart.filter(item => !processedProductIds.includes(item.productId)));
      addNotification({
        type: 'info',
        title: 'Sortie annulée',
        message: `${processedProductIds.length} article(s) ont été sortis avant l'annulation`,
        duration: 5000,
      });
    }
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getStockStatus = (product: any) => {
    const ratio = product.currentStock / product.maxStock;
    if (product.currentStock === 0) return 'critical';
    if (ratio <= 0.2) return 'critical';
    if (ratio <= 0.4) return 'low';
    return 'normal';
  };

  if (loading) {
    return (
      <div className="catalog-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1.5rem'
      }}>
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
        </svg>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
          Chargement du catalogue...
        </p>
      </div>
    );
  }

  return (
    <div className="catalog-container">
      <h1>Catalogue des Produits</h1>

      {/* Barre de recherche et filtres */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Rechercher par référence ou désignation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '0.875rem 1rem',
            fontSize: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--input-bg)',
            color: 'var(--text-color)',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '0.875rem 1rem',
            fontSize: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
            background: '#1a1d29',
            color: '#ffffff',
            outline: 'none',
            cursor: 'pointer',
            minWidth: '200px',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat} style={{ background: '#1a1d29', color: '#ffffff' }}>
              {cat === 'all' ? 'Toutes les catégories' : cat === 'top-ordered' ? 'Les plus utilisées' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Grille de produits */}
      {filteredProducts.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40vh',
          gap: '1rem'
        }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
            Aucun produit dans cette catégorie
          </p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => {
            const stockStatus = getStockStatus(product);
            const qty = getQuantity(product.id);

            return (
              <div key={product.id} className="product-card">
                <div className="product-image-wrapper">
                  <span className="product-category-badge">{product.category}</span>
                  {product.photo ? (
                    <img src={product.photo} alt={product.designation} className="product-image" />
                  ) : (
                    <div className="product-image-placeholder">📦</div>
                  )}
                </div>

                <div className="product-details">
                  <div className="product-ref">{product.reference}</div>
                  <h3 className="product-name">{product.designation}</h3>
                  <div className="product-stock-inline">
                    Quantité : <span className={stockStatus}>{product.currentStock}</span>
                  </div>
                  {(() => {
                    const orderQty = getProductOrderQuantity(product.id);
                    return (
                      <span style={{
                        display: 'inline-block',
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        color: orderQty > 0 ? '#fff' : 'transparent',
                        background: orderQty > 0 ? '#10b981' : 'transparent',
                        borderRadius: '4px',
                        marginTop: '0.25rem',
                        width: 'fit-content',
                        visibility: orderQty > 0 ? 'visible' : 'hidden'
                      }}>
                        {orderQty > 0 ? `En commande x${orderQty}` : 'Spacer'}
                      </span>
                    );
                  })()}

                  <div className="product-actions">
                    <div className="quantity-selector">
                      <button
                        className="quantity-btn"
                        onClick={() => decrementQuantity(product.id)}
                        disabled={qty <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="quantity-input"
                        value={qty}
                        onChange={(e) => setQuantity(product.id, parseInt(e.target.value) || 1)}
                        min="1"
                        max={product.currentStock}
                      />
                      <button
                        className="quantity-btn"
                        onClick={() => incrementQuantity(product.id)}
                        disabled={qty >= product.currentStock}
                      >
                        +
                      </button>
                    </div>

                    {product.currentStock > 0 ? (
                      <button
                        className="add-to-cart-btn-icon"
                        onClick={() => addToCart(product.id)}
                        title="Ajouter au panier"
                        disabled={addingToCart[product.id]}
                      >
                        {addingToCart[product.id] ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" opacity="0.25"/>
                            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                          </svg>
                        )}
                      </button>
                    ) : (
                      <button className="add-to-cart-btn-icon" disabled title="Stock épuisé">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Panier fixe */}
      {cart.length > 0 && (
        <div className="fixed-cart">
          <div className="cart-header">
            <h2>Mon Panier</h2>
            <span className="cart-count">{getTotalItems()} articles</span>
          </div>

          <div className="cart-items">
            {cart.map(item => (
              <div key={item.productId} className="cart-item">
                {item.photo ? (
                  <img src={item.photo} alt={item.productDesignation} className="cart-item-image" />
                ) : (
                  <div className="cart-item-image">📦</div>
                )}

                <div className="cart-item-details">
                  <div className="cart-item-ref product-reference-highlight">{item.productReference}</div>
                  <div className="cart-item-name">{item.productDesignation}</div>
                  <div className="cart-item-quantity">
                    <span>Quantité:</span>
                    <strong>{item.quantity}</strong>
                  </div>
                </div>

                <button
                  className="remove-item-btn"
                  onClick={() => removeFromCart(item.productId)}
                  title="Retirer du panier"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <button className="empty-cart-btn" onClick={emptyCart}>
              Vider le panier
            </button>
            <button className="submit-cart-btn" onClick={startExitFlow}>
              Effectuer la sortie
            </button>
          </div>
        </div>
      )}

      {/* Flux de sortie article par article */}
      {showExitFlow && (
        <ExitFlow
          cartItems={cart}
          onComplete={handleExitFlowComplete}
          onCancel={handleExitFlowCancel}
        />
      )}
    </div>
  );
};

export default UserCatalog;
