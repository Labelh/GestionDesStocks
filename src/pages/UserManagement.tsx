import React, { useState } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { User } from '../types';
import { generateBadgesPDF } from '../utils/badgePdfGenerator';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const { users, updateUserRole, createUser, updateUserBadge, deleteUser, currentUser } = useApp();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'manager'>('all');

  // Form state for creating user
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBadgeNumber, setNewBadgeNumber] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'manager'>('user');
  const [error, setError] = useState('');

  // State for editing badge
  const [editingBadge, setEditingBadge] = useState<string | null>(null);
  const [editBadgeValue, setEditBadgeValue] = useState('');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: 'user' | 'manager') => {
    try {
      await updateUserRole(userId, newRole);
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Erreur lors de la modification du rôle:', error);
      alert('Erreur lors de la modification du rôle');
    }
  };

  const openModal = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setError('');
    setNewUsername('');
    setNewName('');
    setNewPassword('');
    setNewBadgeNumber('');
    setNewRole('user');
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setError('');
    setNewUsername('');
    setNewName('');
    setNewPassword('');
    setNewBadgeNumber('');
    setNewRole('user');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newUsername || !newName || !newPassword) {
      setError('Tous les champs sont requis');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const badgeToSend = newBadgeNumber.trim() !== '' ? newBadgeNumber.trim() : undefined;
      await createUser(newUsername, newName, newPassword, newRole, badgeToSend);
      closeCreateModal();
      alert('Utilisateur créé avec succès !');
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleUpdateBadge = async (userId: string) => {
    try {
      await updateUserBadge(userId, editBadgeValue.trim() || null);
      setEditingBadge(null);
      setEditBadgeValue('');
      alert('Badge mis à jour avec succès !');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la mise à jour du badge');
    }
  };

  const startEditBadge = (user: User) => {
    setEditingBadge(user.id);
    setEditBadgeValue(user.badgeNumber || '');
  };

  const cancelEditBadge = () => {
    setEditingBadge(null);
    setEditBadgeValue('');
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ?`)) {
      try {
        await deleteUser(user.id);
        alert('Utilisateur supprimé avec succès');
      } catch (error: any) {
        alert(error.message || 'Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const getRoleBadgeClass = (role: string) => {
    return role === 'manager' ? 'role-badge-manager' : 'role-badge-user';
  };

  const getRoleLabel = (role: string) => {
    return role === 'manager' ? 'Gestionnaire' : 'Utilisateur';
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div>
          <h1>Gestion des Utilisateurs</h1>
          <p className="subtitle">Gérer les rôles et permissions des utilisateurs</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="btn-create-user"
            onClick={() => generateBadgesPDF(users)}
            style={{ background: 'var(--success-color)' }}
            title="Générer un PDF avec tous les codes-barres des badges"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" ry="2"/>
              <line x1="7" y1="8" x2="17" y2="8"/>
              <line x1="7" y1="12" x2="17" y2="12"/>
              <line x1="7" y1="16" x2="17" y2="16"/>
            </svg>
            PDF Badges
          </button>
          <button className="btn-create-user" onClick={openCreateModal}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Nouvel Utilisateur
          </button>
        </div>
      </div>

      <div className="user-management-filters">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterRole === 'all' ? 'active' : ''}`}
            onClick={() => setFilterRole('all')}
          >
            Tous ({users.length})
          </button>
          <button
            className={`filter-tab ${filterRole === 'manager' ? 'active' : ''}`}
            onClick={() => setFilterRole('manager')}
          >
            Gestionnaires ({users.filter(u => u.role === 'manager').length})
          </button>
          <button
            className={`filter-tab ${filterRole === 'user' ? 'active' : ''}`}
            onClick={() => setFilterRole('user')}
          >
            Utilisateurs ({users.filter(u => u.role === 'user').length})
          </button>
        </div>
      </div>

      <div className="users-grid">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <div className="user-avatar-large">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <div className="user-card-body">
                <h3 className="user-card-name">{user.name}</h3>
                <p className="user-card-username">@{user.username}</p>

                <div className="user-card-info">
                  <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>{user.role === 'manager' ? 'Accès complet' : 'Accès limité'}</span>
                  </div>
                  {editingBadge === user.id ? (
                    <div className="info-item badge-edit" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        value={editBadgeValue}
                        onChange={(e) => setEditBadgeValue(e.target.value)}
                        placeholder="Numéro de badge"
                        style={{
                          flex: 1,
                          padding: '0.375rem 0.5rem',
                          fontSize: '0.85rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          background: 'var(--input-bg)',
                          color: 'var(--text-color)'
                        }}
                      />
                      <button
                        onClick={() => handleUpdateBadge(user.id)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.85rem',
                          background: 'var(--accent-color)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEditBadge}
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.85rem',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-color)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="info-item" style={{ marginTop: '0.5rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="16" rx="2" ry="2"/>
                        <line x1="7" y1="8" x2="17" y2="8"/>
                        <line x1="7" y1="12" x2="17" y2="12"/>
                      </svg>
                      <span style={{ flex: 1 }}>
                        {user.badgeNumber ? `Badge: ${user.badgeNumber}` : 'Aucun badge'}
                      </span>
                      <button
                        onClick={() => startEditBadge(user)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-color)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          padding: '0.25rem'
                        }}
                        title="Modifier le badge"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="user-card-actions">
                <button
                  className="btn-modify-role"
                  onClick={() => openModal(user)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Modifier le rôle
                </button>
                {user.id !== currentUser?.id && (
                  <button
                    className="btn-delete-user"
                    onClick={() => handleDeleteUser(user)}
                    title="Supprimer l'utilisateur"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier le rôle</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="user-info-modal">
                <div className="user-avatar-large">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedUser.name}</h3>
                  <p className="text-muted">@{selectedUser.username}</p>
                </div>
              </div>

              <div className="role-selection">
                <p className="role-selection-label">Sélectionnez le nouveau rôle :</p>

                <div className="role-options">
                  <div
                    className={`role-option ${selectedUser.role === 'user' ? 'selected' : ''}`}
                    onClick={() => handleRoleChange(selectedUser.id, 'user')}
                  >
                    <div className="role-option-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="role-option-content">
                      <h4>Utilisateur</h4>
                      <p>Accès limité au catalogue et à ses demandes</p>
                    </div>
                    {selectedUser.role === 'user' && (
                      <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  <div
                    className={`role-option ${selectedUser.role === 'manager' ? 'selected' : ''}`}
                    onClick={() => handleRoleChange(selectedUser.id, 'manager')}
                  >
                    <div className="role-option-icon role-option-icon-manager">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className="role-option-content">
                      <h4>Gestionnaire</h4>
                      <p>Accès complet à toutes les fonctionnalités</p>
                    </div>
                    {selectedUser.role === 'manager' && (
                      <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création d'utilisateur */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content create-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Créer un nouvel utilisateur</h2>
              <button className="modal-close" onClick={closeCreateModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="modal-body">
              {error && (
                <div className="error-message">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="form-group-create">
                <label>Nom d'utilisateur *</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: jdupont"
                  required
                />
              </div>

              <div className="form-group-create">
                <label>Nom complet *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  required
                />
              </div>

              <div className="form-group-create">
                <label>Mot de passe *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group-create">
                <label>Numéro de badge (optionnel)</label>
                <input
                  type="text"
                  value={newBadgeNumber}
                  onChange={(e) => setNewBadgeNumber(e.target.value)}
                  placeholder="Ex: 12345678"
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Permet la connexion par scan de badge
                </p>
              </div>

              <div className="form-group-create">
                <label>Rôle</label>
                <div className="role-options-create">
                  <div
                    className={`role-option-create ${newRole === 'user' ? 'selected' : ''}`}
                    onClick={() => setNewRole('user')}
                  >
                    <div className="role-option-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="role-option-content">
                      <h4>Utilisateur</h4>
                      <p>Accès limité au catalogue</p>
                    </div>
                    {newRole === 'user' && (
                      <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  <div
                    className={`role-option-create ${newRole === 'manager' ? 'selected' : ''}`}
                    onClick={() => setNewRole('manager')}
                  >
                    <div className="role-option-icon role-option-icon-manager">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className="role-option-content">
                      <h4>Gestionnaire</h4>
                      <p>Accès complet à l'application</p>
                    </div>
                    {newRole === 'manager' && (
                      <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-actions-create">
                <button type="button" className="btn-cancel" onClick={closeCreateModal}>
                  Annuler
                </button>
                <button type="submit" className="btn-submit">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  Créer l'utilisateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
