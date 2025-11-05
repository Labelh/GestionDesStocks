import React, { useState, useEffect } from 'react';
import { ShelfConfig } from '../types';
import './ZoneConfigModal.css';

interface ZoneConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, shelfConfigs: ShelfConfig[]) => void;
  initialName?: string;
  initialDescription?: string;
  initialShelfConfigs?: ShelfConfig[];
  mode: 'create' | 'edit';
}

const ZoneConfigModal: React.FC<ZoneConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialDescription = '',
  initialShelfConfigs = [],
  mode
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [numShelves, setNumShelves] = useState(initialShelfConfigs.length || 1);
  const [shelfConfigs, setShelfConfigs] = useState<ShelfConfig[]>(
    initialShelfConfigs.length > 0
      ? initialShelfConfigs
      : [{ shelfNumber: 1, rows: 2, columns: 3 }]
  );

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      if (initialShelfConfigs.length > 0) {
        setNumShelves(initialShelfConfigs.length);
        setShelfConfigs(initialShelfConfigs);
      } else {
        setNumShelves(1);
        setShelfConfigs([{ shelfNumber: 1, rows: 2, columns: 3 }]);
      }
    }
  }, [isOpen, initialName, initialDescription, initialShelfConfigs]);

  const handleNumShelvesChange = (num: number) => {
    const validNum = Math.max(1, Math.min(20, num));
    setNumShelves(validNum);

    const newConfigs: ShelfConfig[] = [];
    for (let i = 1; i <= validNum; i++) {
      const existing = shelfConfigs.find(c => c.shelfNumber === i);
      newConfigs.push(
        existing || { shelfNumber: i, rows: 2, columns: 3 }
      );
    }
    setShelfConfigs(newConfigs);
  };

  const updateShelfConfig = (shelfNumber: number, field: 'rows' | 'columns', value: number) => {
    const validValue = Math.max(1, Math.min(20, value));
    setShelfConfigs(prev =>
      prev.map(config =>
        config.shelfNumber === shelfNumber
          ? { ...config, [field]: validValue }
          : config
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Veuillez saisir un nom pour la zone');
      return;
    }
    onSave(name, description, shelfConfigs);
  };

  const getTotalSlots = (config: ShelfConfig) => config.rows * config.columns;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content zone-config-modal">
        <div className="modal-header">
          <h2>{mode === 'create' ? 'Créer une Zone de Stockage' : 'Modifier la Zone de Stockage'}</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="zone-config-form">
          <div className="form-section">
            <h3>Informations Générales</h3>
            <div className="form-group">
              <label htmlFor="zoneName">Nom de la zone *</label>
              <input
                type="text"
                id="zoneName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Zone A, Entrepôt Principal..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="zoneDescription">Description</label>
              <input
                type="text"
                id="zoneDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle"
              />
            </div>

            <div className="form-group">
              <label htmlFor="numShelves">Nombre d'étagères</label>
              <input
                type="number"
                id="numShelves"
                value={numShelves}
                onChange={(e) => handleNumShelvesChange(parseInt(e.target.value) || 1)}
                min="1"
                max="20"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Configuration des Étagères</h3>
            <p className="section-description">
              Définissez le nombre de rangées et de colonnes pour chaque étagère
            </p>

            <div className="shelves-config-list">
              {shelfConfigs.map((config) => (
                <div key={config.shelfNumber} className="shelf-config-item">
                  <div className="shelf-config-header">
                    <strong>Étagère {config.shelfNumber}</strong>
                    <span className="total-slots">
                      {getTotalSlots(config)} emplacements
                    </span>
                  </div>

                  <div className="shelf-config-inputs">
                    <div className="input-group">
                      <label>Rangées</label>
                      <input
                        type="number"
                        value={config.rows}
                        onChange={(e) =>
                          updateShelfConfig(config.shelfNumber, 'rows', parseInt(e.target.value) || 1)
                        }
                        min="1"
                        max="20"
                      />
                    </div>

                    <div className="input-group">
                      <label>Colonnes</label>
                      <input
                        type="number"
                        value={config.columns}
                        onChange={(e) =>
                          updateShelfConfig(config.shelfNumber, 'columns', parseInt(e.target.value) || 1)
                        }
                        min="1"
                        max="20"
                      />
                    </div>
                  </div>

                  {/* Aperçu visuel de la grille */}
                  <div className="grid-preview">
                    <div
                      className="grid-container"
                      style={{
                        gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
                        gridTemplateRows: `repeat(${config.rows}, 1fr)`,
                      }}
                    >
                      {Array.from({ length: getTotalSlots(config) }, (_, i) => (
                        <div key={i} className="grid-slot">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === 'create' ? 'Créer la Zone' : 'Enregistrer les Modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ZoneConfigModal;
