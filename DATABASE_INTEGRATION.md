# Guide d'Intégration Base de Données

## Migration de localStorage vers une Base de Données Serveur

Actuellement, l'application utilise `localStorage` pour stocker les données. Pour ne jamais perdre vos données, vous devez migrer vers une base de données hébergée sur votre serveur.

## Options de Base de Données

### Option 1 : Firebase (Le Plus Simple - Gratuit)

#### Avantages
- Configuration rapide (environ 30 minutes)
- Hébergement gratuit jusqu'à 1GB
- Synchronisation en temps réel
- Pas besoin de serveur backend

#### Étapes d'Intégration

1. **Créer un projet Firebase**
   - Allez sur [firebase.google.com](https://firebase.google.com)
   - Créez un nouveau projet
   - Activez "Firestore Database"

2. **Installer Firebase**
```bash
npm install firebase
```

3. **Créer src/config/firebase.ts**
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

4. **Modifier src/context/AppContext.tsx**

Remplacer les fonctions localStorage par des appels Firestore :

```typescript
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

// Exemple pour addProduct
const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Product added with ID:', docRef.id);
  } catch (error) {
    console.error('Error adding product:', error);
  }
};

// Écouter les changements en temps réel
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
    const productsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    setProducts(productsData);
  });

  return () => unsubscribe();
}, []);
```

### Option 2 : Backend Node.js + MySQL/PostgreSQL

#### Architecture Complète

1. **Backend (API REST)**
   - Node.js + Express
   - MySQL ou PostgreSQL
   - Hébergement sur votre serveur

2. **Frontend**
   - Application React actuelle
   - Appels API au lieu de localStorage

#### Structure du Backend

**1. Installer les dépendances**
```bash
mkdir backend
cd backend
npm init -y
npm install express mysql2 cors dotenv bcrypt jsonwebtoken
```

**2. Créer backend/server.js**
```javascript
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configuration de la base de données
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Routes Products
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { reference, designation, category, location, currentStock, minStock, maxStock, unit, photo } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (reference, designation, category, location, currentStock, minStock, maxStock, unit, photo, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [reference, designation, category, location, currentStock, minStock, maxStock, unit, photo]
    );
    res.json({ id: result.insertId, message: 'Product created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const [result] = await pool.query(
      'UPDATE products SET ?, updatedAt = NOW() WHERE id = ?',
      [updates, id]
    );
    res.json({ message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes similaires pour categories, units, exitRequests...

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**3. Créer le schéma de base de données**

```sql
-- Fichier: backend/schema.sql

CREATE DATABASE gestion_stocks;
USE gestion_stocks;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(100) NOT NULL UNIQUE,
  designation VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  currentStock DECIMAL(10, 2) NOT NULL,
  minStock DECIMAL(10, 2) NOT NULL,
  maxStock DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  photo LONGTEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(20) NOT NULL,
  isDefault BOOLEAN DEFAULT FALSE
);

CREATE TABLE exit_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  productReference VARCHAR(100) NOT NULL,
  productDesignation VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  requestedBy VARCHAR(100) NOT NULL,
  requestedAt DATETIME NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL,
  approvedBy VARCHAR(100),
  approvedAt DATETIME,
  reason TEXT,
  notes TEXT,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'manager') NOT NULL,
  name VARCHAR(255) NOT NULL
);
```

**4. Créer backend/.env**
```env
DB_HOST=localhost
DB_USER=votre_user
DB_PASSWORD=votre_password
DB_NAME=gestion_stocks
PORT=3001
```

**5. Modifier le Frontend**

Créer `src/services/api.ts` :
```typescript
const API_URL = 'http://votre-serveur.com:3001/api';

export const api = {
  // Products
  getProducts: async () => {
    const response = await fetch(`${API_URL}/products`);
    return response.json();
  },

  addProduct: async (product: any) => {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return response.json();
  },

  updateProduct: async (id: string, updates: any) => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  },

  deleteProduct: async (id: string) => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  }

  // Ajouter les autres endpoints...
};
```

Puis modifier `AppContext.tsx` pour utiliser l'API :
```typescript
const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
  const result = await api.addProduct(product);
  // Rafraîchir la liste des produits
  const updatedProducts = await api.getProducts();
  setProducts(updatedProducts);
};
```

### Option 3 : Supabase (Alternative à Firebase)

Supabase est une alternative open-source à Firebase avec PostgreSQL.

1. **Créer un compte sur [supabase.com](https://supabase.com)**
2. **Créer un nouveau projet**
3. **Installer le client**
```bash
npm install @supabase/supabase-js
```

4. **Configuration similaire à Firebase**

## Recommandation

Pour démarrer rapidement : **Firebase** (30 minutes de setup)
Pour un contrôle total : **Backend Node.js + MySQL** (1-2 jours de développement)

## Hébergement du Backend

Si vous choisissez l'option Backend Node.js :
- **Votre propre serveur** : Installer Node.js et MySQL sur votre serveur
- **VPS** : DigitalOcean, Linode, OVH (5-10€/mois)
- **Cloud** : Heroku, Railway, Render (gratuit pour petits projets)

## Contact et Support

Pour l'intégration de la base de données, vous aurez besoin de :
1. Choisir une option (Firebase ou Backend)
2. Suivre le guide correspondant
3. Tester avec quelques données
4. Migrer vos données existantes si nécessaire
