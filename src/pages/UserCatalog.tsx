import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { useNavigate } from 'react-router-dom';
import '../styles/catalog.css';

interface CartItem {
  productId: string;
  productReference: string;
  productDesignation: string;
  quantity: number;
  maxStock: number;
  photo?: string;
}

const UserCatalog: React.FC = () => {
  const { products, addExitRequest, currentUser, stockMovements } = useApp();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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

  // Filtrer par catégorie
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return availableProducts;
    if (selectedCategory === 'top-ordered') return topOrderedProducts;
    return availableProducts.filter(p => p.category === selectedCategory);
  }, [availableProducts, selectedCategory, topOrderedProducts]);

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

  const submitCart = async () => {
    if (!currentUser || cart.length === 0) return;

    try {
      // Créer une demande pour chaque produit du panier
      for (const item of cart) {
        await addExitRequest({
          productId: item.productId,
          productReference: item.productReference,
          productDesignation: item.productDesignation,
          productPhoto: item.photo,
          quantity: item.quantity,
          reason: 'Demande depuis le catalogue',
        });
      }

      // Vider le panier
      emptyCart();

      // Rediriger vers mes demandes
      navigate('/my-requests');
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Une erreur est survenue lors de la soumission des demandes');
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

  return (
    <div className="catalog-container">
      <h1>Catalogue des Produits</h1>

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
                  <h3 className="product-name">{product.designation}</h3>
                  <div className="product-ref product-reference-highlight">{product.reference}</div>
                  <div className={`product-stock-inline ${stockStatus}`}>
                    {product.currentStock - inCart} {product.unit}
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
            <button className="submit-cart-btn" onClick={submitCart}>
              Valider les demandes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCatalog;
