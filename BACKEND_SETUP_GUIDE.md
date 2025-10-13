# Guide Complet : Intégration Backend MySQL

Ce guide vous accompagne pas à pas pour migrer de localStorage vers votre backend MySQL.

## Vue d'Ensemble

Vous avez maintenant deux versions de l'application :
1. **Version localStorage** (actuelle) - Données dans le navigateur
2. **Version API** (nouvelle) - Données sur votre serveur MySQL

## Étape 1 : Installer et Configurer MySQL (15 minutes)

### Windows

**1. Télécharger MySQL**
- Allez sur https://dev.mysql.com/downloads/installer/
- Téléchargez MySQL Installer
- Exécutez l'installateur

**2. Installation**
- Choisissez "Developer Default"
- Suivez l'assistant
- Définissez un mot de passe root (IMPORTANT : notez-le !)
- Terminez l'installation

**3. Tester MySQL**
```bash
mysql -u root -p
# Entrez votre mot de passe
```

Si cela fonctionne, MySQL est installé ! Tapez `exit;` pour quitter.

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### macOS

```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

## Étape 2 : Créer la Base de Données (5 minutes)

**1. Ouvrez MySQL**
```bash
mysql -u root -p
```

**2. Exécutez le schéma**

Option A - Via MySQL directement :
```sql
source C:/Users/Ajust82/Desktop/Projet/GestionDesStocks/backend/schema.sql
```

Option B - Via ligne de commande :
```bash
mysql -u root -p < "C:/Users/Ajust82/Desktop/Projet/GestionDesStocks/backend/schema.sql"
```

**3. Vérifier la création**
```sql
USE gestion_stocks;
SHOW TABLES;
```

Vous devriez voir :
- users
- products
- categories
- units
- exit_requests

## Étape 3 : Installer le Backend (5 minutes)

```bash
cd "C:\Users\Ajust82\Desktop\Projet\GestionDesStocks\backend"
npm install
```

## Étape 4 : Configurer les Variables d'Environnement (2 minutes)

**1. Créez le fichier .env**
```bash
cd backend
cp .env.example .env
```

**2. Éditez backend/.env**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=gestion_stocks

PORT=3001

# Générez une clé secrète :
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=votre_cle_secrete_generee

FRONTEND_URL=http://localhost:5173
```

**⚠️ IMPORTANT : Remplacez `votre_mot_de_passe_mysql` par votre vrai mot de passe MySQL**

## Étape 5 : Démarrer le Backend (1 minute)

```bash
cd backend
npm run dev
```

Vous devriez voir :
```
=================================
🚀 Serveur démarré sur le port 3001
📡 API disponible sur http://localhost:3001
=================================
✅ Connexion à la base de données MySQL réussie
```

**✅ Si vous voyez cela, le backend fonctionne !**

## Étape 6 : Configurer le Frontend (3 minutes)

**1. Créez .env pour le frontend**

À la racine du projet (pas dans backend !) :
```bash
cd "C:\Users\Ajust82\Desktop\Projet\GestionDesStocks"
cp .env.example .env
```

**2. Éditez .env**
```env
VITE_API_URL=http://localhost:3001/api
```

**3. Modifiez src/App.tsx**

Remplacez l'import :
```typescript
// AVANT
import { AppProvider } from './context/AppContext';

// APRÈS
import { AppProvider } from './context/AppContextAPI';
```

## Étape 7 : Tester l'Application (5 minutes)

**1. Démarrez le frontend**
```bash
cd "C:\Users\Ajust82\Desktop\Projet\GestionDesStocks"
npm run dev
```

**2. Ouvrez http://localhost:5173**

**3. Connectez-vous**
- Username: `admin`
- Password: `admin`

**4. Testez les fonctionnalités**
- ✅ Dashboard s'affiche avec les données de test
- ✅ Ajoutez un produit
- ✅ Modifiez un produit
- ✅ Créez une demande de sortie
- ✅ Approuvez une demande

**Si tout fonctionne, félicitations ! Vos données sont maintenant dans MySQL ! 🎉**

## Étape 8 : Migrer vos Données Existantes (Optionnel)

Si vous aviez des données dans localStorage que vous voulez conserver :

**1. Exportez depuis localStorage**

Ouvrez la console du navigateur (F12) et exécutez :
```javascript
// Récupérer toutes les données
const data = {
  products: JSON.parse(localStorage.getItem('products') || '[]'),
  categories: JSON.parse(localStorage.getItem('categories') || '[]'),
  units: JSON.parse(localStorage.getItem('units') || '[]'),
  exitRequests: JSON.parse(localStorage.getItem('exitRequests') || '[]')
};

// Copier dans le presse-papier
copy(JSON.stringify(data, null, 2));
```

