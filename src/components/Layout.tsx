import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContextSupabase';
import './Layout.css';

const Layout: React.FC = () => {
  const { currentUser, logout, exitRequests, getPendingExits, getPendingOrders } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showWelcome, setShowWelcome] = React.useState(false);
  const hasMountedRef = React.useRef(false);
  const prevUserRef = React.useRef<typeof currentUser>(null);

  const handleLogout = () => {
    setShowWelcome(false); // Masquer immédiatement la notification
    logout();
    navigate('/badge-login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Afficher le message de bienvenue uniquement lors de la connexion
  React.useEffect(() => {
    // Premier montage du composant
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevUserRef.current = currentUser;
      return;
    }

    // Si on passe de null à un utilisateur connecté = connexion
    if (currentUser && !prevUserRef.current) {
      setShowWelcome(true);
      prevUserRef.current = currentUser;
    }
    // Si on passe d'un utilisateur à null = déconnexion
    else if (!currentUser && prevUserRef.current) {
      setShowWelcome(false);
      prevUserRef.current = null;
    }
  }, [currentUser]);

  // Timer séparé pour masquer la notification après 4 secondes
  React.useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  const isManager = currentUser?.role === 'manager';

  // Compter le nombre de paniers en attente (groupés par utilisateur et minute)
  const pendingRequestsCount = React.useMemo(() => {
    const pendingRequests = exitRequests.filter(r => r.status === 'pending');
    const basketsSet = new Set<string>();

    pendingRequests.forEach(request => {
      const basketKey = `${request.requestedBy}-${new Date(request.requestedAt).toISOString().slice(0, 16)}`;
      basketsSet.add(basketKey);
    });

    return basketsSet.size;
  }, [exitRequests]);

  const pendingExitsCount = getPendingExits().length;
  const pendingOrdersCount = getPendingOrders().length;

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
    { path: '/orders', label: 'Réception', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        <path d="M9 12h6"/>
        <path d="M9 16h6"/>
      </svg>
    )},
    { path: '/requests', label: 'Vérifications', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    )},
    { path: '/inventory', label: 'Inventaire', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <path d="M9 15h6"/>
        <path d="M12 12v6"/>
      </svg>
    )},
    { path: '/statistics', label: 'Statistiques', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )},
    { path: '/history', label: 'Historique', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )},
    { path: '/user-management', label: 'Gestion Utilisateurs', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )},
    { path: '/label-generator', label: 'Étiquettes', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
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
    { path: '/my-statistics', label: 'Mes Statistiques', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )},
  ];

  const links = isManager ? managerLinks : userLinks;

  return (
    <div className="layout-container">
      {/* Message de bienvenue */}
      {showWelcome && currentUser && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          background: '#2a2a2a',
          border: '2px solid #4a4a4a',
          color: 'white',
          padding: '1.25rem 2rem',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          animation: 'slideInRight 0.5s ease-out, fadeOut 0.5s ease-out 3.5s',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          maxWidth: '400px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>
              Bienvenue {currentUser.name.split(' ')[0]} !
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Connexion réussie
            </div>
          </div>
        </div>
      )}

      {/* Bouton hamburger pour mobile */}
      <button className="mobile-menu-button" onClick={toggleMobileMenu}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay pour fermer le menu sur mobile */}
      {isMobileMenuOpen && <div className="mobile-menu-overlay" onClick={closeMobileMenu} />}

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
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
              onClick={closeMobileMenu}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              <span className="sidebar-link-label">{link.label}</span>
              {link.path === '/requests' && pendingRequestsCount > 0 && (
                <span className="sidebar-badge">{pendingRequestsCount}</span>
              )}
              {link.path === '/orders' && pendingOrdersCount > 0 && (
                <span className="sidebar-badge">{pendingOrdersCount}</span>
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
          <div className="footer-actions">
            <button onClick={handleLogout} className="btn-logout" title="Déconnexion">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
