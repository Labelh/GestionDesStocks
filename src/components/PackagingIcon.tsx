import React from 'react';
import { PackagingType } from '../types';

interface PackagingIconProps {
  type?: PackagingType;
  mode?: 'icon' | 'text'; // icon pour juste l'emoji, text pour le nom complet
  size?: 'small' | 'medium' | 'large';
}

const PackagingIcon: React.FC<PackagingIconProps> = ({
  type = 'unit',
  mode = 'icon',
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
    small: { fontSize: '1rem' },
    medium: { fontSize: '1.125rem' },
    large: { fontSize: '1.25rem' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: sizeStyles[size].fontSize,
        cursor: 'help',
        lineHeight: 1,
      }}
      title={`${item.text}: ${item.description}`}
    >
      {mode === 'icon' ? item.icon : item.text}
    </span>
  );
};

export default PackagingIcon;
