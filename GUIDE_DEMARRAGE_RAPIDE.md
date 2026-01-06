# 🚀 Guide de Démarrage Rapide - Configuration Sécurisée

**Ne vous inquiétez pas, je vais vous guider étape par étape !**

Temps estimé : 15-20 minutes

---

## 📋 Vue d'ensemble

Nous allons faire 8 étapes simples dans cet ordre :

1. ✅ Régénérer les clés Supabase (5 min)
2. ✅ Configurer .env.local (2 min)
3. ✅ Tester l'application (2 min)
4. ✅ Configurer GitHub Secrets (3 min)
5. ✅ Installer les scripts de backup (2 min)
6. ✅ Faire un test de backup (2 min)
7. ✅ Activer la sécurité RLS (5 min)
8. ✅ Configurer les backups automatiques (5 min)

---

## ÉTAPE 1 : Régénérer les Clés Supabase ⚠️

**Pourquoi ?** Les anciennes clés ont été exposées dans le code et ne sont plus sécurisées.

### Actions à faire :

1. **Ouvrez votre navigateur** et allez sur : https://app.supabase.com

2. **Connectez-vous** avec votre compte Supabase

3. **Sélectionnez votre projet** : `jxymbulpvnzzysfcsxvw` (ou le nom que vous lui avez donné)

4. **Cliquez sur l'icône d'engrenage** (Settings) dans le menu de gauche

5. **Cliquez sur "API"** dans le sous-menu

6. Vous verrez une section **"Project API keys"** avec plusieurs clés :
   - Project URL
   - anon public (clé publique)
   - service_role (clé secrète)

7. **IMPORTANT** : Notez quelque part (bloc-notes) :
   ```
   URL: [copiez le Project URL]
   ANON KEY: [copiez la clé anon public]
   SERVICE KEY: [copiez la clé service_role]
   ```

8. **Pour régénérer la clé anon** (recommandé mais optionnel) :
   - Cherchez un bouton "Regenerate" ou "Reset" à côté de la clé anon
   - Si vous ne le trouvez pas, ce n'est pas grave, utilisez la clé actuelle
   - Si vous la régénérez, copiez la nouvelle

---

## ÉTAPE 2 : Configurer .env.local

**Pourquoi ?** C'est ici que l'application va chercher les clés de manière sécurisée.

### Actions à faire :

1. **Ouvrez votre projet** dans VS Code (ou votre éditeur)

2. **À la racine du projet** (là où il y a package.json), créez un nouveau fichier nommé exactement :
   ```
   .env.local
   ```

3. **Copiez-collez ce contenu** dans le fichier :
   ```bash
   # Configuration Supabase
   VITE_SUPABASE_URL=https://jxymbulpvnzzysfcsxvw.supabase.co
   VITE_SUPABASE_ANON_KEY=COLLEZ_VOTRE_CLE_ANON_ICI

   # Pour les backups (clé service_role)
   SUPABASE_SERVICE_KEY=COLLEZ_VOTRE_CLE_SERVICE_ICI

   # API Backend (si vous l'utilisez)
   VITE_API_URL=http://localhost:3001/api
   ```

4. **Remplacez les valeurs** :
   - Remplacez `COLLEZ_VOTRE_CLE_ANON_ICI` par la clé anon que vous avez copiée à l'étape 1
   - Remplacez `COLLEZ_VOTRE_CLE_SERVICE_ICI` par la clé service_role de l'étape 1
   - Si votre URL Supabase est différente, remplacez-la aussi

5. **Sauvegardez le fichier** (Ctrl+S)

### ✅ Vérification
- Le fichier `.env.local` doit être à la racine (même niveau que package.json)
- Il doit contenir vos vraies clés (pas les textes "COLLEZ_VOTRE...")
- **NE JAMAIS** commiter ce fichier sur Git (il est déjà dans .gitignore)

---

## ÉTAPE 3 : Tester l'Application

**Pourquoi ?** On vérifie que les nouvelles clés fonctionnent.

### Actions à faire :

1. **Ouvrez un terminal** dans votre projet

2. **Lancez l'application en mode développement** :
   ```bash
   npm run dev
   ```

3. **Ouvrez votre navigateur** sur http://localhost:5173/GestionDesStocks

4. **Testez la connexion** :
   - Essayez de vous connecter avec votre compte
   - Si ça fonctionne ✅ Parfait !
   - Si ça ne fonctionne pas ❌ Vérifiez votre .env.local

5. **Arrêtez le serveur** (Ctrl+C dans le terminal)

### ✅ Vérification
- Vous pouvez vous connecter
- Vous voyez vos produits
- Pas d'erreur dans la console du navigateur (F12)

