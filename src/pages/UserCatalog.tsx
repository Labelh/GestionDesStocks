import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { useNotifications } from '../components/NotificationSystem';
import ExitFlow from '../components/ExitFlow';
import { CartItem } from '../types';
import '../styles/catalog.css';

const UserCatalog: React.FC = () => {
  const { products, currentUser, stockMovements } = useApp();
  const { addNotification } = useNotifications();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showExitFlow, setShowExitFlow] = useState(false);

  // Produits disponibles uniquement
  const availableProducts = products.filter(p => p.currentStock > 0);

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

    const inCart = getCartQuantityForProduct(productId);
    const maxQty = product.currentStock - inCart;
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

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const quantity = getQuantity(productId);
    const alreadyInCart = getCartQuantityForProduct(productId);

    // Vérifier si la quantité totale ne dépasse pas le stock
    if (alreadyInCart + quantity > product.currentStock) {
      alert(`Stock insuffisant ! Disponible: ${product.currentStock}, Déjà dans le panier: ${alreadyInCart}`);
      return;
    }

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

  const handleExitFlowCancel = () => {
    setShowExitFlow(false);
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

  return (
    <div className="catalog-container">
      <h1>Catalogue des Produits</h1>

      {/* Barre de recherche */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Rechercher par référence ou désignation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
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
      </div>

      {/* Navigation par catégories */}
      <div className="category-nav">
        {uniqueCategories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? 'Toutes les catégories' : cat === 'top-ordered' ? 'Les plus commandées' : cat}
          </button>
        ))}
      </div>

      {/* Grille de produits */}
      {filteredProducts.length === 0 ? (
        <div className="no-data">
          <p>Aucun produit disponible dans cette catégorie</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => {
            const stockStatus = getStockStatus(product);
            const qty = getQuantity(product.id);
            const inCart = getCartQuantityForProduct(product.id);

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
                  <div className={`product-stock-inline ${stockStatus}`}>
                    Quantité : {product.currentStock - inCart}
                  </div>

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
                        max={product.currentStock - inCart}
                      />
                      <button
                        className="quantity-btn"
                        onClick={() => incrementQuantity(product.id)}
                        disabled={qty >= product.currentStock - inCart}
                      >
                        +
                      </button>
                    </div>

                    {product.currentStock - inCart > 0 ? (
                      <button
                        className="add-to-cart-btn-icon"
                        onClick={() => addToCart(product.id)}
                        title="Ajouter au panier"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
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
