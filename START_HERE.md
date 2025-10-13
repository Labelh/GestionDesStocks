# 🚀 Démarrage Rapide - Gestion des Stocks

## 📋 Ce que vous avez

✅ Application complète de gestion de stock
✅ Frontend React + TypeScript
✅ Backend Node.js + Express + MySQL
✅ API REST complète
✅ Authentification JWT
✅ Prêt pour la production

## 🎯 Choisissez votre parcours

### Option A : Test Rapide (5 minutes)
**Tester l'application avec localStorage (sans backend)**

```bash
npm run dev
```
Ouvrez http://localhost:5173
Login: `admin` / `admin`

**✅ Parfait pour** : Découvrir l'application rapidement
**⚠️ Limite** : Données perdues si vous effacez le navigateur

---

### Option B : Installation Complète (30 minutes)
**Application professionnelle avec MySQL sur votre serveur**

👉 **Suivez le guide** : [`BACKEND_SETUP_GUIDE.md`](./BACKEND_SETUP_GUIDE.md)

**Ce que vous obtenez :**
- ✅ Données sauvegardées dans MySQL
- ✅ Jamais de perte de données
- ✅ Accessible depuis plusieurs ordinateurs
- ✅ Prêt pour production

**Étapes principales :**
1. Installer MySQL (15 min)
2. Configurer le backend (10 min)
3. Connecter le frontend (5 min)

---

### Option C : Héberger en Ligne (10 minutes)
**Application accessible partout sur Internet**

👉 **Suivez le guide** : [`DEPLOYMENT.md`](./DEPLOYMENT.md)

**Frontend sur Vercel** (gratuit)
1. Push sur GitHub
2. Connecter à Vercel
3. Clic "Deploy"

**Backend sur Railway** (gratuit)
1. Connecter GitHub à Railway
2. Ajouter MySQL
3. Déployer

**✅ Résultat** : Application en ligne avec URL publique !

---

## 📚 Documentation Complète

| Fichier | Description | Quand l'utiliser |
|---------|-------------|------------------|
| **START_HERE.md** | Ce fichier - Guide principal | Début du projet |
| **BACKEND_SETUP_GUIDE.md** | Installation backend MySQL complète | Intégration base de données |
| **DEPLOYMENT.md** | Hébergement en ligne (Vercel, Netlify) | Mise en production |
| **QUICK_START.md** | Résumé ultra-rapide | Aide-mémoire |
| **DATABASE_INTEGRATION.md** | Détails techniques API | Développement avancé |
| **backend/README.md** | Documentation API backend | Configuration serveur |
| **README.md** | Documentation générale | Vue d'ensemble |

---

## 🔑 Comptes de Test

### Gestionnaire (toutes les fonctionnalités)
- **Username** : `admin`
- **Password** : `admin`

### Utilisateur (demandes de sortie uniquement)
- **Username** : `user`
- **Password** : `user`

---

## 🛠️ Commandes Principales

### Frontend
```bash
npm run dev           # Lancer en développement
npm run build         # Compiler pour production
npm run preview       # Prévisualiser le build
```

### Backend (après installation)
```bash
cd backend
npm run dev           # Lancer en développement
npm start             # Lancer en production
```

### Git
```bash
git status            # Voir les changements
git add .             # Ajouter les fichiers
git commit -m "msg"   # Créer un commit
git push              # Envoyer sur GitHub
```

---

## 🎯 Fonctionnalités Principales

### Espace Gestionnaire
- 📊 Dashboard avec statistiques
- 📦 Gestion complète des produits
- ⚠️ Alertes de stock bas/critique
- ✅ Validation des demandes de sortie
- ⚙️ Paramètres (catégories, unités)
- 📸 Upload de photos produits

### Espace Utilisateur
- 📋 Tableau de bord personnel
- ➕ Créer des demandes de sortie
- 📜 Suivi de toutes les demandes
- 🔔 Statut en temps réel

### Technique
- 🔐 Authentification JWT
- 🗄️ MySQL avec transactions
- 📡 API REST complète
- 🎨 Interface responsive
- 🔒 Sécurité CORS
- 💾 Backup automatique possible

---

## 🚨 Besoin d'Aide ?

### Erreur commune : "Port already in use"
```bash
# Trouver et tuer le processus
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### MySQL ne démarre pas
```bash
# Windows
net start MySQL80

# Linux
sudo systemctl start mysql
```

### Le frontend ne trouve pas l'API
1. Vérifiez que le backend tourne sur le port 3001
2. Vérifiez le fichier `.env` à la racine
3. Redémarrez le frontend après modification

### Pour plus d'aide
- Consultez `BACKEND_SETUP_GUIDE.md` section "Résolution des Problèmes"
- Vérifiez les logs du backend
- Testez l'API avec curl ou Postman

---

## 📦 Structure du Projet

```
GestionDesStocks/
├── 📄 START_HERE.md              ⭐ Vous êtes ici
├── 📄 BACKEND_SETUP_GUIDE.md     Guide installation backend
├── 📄 DEPLOYMENT.md               Guide hébergement en ligne
├── 📄 README.md                   Documentation principale
│
├── 📁 src/                        Code frontend React
│   ├── components/               Composants UI
│   ├── pages/                    Pages de l'application
│   ├── context/                  Gestion d'état
│   │   ├── AppContext.tsx        Version localStorage
│   │   └── AppContextAPI.tsx     Version API MySQL
│   ├── services/                 Services API
│   └── types/                    Types TypeScript
│
├── 📁 backend/                    Code backend Node.js
│   ├── 📄 README.md              Doc backend complète
│   ├── config/                   Configuration MySQL
│   ├── routes/                   Routes API
│   ├── schema.sql                Schéma base de données
│   └── server.js                 Serveur principal
│
└── 📁 node_modules/               Dépendances (généré)
```

---

## 🎓 Prochaines Étapes

### Débutant
1. ✅ Testez avec localStorage (Option A)
2. ✅ Explorez toutes les fonctionnalités
3. ✅ Ajoutez des produits de test

### Intermédiaire
1. ✅ Installez MySQL et le backend (Option B)
2. ✅ Migrez vos données de test
3. ✅ Testez l'API avec Postman

### Avancé
1. ✅ Déployez en ligne (Option C)
2. ✅ Configurez un domaine personnalisé
3. ✅ Ajoutez des fonctionnalités custom

---

## 📈 Roadmap (Évolutions Futures)

Idées d'améliorations :
- [ ] Export PDF/Excel
- [ ] Codes-barres / QR codes
- [ ] Notifications email
- [ ] Historique détaillé
- [ ] Multi-emplacements
- [ ] Rapports statistiques
- [ ] Application mobile

---

## 💡 Astuce Pro

**Sauvegardez régulièrement sur GitHub :**
```bash
git add .
git commit -m "Description des changements"
git push
```

**Votre code sera toujours en sécurité et versionné ! 🎉**

---

## 🎉 Vous êtes Prêt !

Choisissez une option ci-dessus et commencez :
- **Test rapide** → Lancez `npm run dev`
- **Installation complète** → Ouvrez `BACKEND_SETUP_GUIDE.md`
- **Hébergement** → Ouvrez `DEPLOYMENT.md`

**Bon développement ! 🚀**
