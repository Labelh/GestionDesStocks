import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContextSupabase';
import './Layout.css';

const Layout: React.FC = () => {
  const { currentUser, logout, exitRequests, getPendingExits } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isManager = currentUser?.role === 'manager';
  const pendingRequestsCount = exitRequests.filter(r => r.status === 'pending').length;
  const pendingExitsCount = getPendingExits().length;

  const isActive = (path: string) => location.pathname === path;

  const managerLinks = [
    { path: '/dashboard', label: 'Tableau de bord', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    )},
    { path: '/statistics', label: 'Statistiques', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )},
    { path: '/products', label: 'Produits', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    )},
    { path: '/add-product', label: 'Ajouter Produit', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    )},
    { path: '/requests', label: 'Demandes', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    )},
    { path: '/exit-sheet', label: 'Feuille de Sortie', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    )},
    { path: '/history', label: 'Historique', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )},
    { path: '/settings', label: 'Paramètres', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6m5.196-13.804l-4.242 4.242m-5.908 5.908l-4.242 4.242M23 12h-6m-6 0H1m18.196 5.196l-4.242-4.242m-5.908-5.908L4.804 2.804" />
      </svg>
    )},
  ];

  const userLinks = [
    { path: '/catalog', label: 'Catalogue', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    )},
    { path: '/my-requests', label: 'Mes Demandes', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    )},
  ];

  const links = isManager ? managerLinks : userLinks;

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div className="sidebar-title-container">
            <h1 className="sidebar-title">StockPro</h1>
            <p className="sidebar-subtitle">Ajust'82</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`sidebar-link ${isActive(link.path) ? 'active' : ''}`}
              title={link.label}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              <span className="sidebar-link-label">{link.label}</span>
              {link.path === '/requests' && pendingRequestsCount > 0 && (
                <span className="sidebar-badge">{pendingRequestsCount}</span>
              )}
              {link.path === '/exit-sheet' && pendingExitsCount > 0 && (
                <span className="sidebar-badge">{pendingExitsCount}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {currentUser?.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{currentUser?.name}</div>
              <div className="user-role">{isManager ? 'Gestionnaire' : 'Utilisateur'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout" title="Déconnexion">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
