# Backend - API Gestion des Stocks

Backend Node.js + Express + MySQL pour l'application de gestion des stocks.

## Installation

### 1. Prérequis

- Node.js 16+ installé
- MySQL 8.0+ installé et démarré
- npm ou yarn

### 2. Installation des dépendances

```bash
cd backend
npm install
```

### 3. Configuration de la base de données

**A. Créer la base de données**

```bash
mysql -u root -p
```

Puis exécutez le fichier schema.sql :
```sql
source schema.sql
```

Ou manuellement :
```bash
mysql -u root -p < schema.sql
```

**B. Créer un utilisateur MySQL (optionnel mais recommandé)**

```sql
CREATE USER 'gestion_stocks_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON gestion_stocks.* TO 'gestion_stocks_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configuration des variables d'environnement

Copiez le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Modifiez `.env` avec vos paramètres :

```env
DB_HOST=localhost
DB_USER=gestion_stocks_user
DB_PASSWORD=votre_mot_de_passe
DB_NAME=gestion_stocks

PORT=3001

# Générez une clé secrète aléatoire sécurisée
JWT_SECRET=votre_cle_secrete_aleatoire_tres_longue

FRONTEND_URL=http://localhost:5173
```

**Pour générer une clé JWT secrète sécurisée :**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Démarrage

### Mode Développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

### Mode Production

```bash
npm start
```

## Structure du Projet

```
backend/
├── config/
│   └── database.js          # Configuration MySQL
├── routes/
│   ├── auth.js             # Routes d'authentification
│   ├── products.js         # Routes produits
│   ├── categories.js       # Routes catégories
│   ├── units.js            # Routes unités
│   └── exitRequests.js     # Routes demandes de sortie
├── schema.sql              # Schéma de base de données
├── server.js               # Point d'entrée
├── package.json
├── .env                    # Configuration (à créer)
└── .env.example           # Exemple de configuration
```

## API Endpoints

### Authentification

- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription (création d'utilisateur)
- `GET /api/auth/me` - Récupérer l'utilisateur connecté

### Produits

- `GET /api/products` - Liste tous les produits
- `GET /api/products/:id` - Récupérer un produit
- `POST /api/products` - Créer un produit
- `PUT /api/products/:id` - Mettre à jour un produit
- `DELETE /api/products/:id` - Supprimer un produit
- `GET /api/products/alerts/low-stock` - Produits avec stock faible

### Catégories

- `GET /api/categories` - Liste toutes les catégories
- `POST /api/categories` - Créer une catégorie
- `DELETE /api/categories/:id` - Supprimer une catégorie

### Unités

- `GET /api/units` - Liste toutes les unités
- `POST /api/units` - Créer une unité
- `DELETE /api/units/:id` - Supprimer une unité

### Demandes de Sortie

- `GET /api/exit-requests` - Liste toutes les demandes
  - Query params: `?status=pending&requestedBy=user`
- `GET /api/exit-requests/:id` - Récupérer une demande
- `POST /api/exit-requests` - Créer une demande
- `PUT /api/exit-requests/:id` - Mettre à jour (approuver/rejeter)
- `DELETE /api/exit-requests/:id` - Supprimer une demande

## Déploiement sur Serveur

### Option 1 : Serveur Linux (VPS, Cloud, etc.)

**1. Installer Node.js et MySQL**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm mysql-server

# Vérifier l'installation
node --version
mysql --version
```

**2. Cloner et installer**
```bash
cd /var/www
git clone https://github.com/VOTRE_USERNAME/gestion-des-stocks.git
cd gestion-des-stocks/backend
npm install
```

**3. Configurer MySQL**
```bash
sudo mysql_secure_installation
sudo mysql -u root -p < schema.sql
```

**4. Configurer le fichier .env**
```bash
cp .env.example .env
nano .env
# Modifiez avec vos paramètres
```

**5. Installer PM2 pour gérer le processus**
```bash
sudo npm install -g pm2
pm2 start server.js --name gestion-stocks-api
pm2 startup
pm2 save
```

**6. Configurer Nginx comme reverse proxy**
```bash
sudo apt install nginx

# Créer la configuration
sudo nano /etc/nginx/sites-available/gestion-stocks-api
```

Contenu du fichier :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer la configuration :
```bash
sudo ln -s /etc/nginx/sites-available/gestion-stocks-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**7. Configurer le pare-feu**
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 3306  # MySQL (si base distante)
sudo ufw enable
```

### Option 2 : Heroku (Gratuit pour test)

**1. Installer Heroku CLI**
```bash
npm install -g heroku
```

**2. Se connecter et créer l'app**
```bash
heroku login
heroku create gestion-stocks-api
```

**3. Ajouter ClearDB MySQL (gratuit)**
```bash
heroku addons:create cleardb:ignite
```

**4. Récupérer les identifiants MySQL**
```bash
heroku config:get CLEARDB_DATABASE_URL
```

**5. Configurer les variables d'environnement**
```bash
heroku config:set JWT_SECRET=votre_cle_secrete
heroku config:set FRONTEND_URL=https://votre-frontend.vercel.app
```

**6. Déployer**
```bash
git add .
git commit -m "Backend ready"
git push heroku main
```

### Option 3 : Railway (Gratuit, Simple)

**1. Allez sur [railway.app](https://railway.app)**

**2. Créez un nouveau projet depuis GitHub**

**3. Ajoutez un service MySQL**

**4. Configurez les variables d'environnement dans Railway**

**5. Le déploiement est automatique !**

## Sécurité

### Recommandations Production

1. **Mot de passe MySQL sécurisé**
2. **JWT_SECRET long et aléatoire** (64+ caractères)
3. **Activer HTTPS** (Let's Encrypt gratuit)
4. **Limiter les tentatives de connexion**
5. **Valider toutes les entrées utilisateur**
6. **Mettre à jour régulièrement les dépendances**

### Améliorer la sécurité

Ajoutez ces packages :
```bash
npm install helmet express-rate-limit express-validator
```

Modifiez `server.js` :
```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/auth/login', limiter);
```

## Monitoring

### Logs avec PM2
```bash
pm2 logs gestion-stocks-api
pm2 monit
```

### Monitoring MySQL
```bash
mysql -u root -p -e "SHOW PROCESSLIST;"
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"
```

## Backup Base de Données

### Backup manuel
```bash
mysqldump -u root -p gestion_stocks > backup_$(date +%Y%m%d).sql
```

### Backup automatique (cron)
```bash
crontab -e
```

Ajoutez :
```
0 2 * * * mysqldump -u root -pVOTRE_MDP gestion_stocks > /backups/gestion_stocks_$(date +\%Y\%m\%d).sql
```

## Dépannage

### Erreur de connexion MySQL
```bash
# Vérifier que MySQL est démarré
sudo systemctl status mysql

# Redémarrer MySQL
sudo systemctl restart mysql

# Vérifier les logs
sudo tail -f /var/log/mysql/error.log
```

### Erreur JWT
- Vérifiez que JWT_SECRET est bien défini dans .env
- Régénérez une nouvelle clé secrète

### Port déjà utilisé
```bash
# Trouver le processus utilisant le port 3001
lsof -i :3001

# Tuer le processus
kill -9 PID
```

## Tests

### Tester l'API avec curl

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Récupérer les produits (avec token)
curl http://localhost:3001/api/products \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## Support

Pour toute question, consultez :
- `DATABASE_INTEGRATION.md` pour l'intégration complète
- `README.md` principal du projet
