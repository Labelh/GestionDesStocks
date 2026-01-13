import React from 'react';
import { PackagingType } from '../types';

interface PackagingIconProps {
  type?: PackagingType;
  mode?: 'icon' | 'text'; // icon pour liste produits, text pour catalogue
  variant?: 'colored' | 'transparent' | 'dark'; // colored = avec couleur, transparent = sans couleur, dark = fond noir transparent
  size?: 'small' | 'medium' | 'large';
}

const PackagingIcon: React.FC<PackagingIconProps> = ({
  type = 'unit',
  mode = 'icon',
  variant = 'colored',
  size = 'small'
}) => {
  const config = {
    unit: {
      icon: '🔧',
      text: 'Unité',
      description: 'Déclarer à chaque sortie',
      color: '#10b981', // vert
    },
    lot: {
      icon: '📦',
      text: 'Lot',
      description: 'Déclarer à l\'ouverture',
      color: '#3b82f6', // bleu
    },
  };

  const item = config[type];

  const sizeStyles = {
    small: { fontSize: '0.6875rem', padding: '0.1875rem 0.4rem' },
    medium: { fontSize: '0.75rem', padding: '0.25rem 0.5rem' },
    large: { fontSize: '0.875rem', padding: '0.3rem 0.6rem' },
  };

  // Style selon la variante
  const getVariantStyle = () => {
    switch (variant) {
      case 'transparent':
        return {
          background: 'transparent',
          border: `1px solid rgba(255, 255, 255, 0.2)`,
          color: 'var(--text-color)',
        };
      case 'dark':
        return {
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
        };
      case 'colored':
      default:
        return {
          background: `${item.color}15`,
          border: `1px solid ${item.color}30`,
          color: item.color,
        };
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: mode === 'text' ? '0' : '0.3rem',
        padding: sizeStyles[size].padding,
        borderRadius: '4px',
        ...getVariantStyle(),
        fontSize: sizeStyles[size].fontSize,
        fontWeight: '600',
        cursor: 'help',
        whiteSpace: 'nowrap',
      }}
      title={`${item.text}: ${item.description}`}
    >
      {mode === 'icon' ? (
        <span style={{ lineHeight: 1 }}>{item.icon}</span>
      ) : (
        <span>{item.text}</span>
      )}
    </div>
  );
};

export default PackagingIcon;
