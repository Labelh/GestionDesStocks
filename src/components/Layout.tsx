import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

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
              <Link to="/settings">Paramètres</Link>
            </>
          ) : (
            <>
              <Link to="/user-dashboard">Accueil</Link>
              <Link to="/new-request">Nouvelle Demande</Link>
              <Link to="/my-requests">Mes Demandes</Link>
            </>
          )}
        </div>
        <div className="nav-user">
          <span className="user-name">{currentUser?.name}</span>
          <button onClick={handleLogout} className="btn btn-secondary">
            Déconnexion
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
