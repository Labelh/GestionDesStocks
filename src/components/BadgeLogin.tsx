import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { Html5Qrcode } from 'html5-qrcode';

const BadgeLogin: React.FC = () => {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const { loginWithBadge } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
        // Focus avec délai pour s'assurer que l'UI est mise à jour
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 100);
      }
    } catch (err) {
      setError('Erreur lors de la connexion');
      setBadgeNumber('');
      // Focus avec délai pour s'assurer que l'UI est mise à jour
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
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

  const startScanner = async () => {
    setShowScanner(true);
    setScannerError('');

    try {
      // Demander d'abord l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      // Arrêter le stream immédiatement, html5-qrcode va le redémarrer
      stream.getTracks().forEach(track => track.stop());

      const html5QrCode = new Html5Qrcode("barcode-scanner");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 }
        },
        (decodedText) => {
          // Code-barres détecté
          stopScanner();
          setBadgeNumber(decodedText);
          setError('');
        },
        (_errorMessage) => {
          // Erreur de scan (normal, c'est continu)
        }
      );
    } catch (err: any) {
      console.error('Erreur lors du démarrage du scanner:', err);

      let errorMsg = 'Impossible d\'accéder à la caméra.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Permission refusée. Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur et réessayer.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'Aucune caméra détectée sur cet appareil.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'La caméra est déjà utilisée par une autre application.';
      } else if (err.name === 'SecurityError') {
        errorMsg = 'Accès à la caméra bloqué. Assurez-vous que le site utilise HTTPS.';
      }

      setScannerError(errorMsg);
      setShowScanner(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Erreur lors de l\'arrêt du scanner:', err);
      }
    }
    setShowScanner(false);
  };

  // Nettoyer le scanner au démontage du composant
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

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
      }}
      className="badge-login-card"
      >
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

        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'stretch',
          width: '100%'
        }}>
          {/* Bouton de scan */}
          <button
            onClick={startScanner}
            disabled={loading}
            className="scan-button"
            style={{
              width: '56px',
              minWidth: '56px',
              flexShrink: 0,
              background: 'transparent',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1,
              fontSize: '1.75rem'
            }}
            title="Scanner un code-barres"
          >
            <i className='bx bx-barcode-reader'></i>
          </button>

          {/* Champ de saisie */}
          <input
            ref={inputRef}
            type="password"
            value={badgeNumber}
            onChange={handleChange}
            placeholder="Numéro de badge"
            disabled={loading}
            autoComplete="off"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '1rem',
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
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <style>{`
            input::placeholder {
              opacity: 0.4;
              font-size: 0.9rem;
              font-weight: 400;
              letter-spacing: normal;
            }
            .scan-button:hover:not(:disabled) {
              border-color: var(--accent-color);
              color: var(--accent-color);
            }
          `}</style>
        </div>

        {/* Message d'erreur du scanner */}
        {scannerError && (
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
            <div style={{ marginBottom: '0.75rem' }}>
              ✕ {scannerError}
            </div>
            <button
              onClick={() => {
                setScannerError('');
                startScanner();
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ef4444';
              }}
            >
              Réessayer
            </button>
            <div style={{
              marginTop: '0.75rem',
              fontSize: '0.85rem',
              color: '#f87171',
              lineHeight: '1.5'
            }}>
              <strong>Astuce :</strong> Sur mobile, appuyez sur l'icône de cadenas/info dans la barre d'adresse pour gérer les permissions de la caméra.
            </div>
          </div>
        )}

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

      {/* Modal du scanner */}
      {showScanner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: 'var(--text-color)', margin: 0 }}>Scanner le code-barres</h3>
              <button
                onClick={stopScanner}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              Positionnez le code-barres dans le cadre
            </p>

            {/* Zone de scan */}
            <div
              id="barcode-scanner"
              style={{
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#000'
              }}
            />
          </div>
        </div>
      )}

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

        /* Responsive pour mobile */
        @media (max-width: 768px) {
          .badge-login-card {
            padding: 2rem 1.5rem !important;
          }
          .badge-login-card h1 {
            font-size: 2rem !important;
          }
          .badge-login-card h2 {
            font-size: 1.5rem !important;
          }
          .badge-login-card svg {
            width: 48px !important;
            height: 48px !important;
          }
        }

        @media (max-width: 480px) {
          .badge-login-card {
            padding: 1.5rem 1rem !important;
          }
          .badge-login-card h1 {
            font-size: 1.75rem !important;
          }
          .badge-login-card h2 {
            font-size: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BadgeLogin;