**2. Créez un script de migration**

Créez `backend/migrate-data.js` :
```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const data = {
  // Collez vos données ici
};

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // Insérer les produits
  for (const product of data.products) {
    await connection.query(
      'INSERT INTO products SET ?',
      product
    );
  }

  console.log('Migration terminée !');
  process.exit(0);
}

migrate();
```

**3. Exécutez la migration**
```bash
cd backend
node migrate-data.js
```

## Étape 9 : Déployer sur Votre Serveur

### Si vous avez un serveur Linux :

**1. Connectez-vous à votre serveur**
```bash
ssh user@votre-serveur.com
```

**2. Installez Node.js et MySQL**
```bash
sudo apt update
sudo apt install nodejs npm mysql-server
```

**3. Clonez votre projet**
```bash
cd /var/www
git clone https://github.com/VOTRE_USERNAME/gestion-des-stocks.git
cd gestion-des-stocks/backend
npm install
```

**4. Configurez MySQL**
```bash
sudo mysql -u root -p < schema.sql
```

**5. Créez .env**
```bash
cp .env.example .env
nano .env
# Remplissez avec vos paramètres
```

**6. Installez PM2**
```bash
sudo npm install -g pm2
pm2 start server.js --name gestion-stocks-api
pm2 startup
pm2 save
```

**7. Configurez le pare-feu**
```bash
sudo ufw allow 3001
sudo ufw enable
```

**Votre API est maintenant accessible sur http://votre-serveur.com:3001 !**

## Résolution des Problèmes Courants

### Erreur : "Access denied for user"
```bash
# Réinitialisez le mot de passe MySQL
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'nouveau_mot_de_passe';
FLUSH PRIVILEGES;
```

### Erreur : "Port 3001 already in use"
```bash
# Trouvez et tuez le processus
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Erreur : "Cannot connect to MySQL server"
```bash
# Vérifiez que MySQL est démarré
# Windows
net start MySQL80

# Linux
sudo systemctl start mysql
sudo systemctl status mysql
```

### Le frontend ne se connecte pas au backend
1. Vérifiez que le backend tourne sur le port 3001
2. Vérifiez le fichier `.env` à la racine (pas backend/.env)
3. Vérifiez que VITE_API_URL est correct
4. Redémarrez le frontend après modification du .env

### Erreur CORS
Ajoutez l'URL de votre frontend dans backend/.env :
```env
FRONTEND_URL=http://localhost:5173
```

## Commandes Utiles

### Backend
```bash
# Démarrer en mode développement
cd backend
npm run dev

# Démarrer en production
npm start

# Voir les logs (avec PM2)
pm2 logs gestion-stocks-api
```

### Frontend
```bash
# Développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

### MySQL
```bash
# Se connecter
mysql -u root -p

# Lister les bases de données
SHOW DATABASES;

# Utiliser la base
USE gestion_stocks;

# Voir les tables
SHOW TABLES;

# Voir les produits
SELECT * FROM products;

# Backup
mysqldump -u root -p gestion_stocks > backup.sql

# Restaurer
mysql -u root -p gestion_stocks < backup.sql
```

## Checklist Finale

Avant de passer en production, vérifiez :

- [ ] MySQL installé et configuré
- [ ] Base de données créée avec le schéma
- [ ] Backend démarre sans erreur
- [ ] Frontend se connecte au backend
- [ ] Login fonctionne
- [ ] CRUD produits fonctionne
- [ ] Demandes de sortie fonctionnent
- [ ] Fichier .env sécurisé (pas dans Git)
- [ ] Backup de la base de données configuré
- [ ] HTTPS configuré (production)

## Architecture Finale

```
┌─────────────────┐
│   Navigateur    │
│   (Frontend)    │
│   React + Vite  │
└────────┬────────┘
         │ HTTP/HTTPS
         │ Port 5173
         ↓
┌─────────────────┐
│   Backend API   │
│   Node.js       │
│   Port 3001     │
└────────┬────────┘
         │ MySQL Protocol
         │ Port 3306
         ↓
┌─────────────────┐
│   MySQL DB      │
│   gestion_stocks│
└─────────────────┘
```

## Support et Documentation

- **Backend README** : `backend/README.md`
- **Guide déploiement** : `DEPLOYMENT.md`
- **Documentation API** : `DATABASE_INTEGRATION.md`
- **Guide rapide** : `QUICK_START.md`

## Félicitations ! 🎉

Vous avez maintenant une application professionnelle avec :
- ✅ Backend robuste Node.js + Express
- ✅ Base de données MySQL persistante
- ✅ API REST complète
- ✅ Authentification sécurisée avec JWT
- ✅ Données sauvegardées sur votre serveur
- ✅ Prête pour la production !
