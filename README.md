# Gestion des Stocks

Application web complète de gestion de stock avec authentification à deux niveaux : gestionnaire et utilisateur.

## Description

Cette application permet de gérer efficacement les stocks de produits avec :

### Espace Gestionnaire
- **Dashboard** : Vue d'ensemble avec statistiques, alertes de stock faible/critique et demandes en attente
- **Gestion des Produits** : Ajout, modification, suppression de produits avec photos
- **Inventaire Complet** : Tableau récapitulatif de toutes les références avec filtres
- **Gestion des Demandes** : Validation ou rejet des demandes de sortie
- **Paramètres** : Configuration des catégories et unités de mesure

### Espace Utilisateur
- **Dashboard Utilisateur** : Vue simplifiée avec statistiques personnelles
- **Demandes de Sortie** : Création de nouvelles demandes avec sélection de produit
- **Suivi des Demandes** : Consultation de l'historique et du statut des demandes

### Fonctionnalités Principales
- Système d'alerte automatique pour les stocks bas (seuil minimum/maximum)
- Gestion de photos pour chaque produit
- Unités de mesure personnalisables (pièces, kg, L, m, unité unique, etc.)
- Catégories personnalisables
- Stockage local des données (localStorage)
- Interface responsive et moderne

## Technologies Utilisées

- **React 18** : Framework JavaScript
- **TypeScript** : Typage statique
- **Vite** : Build tool et dev server
- **React Router** : Gestion des routes
- **Context API** : Gestion d'état globale
- **CSS3** : Styles personnalisés

## Installation

1. Cloner le repository
2. Installer les dépendances :
```bash
npm install
```

## Utilisation

### Lancer en mode développement
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Build pour production
```bash
npm run build
```

### Prévisualiser le build
```bash
npm run preview
```

## Comptes de Connexion

### Gestionnaire
- **Identifiant** : admin
- **Mot de passe** : admin
- **Accès** : Toutes les fonctionnalités de gestion

### Utilisateur
- **Identifiant** : user
- **Mot de passe** : user
- **Accès** : Demandes de sortie uniquement

## Structure du Projet

```
src/
├── components/         # Composants réutilisables
│   ├── Login.tsx      # Page de connexion
│   └── Layout.tsx     # Layout principal avec navigation
├── context/           # Context API pour la gestion d'état
│   └── AppContext.tsx # Context principal de l'application
├── pages/             # Pages de l'application
│   ├── Dashboard.tsx          # Dashboard gestionnaire
│   ├── AddProduct.tsx         # Ajout de produits
│   ├── Products.tsx           # Liste des produits
│   ├── Settings.tsx           # Paramètres
│   ├── Requests.tsx           # Gestion des demandes (gestionnaire)
│   ├── UserDashboard.tsx      # Dashboard utilisateur
│   ├── NewRequest.tsx         # Nouvelle demande
│   └── MyRequests.tsx         # Mes demandes (utilisateur)
├── types/             # Types TypeScript
│   └── index.ts       # Définitions des types
├── App.tsx            # Composant principal avec routes
├── main.tsx           # Point d'entrée
└── index.css          # Styles globaux
```

## Fonctionnalités Détaillées

### Gestion des Stocks
- Référence unique pour chaque produit
- Désignation et catégorie
- Emplacement physique
- Stock actuel, minimum et maximum
- Unité de mesure configurable
- Photo optionnelle

### Alertes Automatiques
- **Stock Faible** : Quand le stock atteint le seuil minimum
- **Stock Critique** : Quand le stock est à 0
- Pourcentage du stock maximum affiché
- Barre de progression visuelle

### Demandes de Sortie
- Sélection du produit disponible
- Indication de la quantité souhaitée
- Raison de la demande obligatoire
- Validation automatique du stock disponible
- Workflow d'approbation par le gestionnaire
- Mise à jour automatique du stock après approbation

## Stockage des Données

Les données sont stockées localement dans le navigateur (localStorage) :
- Produits
- Catégories
- Unités
- Demandes de sortie
- Session utilisateur

## Évolutions Futures Possibles

- Backend avec base de données réelle
- Export des données (PDF, Excel)
- Historique détaillé des mouvements
- Notifications en temps réel
- Impression d'étiquettes
- Codes-barres / QR codes
- Multi-utilisateurs avec rôles personnalisés
- Statistiques avancées et graphiques
