import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContextSupabase';
import { useNotifications } from './NotificationSystem';
import { CartItem } from '../types';
import '../styles/exitflow.css';

interface ExitFlowProps {
  cartItems: CartItem[];
  onComplete: () => void;
  onCancel: (processedProductIds: string[]) => void;
}

const ExitFlow: React.FC<ExitFlowProps> = ({ cartItems, onComplete, onCancel }) => {
  const navigate = useNavigate();
  const { currentUser, updateProduct, addStockMovement, getProductById, logout, addExitRequest } = useApp();
  const { addNotification } = useNotifications();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [quantity, setQuantity] = useState(cartItems[0]?.quantity || 1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [discrepancyQuantity, setDiscrepancyQuantity] = useState(0);
  const [processedProductIds, setProcessedProductIds] = useState<string[]>([]);

  const currentItem = cartItems[currentIndex];
  const totalItems = cartItems.length;
  const isLastItem = currentIndex === totalItems - 1;

  // Récupérer les infos complètes du produit
  const product = currentItem ? getProductById(currentItem.productId) : null;
  const maxQuantity = product ? product.currentStock : currentItem?.maxStock || 0;

  const formatLocation = () => {
    if (!currentItem) return 'Non spécifié';
    const zone = currentItem.storageZone || '';
    const shelf = currentItem.shelf || '';
    const position = currentItem.position || '';
    return `${zone}.${shelf}.${position}`;
  };

  const handleValidateItem = async () => {
    if (!currentUser || !product || quantity <= 0 || quantity > maxQuantity) return;

    setIsProcessing(true);

    try {
      const newStock = product.currentStock - quantity;

      console.log('ExitFlow: Mise à jour du stock', {
        productId: product.id,
        productRef: product.reference,
        previousStock: product.currentStock,
        newStock
      });

      // Mettre à jour le stock (sans créer de mouvement automatique)
      // La mise à jour locale dans updateProduct suffit, pas besoin de reloadProducts
      await updateProduct(product.id, { currentStock: newStock }, true);

      // Enregistrer le mouvement de stock
      await addStockMovement({
        productId: product.id,
        productReference: product.reference,
        productDesignation: product.designation,
        movementType: 'exit',
        quantity: quantity,
        previousStock: product.currentStock,
        newStock: newStock,
        userId: currentUser.id,
        userName: currentUser.name,
        reason: 'Sortie directe depuis le catalogue',
      });

      // Marquer ce produit comme traité
      setProcessedProductIds(prev => [...prev, product.id]);

      // Passer à l'article suivant ou terminer
      if (isLastItem) {
        setIsCompleted(true);
      } else {
        setSlideDirection('left');
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
          setQuantity(cartItems[currentIndex + 1]?.quantity || 1);
        }, 300);
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de valider la sortie',
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewExit = () => {
    setIsCompleted(false);
    onComplete();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/badge-login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      navigate('/badge-login');
    }
  };

  const handleReportDiscrepancy = async () => {
    if (!currentUser || !product || discrepancyQuantity <= 0) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez renseigner une quantité valide',
        duration: 5000,
      });
      return;
    }

    setIsProcessing(true);
    try {
      await addExitRequest({
        productId: product.id,
        productReference: product.reference,
        productDesignation: product.designation,
        productPhoto: product.photo,
        quantity: discrepancyQuantity,
        reason: `Écart de stock signalé - Quantité constatée: ${discrepancyQuantity}, Stock système: ${maxQuantity}`,
        notes: discrepancyNotes || 'Écart signalé lors d\'une sortie',
      });

      addNotification({
        type: 'info',
        title: 'Écart signalé',
        message: 'Une demande de vérification a été envoyée au gestionnaire',
        duration: 5000,
      });

      setShowDiscrepancyModal(false);
      setDiscrepancyNotes('');
      setDiscrepancyQuantity(0);
    } catch (error) {
      console.error('Erreur lors du signalement:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de signaler l\'écart',
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="exit-flow-overlay">
        <div className="exit-flow-container completion-screen">
          <div className="completion-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <circle cx="12" cy="12" r="10" opacity="0.2" fill="#10b981"/>
              <path d="M7 13l3 3 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className="completion-title">Sortie terminée !</h1>
          <p className="completion-message">
            {totalItems} article{totalItems > 1 ? 's' : ''} sorti{totalItems > 1 ? 's' : ''} avec succès par {currentUser?.name}
          </p>

          <div className="completion-actions">
            <button
              onClick={handleNewExit}
              className="btn-completion btn-new-exit"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v8m-4-4h8"/>
              </svg>
              Nouvelle sortie
            </button>
            <button
              onClick={handleLogout}
              className="btn-completion btn-logout"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return null;
  }

  return (
    <div className="exit-flow-overlay">
      <div className={`exit-flow-container ${slideDirection === 'left' ? 'slide-left' : 'slide-right'}`}>
        {/* Header avec progression */}
        <div className="exit-flow-header">
          <div className="progress-info">
            <span className="progress-text">
              Article {currentIndex + 1} sur {totalItems}
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
              />
            </div>
          </div>
          <button onClick={() => onCancel(processedProductIds)} className="btn-close" title="Annuler">
            ✕
          </button>
        </div>

        {/* Carte produit */}
        <div className="product-card-large">
          {/* Image */}
          <div className="product-image-large">
            {currentItem.photo ? (
              <img src={currentItem.photo} alt={currentItem.productDesignation} />
            ) : (
              <div className="product-image-placeholder-large">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Informations produit */}
          <div className="product-info-large">
            <div className="product-reference-large">{currentItem.productReference}</div>
            <h2 className="product-designation-large">{currentItem.productDesignation}</h2>

            {/* Emplacement bien visible */}
            <div className="product-location-large">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{formatLocation()}</span>
            </div>

            <div className="stock-info-large">
              <span className="stock-label">Stock disponible:</span>
              <span className="stock-value-large">{maxQuantity} {currentItem.unit || ''}</span>
            </div>
            <button
              onClick={() => setShowDiscrepancyModal(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f59e0b',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '0.5rem',
                padding: '0.25rem'
              }}
            >
              un écart ?
            </button>
          </div>
        </div>

        {/* Sélecteur de quantité */}
        <div className="quantity-section-large">
          <label className="quantity-label-large">Quantité à sortir</label>
          <div className="quantity-controls-large">
            <button
              className="quantity-btn-large"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || isProcessing}
            >
              −
            </button>
            <input
              type="number"
              className="quantity-input-large"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQuantity(Math.max(1, Math.min(val, maxQuantity)));
              }}
              min="1"
              max={maxQuantity}
              disabled={isProcessing}
            />
            <button
              className="quantity-btn-large"
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity || isProcessing}
            >
              +
            </button>
          </div>
          <div className="quantity-unit-large">{currentItem.unit || 'unité(s)'}</div>
        </div>

        {/* Bouton de validation */}
        <button
          className="btn-validate-large"
          onClick={handleValidateItem}
          disabled={isProcessing || quantity <= 0 || quantity > maxQuantity}
        >
          {isProcessing ? (
            <>
              <span className="spinner"></span>
              Traitement en cours...
            </>
          ) : isLastItem ? (
            <>
              ✓ Valider et terminer
            </>
          ) : (
            <>
              ✓ Valider cet article
            </>
          )}
        </button>
      </div>

      {/* Modal de signalement d'écart */}
      {showDiscrepancyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Signaler un écart de stock</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)', fontSize: '0.9rem', fontWeight: '600' }}>
                Quantité réellement disponible *
              </label>
              <input
                type="number"
                value={discrepancyQuantity || ''}
                onChange={(e) => setDiscrepancyQuantity(parseInt(e.target.value) || 0)}
                placeholder="Ex: 10"
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--input-bg)',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-color)',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Stock système: {maxQuantity}
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Description (optionnel) :
              </label>
              <textarea
                value={discrepancyNotes}
                onChange={(e) => setDiscrepancyNotes(e.target.value)}
                placeholder="Ex: Stock affiché incorrect, produit manquant..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-color)',
                  fontSize: '0.95rem',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowDiscrepancyModal(false);
                  setDiscrepancyNotes('');
                  setDiscrepancyQuantity(0);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleReportDiscrepancy}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  opacity: isProcessing ? 0.6 : 1
                }}
              >
                {isProcessing ? 'Envoi...' : 'Signaler'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitFlow;