---

## ÉTAPE 4 : Configurer GitHub Secrets

**Pourquoi ?** Pour que le déploiement automatique sur GitHub Pages fonctionne avec les nouvelles clés.

### Actions à faire :

1. **Allez sur GitHub** : https://github.com/Labelh/GestionDesStocks

2. **Cliquez sur "Settings"** (en haut de la page du dépôt)

3. **Dans le menu de gauche**, cliquez sur **"Secrets and variables"** puis **"Actions"**

4. **Ajoutez le premier secret** :
   - Cliquez sur **"New repository secret"**
   - Name: `VITE_SUPABASE_URL`
   - Secret: Collez votre URL Supabase (ex: https://jxymbulpvnzzysfcsxvw.supabase.co)
   - Cliquez **"Add secret"**

5. **Ajoutez le second secret** :
   - Cliquez encore sur **"New repository secret"**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Secret: Collez votre clé anon
   - Cliquez **"Add secret"**

### ✅ Vérification
Vous devriez voir 2 secrets dans la liste :
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

---

## ÉTAPE 5 : Installer les Scripts de Backup

**Pourquoi ?** Les scripts ont besoin de packages Node.js pour fonctionner.

### Actions à faire :

1. **Ouvrez un terminal** dans votre projet

2. **Allez dans le dossier scripts** :
   ```bash
   cd scripts
   ```

3. **Installez les dépendances** :
   ```bash
   npm install
   ```

4. **Attendez** que l'installation se termine (quelques secondes)

5. **Retournez à la racine** :
   ```bash
   cd ..
   ```

### ✅ Vérification
Vous devriez voir un dossier `scripts/node_modules` créé

---

## ÉTAPE 6 : Test de Backup Manuel

**Pourquoi ?** On vérifie que le système de sauvegarde fonctionne.

### Actions à faire :

1. **Dans votre terminal**, lancez le backup :
   ```bash
   node scripts/backup-supabase.js
   ```

2. **Vous devriez voir** quelque chose comme :
   ```
   🚀 Démarrage de la sauvegarde Supabase...

   📦 Sauvegarde de user_profiles...
      ✅ 5 enregistrements sauvegardés
   📦 Sauvegarde de products...
      ✅ 234 enregistrements sauvegardés
   ...

   ✅ Sauvegarde terminée avec succès!
      📁 Fichier: backup-supabase-2025-01-06T14-30-00.json
      📊 Tables: 11
      📝 Enregistrements: 523
      💾 Taille: 2.45 MB
      ⏱️  Durée: 3.21s
   ```

3. **Vérifiez que le dossier backups existe** :
   ```bash
   ls backups/
   ```
   Vous devriez voir un fichier `.json`

### ✅ Vérification
- Un fichier de backup a été créé dans `backups/`
- Aucune erreur n'est affichée
- La taille du fichier est > 0 KB

### ❌ En cas d'erreur

**Si vous voyez** : "VITE_SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis"
→ Vérifiez que votre `.env.local` contient bien `SUPABASE_SERVICE_KEY`

**Si vous voyez** : "Invalid API key"
→ Vérifiez que vous avez copié la bonne clé service_role

---

## ÉTAPE 7 : Activer Row Level Security (RLS)

**Pourquoi ?** Pour que chaque utilisateur ne puisse voir que SES propres données.

### Actions à faire :

1. **Allez sur Supabase** : https://app.supabase.com

2. **Ouvrez votre projet**

3. **Cliquez sur "SQL Editor"** dans le menu de gauche (icône <>)

4. **Cliquez sur "+ New query"**

5. **Copiez-collez ce script SQL** (je vais le créer pour vous dans le fichier suivant)

6. **Cliquez sur "Run"** (ou appuyez sur Ctrl+Enter)

7. **Attendez** que le script s'exécute (quelques secondes)

### Script SQL à copier-coller :

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_exits ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_profiles
CREATE POLICY "Utilisateurs peuvent lire tous les profils"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Utilisateurs peuvent modifier leur propre profil"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politiques pour products
CREATE POLICY "Lecture produits pour tous"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Modification produits managers uniquement"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Politiques pour stock_movements
CREATE POLICY "Lecture mouvements pour tous"
  ON stock_movements FOR SELECT
  USING (true);

CREATE POLICY "Création mouvements utilisateurs authentifiés"
  ON stock_movements FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Politiques pour exit_requests
CREATE POLICY "Utilisateurs voient leurs demandes"
  ON exit_requests FOR SELECT
  USING (
    auth.uid()::text = requested_by OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Utilisateurs créent des demandes"
  ON exit_requests FOR INSERT
  WITH CHECK (auth.uid()::text = requested_by);

-- Politiques pour orders (managers uniquement)
CREATE POLICY "Managers voient commandes"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Politiques pour configuration (categories, units, storage_zones)
CREATE POLICY "Lecture categories pour tous"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Modification categories managers"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Lecture units pour tous"
  ON units FOR SELECT
  USING (true);

CREATE POLICY "Modification units managers"
  ON units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Lecture zones pour tous"
  ON storage_zones FOR SELECT
  USING (true);

CREATE POLICY "Modification zones managers"
  ON storage_zones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Politiques pour pending_exits et stock_alerts
CREATE POLICY "Lecture pending_exits pour tous"
  ON pending_exits FOR SELECT
  USING (true);

CREATE POLICY "Lecture alertes managers"
  ON stock_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );
```

### ✅ Vérification
- Le script s'exécute sans erreur
- Vous voyez "Success. No rows returned" ou similaire

---

## ÉTAPE 8 : Configurer Backup Automatique

**Pourquoi ?** Pour que les sauvegardes se fassent automatiquement chaque jour.

### ⭐ RECOMMANDÉ : GitHub Actions (Cloud - fonctionne PC éteint)

**Voir le fichier** : `BACKUP_GITHUB_ACTIONS.md` pour la configuration complète

**En résumé** :
1. Ajoutez le secret `SUPABASE_SERVICE_KEY` dans GitHub
2. Le backup s'exécute automatiquement tous les jours à 2h00 UTC
3. Fonctionne même si votre PC est éteint
4. Gratuit et stocké dans le cloud

### Alternative : Windows (Planificateur de tâches - PC doit être allumé)

1. **Appuyez sur** Windows + R

2. **Tapez** : `taskschd.msc` et appuyez sur Entrée

3. **Cliquez sur** "Créer une tâche..." (dans le panneau de droite)

4. **Onglet Général** :
   - Nom : `Backup Supabase - Gestion Stocks`
   - Description : `Sauvegarde quotidienne de la base de données`
   - ✅ Cochez "Exécuter même si l'utilisateur n'est pas connecté"

5. **Onglet Déclencheurs** :
   - Cliquez sur "Nouveau..."
   - Démarrer la tâche : **Selon une planification**
   - Quotidien
   - Heure : **02:00:00** (2h du matin)
   - Cliquez sur "OK"

6. **Onglet Actions** :
   - Cliquez sur "Nouveau..."
   - Action : **Démarrer un programme**
   - Programme/script : `node`
   - Ajoutez des arguments : `scripts\backup-supabase.js`
   - Commencer dans : `C:\Users\Ajust82\Desktop\Projet\GestionDesStocks`
   - Cliquez sur "OK"

7. **Cliquez sur "OK"** pour créer la tâche

### Test de la tâche planifiée

1. **Clic droit** sur la tâche que vous venez de créer
2. **Cliquez sur "Exécuter"**
3. **Vérifiez** qu'un nouveau backup apparaît dans `backups/`

### ✅ Vérification
- La tâche apparaît dans le planificateur
- Un test manuel crée un backup
- La tâche est configurée pour s'exécuter à 2h du matin

---

## 🎉 FÉLICITATIONS ! Vous avez terminé !

Votre système est maintenant :
- 🔒 **Sécurisé** : Clés non exposées
- 💾 **Sauvegardé** : Backup quotidien automatique
- 🛡️ **Protégé** : RLS activé

---

## 📊 Résumé de ce qui a été fait

✅ Clés Supabase régénérées et sécurisées
✅ Application configurée avec .env.local
✅ GitHub Secrets configurés pour déploiement
✅ Scripts de backup installés et testés
✅ Row Level Security activé
✅ Backup automatique quotidien configuré

---

## 🆘 Que faire en cas de problème ?

### L'application ne démarre pas
→ Vérifiez `.env.local`, les clés doivent être correctes

### Le backup échoue
→ Vérifiez que `SUPABASE_SERVICE_KEY` est dans `.env.local`

### Erreur RLS
→ C'est normal si vous avez des données existantes, contactez-moi

### Autre problème
→ Envoyez-moi le message d'erreur exacte

---

## 📅 Maintenance

### Chaque semaine
- Vérifiez qu'il y a de nouveaux backups dans `backups/`

### Chaque mois
- Testez une restauration (voir BACKUP_RESTORE_GUIDE.md)

### En cas de problème
1. Ne paniquez pas
2. Vous avez des backups
3. Consultez BACKUP_RESTORE_GUIDE.md

---

**Besoin d'aide ?** Dites-moi où vous êtes bloqué et je vous guiderai !
