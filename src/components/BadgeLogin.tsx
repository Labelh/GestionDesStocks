import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContextSupabase';

const BadgeLogin: React.FC = () => {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { loginWithBadge } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);

  // Configuration du scan automatique
  const BADGE_MIN_LENGTH = 4; // Minimum de caractères pour un badge
  const BADGE_MAX_LENGTH = 20; // Maximum de caractères pour un badge
  const AUTO_SUBMIT_DELAY = 300; // Délai avant soumission automatique (ms)

  // Focus automatique sur l'input au chargement
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Gestion de la soumission automatique
  useEffect(() => {
    if (badgeNumber.length >= BADGE_MIN_LENGTH && badgeNumber.length <= BADGE_MAX_LENGTH) {
      const timer = setTimeout(() => {
        handleSubmit();
      }, AUTO_SUBMIT_DELAY);

      return () => clearTimeout(timer);
    }
  }, [badgeNumber]);

  const handleSubmit = async () => {
    if (!badgeNumber.trim() || loading) return;

    setError('');
    setLoading(true);
    setScanning(true);

    try {
      const success = await loginWithBadge(badgeNumber.trim());
      if (!success) {
        setError('Badge non reconnu');
        setBadgeNumber('');
        inputRef.current?.focus();
      }
    } catch (err) {
      setError('Erreur lors de la connexion');
      setBadgeNumber('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
      setTimeout(() => setScanning(false), 500);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Autoriser uniquement les caractères alphanumériques
    if (/^[a-zA-Z0-9]*$/.test(value)) {
      setBadgeNumber(value);
      setError('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-color)',
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--card-bg)',
        padding: '3rem',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '500px',
        border: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        {/* Titre de l'application avec icône */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          {/* Icône de gestion de stock */}
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke={scanning ? '#10b981' : 'var(--accent-color)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              flexShrink: 0,
              animation: scanning ? 'pulse 1s infinite' : 'none'
            }}
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>

          {/* Textes alignés à gauche */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.25rem'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'var(--accent-color)',
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              StockPro
            </h1>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              margin: 0,
              fontWeight: '500'
            }}>
              Ajust'82
            </p>
          </div>
        </div>

        <h2 style={{
          marginBottom: '0.5rem',
          color: 'var(--text-color)',
          fontSize: '2rem',
          fontWeight: '700'
        }}>
          Scanner votre badge
        </h2>

        <p style={{
          marginBottom: '2rem',
          color: 'var(--text-secondary)',
          fontSize: '1rem'
        }}>
          Utilisez le lecteur code-barre ou saisissez manuellement
        </p>

        <div style={{ marginBottom: '2rem' }}>
          <input
            ref={inputRef}
            type="text"
            value={badgeNumber}
            onChange={handleChange}
            placeholder="Numéro de badge"
            disabled={loading}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '1.25rem',
              background: 'var(--input-bg)',
              border: `2px solid ${error ? '#ef4444' : scanning ? '#10b981' : 'var(--border-color)'}`,
              borderRadius: '8px',
              color: 'var(--text-color)',
              fontSize: '1.5rem',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontWeight: '600',
              letterSpacing: '0.2rem',
              transition: 'all 0.3s',
              outline: 'none'
            }}
          />
          <style>{`
            input::placeholder {
              opacity: 0.4;
              font-size: 0.9rem;
              font-weight: 400;
              letter-spacing: normal;
            }
          `}</style>
        </div>

        {/* Indicateur de statut */}
        {scanning && (
          <div style={{
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#10b981',
            marginBottom: '1.5rem',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}>
            ✓ Badge détecté, connexion en cours...
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            marginBottom: '1.5rem',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}>
            ✕ {error}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default BadgeLogin;
