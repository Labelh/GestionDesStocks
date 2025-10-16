import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContextSupabase';

const Layout: React.FC = () => {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isManager = currentUser?.role === 'manager';

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>Gestion des Stocks</h2>
        </div>
        <div className="nav-links">
          {isManager ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/products">Produits</Link>
              <Link to="/add-product">Ajouter Produit</Link>
              <Link to="/requests">Demandes</Link>
              <Link to="/statistics">Statistiques</Link>
              <Link to="/history">Historique</Link>
              <Link to="/settings">Paramètres</Link>
            </>
          ) : (
            <>
              <Link to="/catalog">Catalogue</Link>
              <Link to="/my-requests">Mes Demandes</Link>
            </>
          )}
        </div>
        <div className="nav-user">
          <span className="user-name">{currentUser?.name}</span>
          <button onClick={handleLogout} className="btn-icon btn-logout" title="Déconnexion">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
