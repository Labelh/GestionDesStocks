import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContextSupabase';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    const success = await login(username, password);
    if (!success) {
      setError('Identifiants incorrects');
    }
    setLoading(false);
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
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '0.5rem',
          color: 'var(--text-color)',
          fontSize: '2rem',
          fontWeight: '700'
        }}>
          Connexion
        </h2>
        <p style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: 'var(--text-secondary)',
          fontSize: '0.95rem'
        }}>
          Gestion des Stocks
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-color)',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-color)',
                fontSize: '1rem',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--border-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-color)',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  paddingRight: '2.5rem',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-color)',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--border-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '1.2rem'
                }}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '0.875rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'transparent',
                color: 'var(--text-color)',
                border: '1px solid rgba(128, 128, 128, 0.4)',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'rgba(128, 128, 128, 0.2)';
                  e.currentTarget.style.borderColor = 'var(--accent-color)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(128, 128, 128, 0.4)';
              }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'transparent',
                color: 'var(--text-color)',
                border: '1px solid rgba(128, 128, 128, 0.4)',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'rgba(128, 128, 128, 0.2)';
                  e.currentTarget.style.borderColor = 'var(--accent-color)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(128, 128, 128, 0.4)';
              }}
            >
              S'inscrire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
