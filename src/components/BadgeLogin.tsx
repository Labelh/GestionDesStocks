import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContextSupabase';

const BadgeLogin: React.FC = () => {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { loginWithBadge } = useApp();
  const navigate = useNavigate();
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
        {/* Icône de scan */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2rem',
          animation: scanning ? 'pulse 1s infinite' : 'none'
        }}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke={scanning ? '#10b981' : 'var(--accent-color)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" ry="2"/>
            <line x1="7" y1="8" x2="17" y2="8"/>
            <line x1="7" y1="12" x2="17" y2="12"/>
            <line x1="7" y1="16" x2="13" y2="16"/>
          </svg>
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
              textAlign: 'center',
              fontFamily: 'monospace',
              fontWeight: '600',
              letterSpacing: '0.2rem',
              transition: 'all 0.3s',
              outline: 'none'
            }}
          />
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

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            disabled={loading}
            style={{
              padding: '0.875rem 1.5rem',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(128, 128, 128, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Connexion classique
          </button>
        </div>
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
