import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContextSupabase';
import './Inventory.css';

interface InventoryItem {
  productId: string;
  reference: string;
  designation: string;
  category: string;
  storageZone?: string;
  shelf?: number;
  position?: number;
  systemStock: number;
  countedStock: number | null;
  difference: number;
  status: 'pending' | 'counted' | 'validated';
  notes: string;
}

const Inventory: React.FC = () => {
  const { products, updateProduct, addStockMovement, currentUser } = useApp();
  const [inventoryMode, setInventoryMode] = useState<'full' | 'category' | 'zone'>('full');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryStarted, setInventoryStarted] = useState(false);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedProduct, setLastScannedProduct] = useState<string | null>(null);
  const barcodeInputRef = React.useRef<HTMLInputElement>(null);

  // Filtrer les produits pour l'inventaire
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.deletedAt) return false;

      if (inventoryMode === 'category' && selectedCategory) {
        if (p.category !== selectedCategory) return false;
      }

      if (inventoryMode === 'zone' && selectedZone) {
        if (p.storageZone !== selectedZone) return false;
      }

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          p.reference.toLowerCase().includes(search) ||
          p.designation.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [products, inventoryMode, selectedCategory, selectedZone, searchTerm]);

  // Catégories et zones uniques
  const categories = useMemo(() =>
    Array.from(new Set(products.map(p => p.category).filter(Boolean))),
    [products]
  );

  const zones = useMemo(() =>
    Array.from(new Set(products.map(p => p.storageZone).filter(Boolean))),
    [products]
  );

  // Démarrer l'inventaire
  const startInventory = useCallback(() => {
    const items: InventoryItem[] = filteredProducts.map(p => ({
      productId: p.id,
      reference: p.reference,
      designation: p.designation,
      category: p.category,
      storageZone: p.storageZone,
      shelf: p.shelf,
      position: p.position,
      systemStock: p.currentStock,
      countedStock: null,
      difference: 0,
      status: 'pending',
      notes: ''
    }));

    setInventoryItems(items);
    setInventoryStarted(true);
  }, [filteredProducts]);

  // Mettre à jour le comptage
  const updateCount = useCallback((productId: string, count: number | null) => {
    setInventoryItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const difference = count !== null ? count - item.systemStock : 0;
        return {
          ...item,
          countedStock: count,
          difference,
          status: count !== null ? 'counted' : 'pending'
        };
      }
      return item;
    }));
  }, []);

  // Mettre à jour les notes
  const updateNotes = useCallback((productId: string, notes: string) => {
    setInventoryItems(prev => prev.map(item =>
      item.productId === productId ? { ...item, notes } : item
    ));
  }, []);

  // Valider un item
  const validateItem = useCallback((productId: string) => {
    setInventoryItems(prev => prev.map(item =>
      item.productId === productId ? { ...item, status: 'validated' } : item
    ));
  }, []);

  // Valider tout l'inventaire et ajuster les stocks
  const validateInventory = useCallback(async () => {
    const itemsToAdjust = inventoryItems.filter(item =>
      item.status === 'validated' && item.difference !== 0
    );

    if (itemsToAdjust.length === 0) {
      alert('Aucun ajustement à effectuer');
      return;
    }

    const confirmMsg = `Vous allez ajuster ${itemsToAdjust.length} produit(s).\nTotal écarts: ${itemsToAdjust.reduce((sum, item) => sum + Math.abs(item.difference), 0)}\n\nConfirmer l'ajustement ?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      for (const item of itemsToAdjust) {
        // Mettre à jour le stock
        await updateProduct(item.productId, {
          currentStock: item.countedStock!
        });

        // Ajouter un mouvement d'ajustement
        await addStockMovement({
          productId: item.productId,
          productReference: item.reference,
          productDesignation: item.designation,
          movementType: 'adjustment',
          quantity: Math.abs(item.difference),
          previousStock: item.systemStock,
          newStock: item.countedStock!,
          userId: currentUser!.id,
          userName: currentUser!.name,
          reason: `Inventaire - ${item.notes || (item.difference > 0 ? 'Surplus détecté' : 'Manquant détecté')}`,
          notes: item.notes
        });
      }

      alert(`✅ Inventaire validé!\n${itemsToAdjust.length} ajustement(s) effectué(s)`);
      setInventoryStarted(false);
      setInventoryItems([]);
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert('❌ Erreur lors de la validation de l\'inventaire');
    }
  }, [inventoryItems, updateProduct, addStockMovement, currentUser]);

  // Statistiques de l'inventaire
  const inventoryStats = useMemo(() => {
    const total = inventoryItems.length;
    const counted = inventoryItems.filter(i => i.status !== 'pending').length;
    const validated = inventoryItems.filter(i => i.status === 'validated').length;
    const withDifferences = inventoryItems.filter(i => i.difference !== 0).length;
    const totalDifference = inventoryItems.reduce((sum, i) => sum + i.difference, 0);

    return { total, counted, validated, withDifferences, totalDifference };
  }, [inventoryItems]);

  // Filtrer pour afficher uniquement les écarts
  const displayedItems = useMemo(() => {
    if (!showOnlyDifferences) return inventoryItems;
    return inventoryItems.filter(item => item.difference !== 0);
  }, [inventoryItems, showOnlyDifferences]);

  // Gérer le scan de code-barres
  const handleBarcodeScan = useCallback((barcode: string) => {
    if (!barcode.trim()) return;

    // Trouver le produit par référence
    const item = inventoryItems.find(i => i.reference.toLowerCase() === barcode.toLowerCase());

    if (item) {
      // Mettre en surbrillance le produit scanné
      setLastScannedProduct(item.productId);
      setTimeout(() => setLastScannedProduct(null), 2000);

      // Scroller vers le produit
      const element = document.getElementById(`inventory-item-${item.productId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Focus sur le champ de comptage
      setTimeout(() => {
        const countInput = document.querySelector(`#count-input-${item.productId}`) as HTMLInputElement;
        if (countInput) {
          countInput.focus();
          countInput.select();
        }
      }, 300);
    } else {
      alert(`❌ Produit non trouvé: ${barcode}\nCe produit n'est pas dans la liste d'inventaire actuelle.`);
    }

    setBarcodeInput('');
    // Remettre le focus sur le champ de scan
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  }, [inventoryItems]);

  // Exporter l'inventaire en CSV
  const exportInventory = useCallback(() => {
    const csv = [
      ['Référence', 'Désignation', 'Catégorie', 'Zone', 'Stock Système', 'Stock Compté', 'Écart', 'Statut', 'Notes'].join(';'),
      ...inventoryItems.map(item => [
        item.reference,
        item.designation,
        item.category,
        item.storageZone || '',
        item.systemStock,
        item.countedStock ?? '',
        item.difference,
        item.status === 'pending' ? 'Non compté' : item.status === 'counted' ? 'Compté' : 'Validé',
        item.notes
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventaire_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [inventoryItems]);

  if (!inventoryStarted) {
    return (
      <div className="inventory-page">
        <h1>Mode Inventaire</h1>
        <p className="subtitle">Comptez physiquement vos produits et ajustez les stocks</p>

        <div className="inventory-setup">
          <div className="setup-card">
            <h2>Configuration de l'inventaire</h2>

            <div className="form-group">
              <label>Type d'inventaire</label>
              <select
                value={inventoryMode}
                onChange={(e) => setInventoryMode(e.target.value as any)}
                className="form-control"
              >
                <option value="full">Inventaire Complet</option>
                <option value="category">Par Catégorie</option>
                <option value="zone">Par Zone de Stockage</option>
              </select>
            </div>

            {inventoryMode === 'category' && (
              <div className="form-group">
                <label>Catégorie</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-control"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {inventoryMode === 'zone' && (
              <div className="form-group">
                <label>Zone de stockage</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="form-control"
                >
                  <option value="">Sélectionner une zone</option>
                  {zones.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Recherche (optionnel)</label>
              <input
                type="text"
                placeholder="Filtrer par référence ou désignation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="inventory-preview">
              <h3>Produits à inventorier: {filteredProducts.length}</h3>
              {filteredProducts.length > 0 && (
                <div className="preview-list">
                  {filteredProducts.slice(0, 5).map(p => (
                    <div key={p.id} className="preview-item">
                      <span className="preview-ref">{p.reference}</span>
                      <span className="preview-name">{p.designation}</span>
                      <span className="preview-stock">Stock: {p.currentStock}</span>
                    </div>
                  ))}
                  {filteredProducts.length > 5 && (
                    <p className="preview-more">+ {filteredProducts.length - 5} autres produits</p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={startInventory}
              disabled={filteredProducts.length === 0}
              className="btn btn-primary btn-large"
            >
              Démarrer l'inventaire
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h1>Inventaire en cours</h1>
          <p className="subtitle">
            {inventoryMode === 'full' ? 'Inventaire complet' :
             inventoryMode === 'category' ? `Catégorie: ${selectedCategory}` :
             `Zone: ${selectedZone}`}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={exportInventory} className="btn btn-secondary">
            Exporter CSV
          </button>
          <button
            onClick={() => {
              if (window.confirm('Abandonner l\'inventaire en cours ?')) {
                setInventoryStarted(false);
                setInventoryItems([]);
              }
            }}
            className="btn btn-danger"
          >
            Abandonner
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="inventory-stats">
        <div className="stat-card">
          <h3>Total produits</h3>
          <p className="stat-value">{inventoryStats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Comptés</h3>
          <p className="stat-value" style={{ color: '#10b981' }}>
            {inventoryStats.counted} / {inventoryStats.total}
          </p>
        </div>
        <div className="stat-card">
          <h3>Validés</h3>
          <p className="stat-value" style={{ color: '#3b82f6' }}>
            {inventoryStats.validated}
          </p>
        </div>
        <div className="stat-card">
          <h3>Écarts détectés</h3>
          <p className="stat-value" style={{ color: inventoryStats.withDifferences > 0 ? '#f59e0b' : 'var(--text-color)' }}>
            {inventoryStats.withDifferences}
          </p>
        </div>
        <div className="stat-card">
          <h3>Écart total</h3>
          <p className="stat-value" style={{ color: inventoryStats.totalDifference !== 0 ? '#ef4444' : 'var(--text-color)' }}>
            {inventoryStats.totalDifference > 0 ? '+' : ''}{inventoryStats.totalDifference}
          </p>
        </div>
      </div>

      {/* Lecteur de code-barres */}
      <div className="barcode-scanner">
        <div className="scanner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="2" height="14"/>
            <rect x="7" y="5" width="1" height="14"/>
            <rect x="10" y="5" width="2" height="14"/>
            <rect x="14" y="5" width="1" height="14"/>
            <rect x="17" y="5" width="3" height="14"/>
          </svg>
        </div>
        <input
          ref={barcodeInputRef}
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleBarcodeScan(barcodeInput);
            }
          }}
          placeholder="Scanner un code-barres ou saisir une référence..."
          className="barcode-input"
          autoFocus
        />
        <button
          onClick={() => handleBarcodeScan(barcodeInput)}
          className="btn btn-scan"
          disabled={!barcodeInput.trim()}
        >
          Rechercher
        </button>
      </div>

      {/* Filtres */}
      <div className="inventory-filters">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showOnlyDifferences}
            onChange={(e) => setShowOnlyDifferences(e.target.checked)}
          />
          Afficher uniquement les écarts
        </label>

        <button
          onClick={validateInventory}
          disabled={inventoryStats.validated === 0}
          className="btn btn-primary"
        >
          Valider l'inventaire ({inventoryStats.validated} produit{inventoryStats.validated > 1 ? 's' : ''})
        </button>
      </div>

      {/* Liste des produits */}
      <div className="inventory-list">
        {displayedItems.map(item => (
          <div
            key={item.productId}
            id={`inventory-item-${item.productId}`}
            className={`inventory-item ${item.status} ${item.difference !== 0 ? 'has-difference' : ''} ${lastScannedProduct === item.productId ? 'scanned' : ''}`}
          >
            <div className="item-info">
              <div className="item-header">
                <span className="item-reference">{item.reference}</span>
                <span className={`item-status ${item.status}`}>
                  {item.status === 'pending' ? '⏳ À compter' :
                   item.status === 'counted' ? '✓ Compté' :
                   '✓✓ Validé'}
                </span>
              </div>
              <div className="item-designation">{item.designation}</div>
              <div className="item-details">
                <span>{item.category}</span>
                {item.storageZone && (
                  <span>
                    {item.storageZone}
                    {item.shelf && ` - ${item.shelf}`}
                    {item.position && ` - ${item.position}`}
                  </span>
                )}
              </div>
            </div>

            <div className="item-counting">
              <div className="stock-info">
                <div className="stock-system">
                  <label>Stock système</label>
                  <span className="stock-value">{item.systemStock}</span>
                </div>
                <div className="stock-counted">
                  <label>Stock compté</label>
                  <input
                    id={`count-input-${item.productId}`}
                    type="number"
                    min="0"
                    value={item.countedStock ?? ''}
                    onChange={(e) => updateCount(item.productId, e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="0"
                    className="count-input"
                    disabled={item.status === 'validated'}
                  />
                </div>
                {item.countedStock !== null && (
                  <div className={`stock-difference ${item.difference > 0 ? 'positive' : item.difference < 0 ? 'negative' : ''}`}>
                    <label>Écart</label>
                    <span className="difference-value">
                      {item.difference > 0 ? '+' : ''}{item.difference}
                    </span>
                  </div>
                )}
              </div>

              {item.difference !== 0 && item.status !== 'validated' && (
                <div className="item-notes">
                  <input
                    type="text"
                    placeholder="Notes sur l'écart (optionnel)..."
                    value={item.notes}
                    onChange={(e) => updateNotes(item.productId, e.target.value)}
                    className="notes-input"
                  />
                </div>
              )}

              {item.status === 'counted' && (
                <button
                  onClick={() => validateItem(item.productId)}
                  className="btn btn-validate"
                >
                  Valider le comptage
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
