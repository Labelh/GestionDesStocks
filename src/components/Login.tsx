import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const success = login(username, password);
    if (!success) {
      setError('Identifiants incorrects');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Gestion des Stocks</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary">
            Se connecter
          </button>
        </form>
        <div className="login-info">
          <p><strong>Compte gestionnaire:</strong> admin / admin</p>
          <p><strong>Compte utilisateur:</strong> user / user</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
