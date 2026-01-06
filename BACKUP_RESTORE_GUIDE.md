# Guide de Sauvegarde et Restauration

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration Initiale](#configuration-initiale)
3. [Sauvegarde Automatisée](#sauvegarde-automatisée)
4. [Sauvegarde Manuelle](#sauvegarde-manuelle)
5. [Restauration des Données](#restauration-des-données)
6. [RTO/RPO](#rtorpo)
7. [Tests de Sauvegarde](#tests-de-sauvegarde)
8. [Scénarios de Sinistre](#scénarios-de-sinistre)

---

## 📖 Vue d'ensemble

Ce projet utilise **Supabase** comme source unique de données. Toutes les données critiques sont stockées dans Supabase (PostgreSQL).

### Données à Sauvegarder

- **user_profiles** : Comptes utilisateurs
- **products** : Catalogue des produits
- **categories, units, storage_zones** : Configuration
- **stock_movements** : Historique des mouvements
- **exit_requests** : Demandes de sortie
- **orders** : Commandes
- **user_cart** : Paniers utilisateurs
- **stock_alerts** : Configuration des alertes

---

## ⚙️ Configuration Initiale

### 1. Installer les Dépendances

```bash
cd scripts
npm install @supabase/supabase-js dotenv
```

### 2. Configurer la Clé Service

La clé service permet de bypasser les RLS pour les backups complets.

1. Allez sur https://app.supabase.com
2. Ouvrez votre projet
3. **Settings** > **API** > **Project API keys**
4. Copiez la clé **service_role** (⚠️ à ne JAMAIS exposer publiquement)

### 3. Ajouter la Clé à .env.local

Éditez `.env.local` et ajoutez :

```bash
VITE_SUPABASE_URL=https://jxymbulpvnzzysfcsxvw.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_KEY=votre-cle-service-ici
```

⚠️ **IMPORTANT** : Ne commitez JAMAIS `.env.local` avec la clé service !

### 4. Créer le Dossier de Backups

```bash
mkdir backups
echo "backups/" >> .gitignore
```

---

## 🤖 Sauvegarde Automatisée

### Option 1 : Supabase Native (Recommandé)

Supabase Pro offre des backups automatiques quotidiens.

**Avantages :**
- Point-in-time recovery
- Backups stockés hors-site
- Restoration en 1 clic
- Pas de maintenance

**Configuration :**
1. Passez à Supabase Pro (8$/mois minimum)
2. **Settings** > **Database** > **Backups**
3. Activez les backups automatiques
4. Configurez la rétention (7 jours par défaut)

### Option 2 : Script Automatisé avec Cron

Si vous utilisez le plan gratuit ou voulez un backup local additionnel :

#### Linux/Mac

Éditez le crontab :

```bash
crontab -e
```

Ajoutez cette ligne pour un backup quotidien à 2h du matin :

```bash
0 2 * * * cd /chemin/vers/GestionDesStocks && node scripts/backup-supabase.js >> logs/backup.log 2>&1
```

#### Windows (Planificateur de Tâches)

1. Ouvrez le **Planificateur de tâches**
2. Créez une nouvelle tâche
3. **Déclencheur** : Quotidien à 2h00
4. **Action** : Démarrer un programme
   - Programme : `node`
   - Arguments : `C:\chemin\vers\GestionDesStocks\scripts\backup-supabase.js`
   - Démarrer dans : `C:\chemin\vers\GestionDesStocks`

#### Vérifier les Logs

```bash
# Créer le dossier de logs
mkdir logs

# Voir les derniers backups
ls -lh backups/

# Vérifier le contenu d'un backup
node -e "console.log(JSON.parse(require('fs').readFileSync('backups/backup-supabase-2025-01-06T02-00-00.json', 'utf8')).metadata)"
```

---

## 💾 Sauvegarde Manuelle

### Backup via Script

```bash
node scripts/backup-supabase.js
```

Sortie attendue :
```
🚀 Démarrage de la sauvegarde Supabase...

📦 Sauvegarde de user_profiles...
   ✅ 15 enregistrements sauvegardés
📦 Sauvegarde de products...
   ✅ 234 enregistrements sauvegardés
...

✅ Sauvegarde terminée avec succès!
   📁 Fichier: backup-supabase-2025-01-06T14-30-00.json
   📊 Tables: 11
   📝 Enregistrements: 1523
   💾 Taille: 2.45 MB
   ⏱️  Durée: 3.21s
```

### Backup SQL Direct (Alternative)

Si vous avez accès à la base de données PostgreSQL :

```bash
# Depuis Supabase Dashboard > Database > Connection string
pg_dump "postgresql://user:pass@db.xxx.supabase.co:5432/postgres" > backup.sql
```

---

## 🔄 Restauration des Données

### ⚠️ ATTENTION

La restauration **REMPLACE** toutes les données existantes. Assurez-vous de :
1. Avoir un backup récent avant de restaurer
2. Prévenir tous les utilisateurs
3. Tester la restauration en environnement de test d'abord

### Procédure de Restauration

#### 1. Identifier le Backup à Restaurer

```bash
ls -lh backups/
# Choisissez le fichier approprié
```

#### 2. Lancer la Restauration

```bash
node scripts/restore-supabase.js backups/backup-supabase-2025-01-06T02-00-00.json
```

#### 3. Confirmer

Le script affichera :
```
📊 Informations du backup:
   Date: 2025-01-06T02:00:00.000Z
   Tables: 11
   Enregistrements: 1523

⚠️  ATTENTION: Cette opération va REMPLACER toutes les données existantes.
   Voulez-vous continuer? (oui/non):
```

Tapez `oui` pour continuer.

#### 4. Vérification Post-Restauration

```bash
# Connectez-vous à l'application
# Vérifiez que :
# - Vous pouvez vous connecter
# - Les produits sont visibles
# - Les mouvements de stock sont présents
# - Les paramètres sont corrects
```

### Restauration Supabase Native

Si vous utilisez Supabase Pro :

1. Allez sur **Settings** > **Database** > **Backups**
2. Sélectionnez le backup à restaurer
3. Cliquez sur **Restore**
4. Confirmez

**Avantages :**
- Restauration complète incluant schéma et données
- Plus fiable que le script
- Support de point-in-time recovery

---

## 🎯 RTO/RPO

### Objectifs Définis

**RPO (Recovery Point Objective)** : Perte de données acceptable
- **Target** : 24 heures
- **Actuel** : 24 heures (backup quotidien à 2h)

**RTO (Recovery Time Objective)** : Temps de récupération acceptable
- **Target** : 4 heures
- **Actuel** :
  - Avec script : ~10-30 minutes
  - Avec Supabase native : ~5 minutes

### Améliorer RPO/RTO

Pour réduire la perte de données (RPO) :
- Passer à Supabase Pro pour point-in-time recovery
- Augmenter la fréquence des backups (toutes les 6h, 12h)
- Implémenter une réplication en temps réel

Pour réduire le temps de récupération (RTO) :
- Utiliser les backups Supabase natifs
- Avoir un environnement de staging pour tester
- Documenter et former l'équipe

---

## 🧪 Tests de Sauvegarde

### Test Mensuel Obligatoire

**Important** : Testez vos backups au moins une fois par mois !

#### Procédure de Test

1. **Créer un projet Supabase de test**
   - Gratuit sur supabase.com
   - Nommez-le "gestion-stocks-test"

2. **Configurer .env.test**
   ```bash
   cp .env.local .env.test
   # Modifiez VITE_SUPABASE_URL et SUPABASE_SERVICE_KEY
   # pour pointer vers le projet de test
   ```

3. **Restaurer sur l'environnement de test**
   ```bash
   # Modifiez temporairement restore-supabase.js pour utiliser .env.test
   node scripts/restore-supabase.js backups/backup-supabase-latest.json
   ```

4. **Vérifications**
   - [ ] Connexion utilisateur fonctionne
   - [ ] Nombre de produits correct
   - [ ] Historique des mouvements complet
   - [ ] Configuration préservée
   - [ ] Paniers utilisateurs présents

5. **Documenter**
   ```bash
   echo "$(date): Test de restauration réussi - backup du $(date -r backups/backup-supabase-latest.json)" >> logs/backup-tests.log
   ```

### Checklist de Test

```markdown
- [ ] Backup créé avec succès
- [ ] Taille du fichier cohérente (>1MB pour production)
- [ ] Fichier JSON valide (pas d'erreur de parsing)
- [ ] Restauration en environnement de test réussie
- [ ] Données accessibles après restauration
- [ ] Fonctionnalités critiques testées
- [ ] Durée de restauration documentée
```

---

## 🚨 Scénarios de Sinistre

### Scénario 1 : Suppression Accidentelle de Données

**Symptôme** : Un manager a supprimé des produits par erreur

**Solution** :
1. Identifiez quand la suppression a eu lieu
2. Trouvez le backup le plus récent AVANT la suppression
3. Restaurez dans un environnement de test
4. Exportez uniquement les données supprimées
5. Réinsérez-les dans la production

```bash
# Restaurer en test
node scripts/restore-supabase.js backups/backup-supabase-2025-01-05T02-00-00.json

# Exportez les produits manquants depuis le test
# Importez-les manuellement en production via Supabase Dashboard
```

### Scénario 2 : Corruption de Base de Données

**Symptôme** : Données incohérentes, erreurs SQL

**Solution** :
1. **IMMÉDIATEMENT** : Créer un backup de l'état actuel
   ```bash
   node scripts/backup-supabase.js
   mv backups/backup-supabase-*.json backups/CORRUPTED-backup-$(date +%Y%m%d).json
   ```

2. Restaurer le dernier backup sain
3. Analyser les logs pour identifier la cause
4. Corriger la cause avant de remettre en production

### Scénario 3 : Perte Complète du Projet Supabase

**Symptôme** : Projet Supabase supprimé ou inaccessible

**Solution** :
1. Créer un nouveau projet Supabase
2. Exécuter les scripts SQL de création de tables :
   ```bash
   # Dans Supabase SQL Editor
   # Exécutez dans l'ordre :
   # 1. supabase-migration.sql
   # 2. add_alert_settings.sql
   # 3. add_badge_number.sql
   # 4. supabase-user-cart.sql
   ```

3. Restaurer les données
   ```bash
   # Configurez .env.local avec les nouvelles clés
   node scripts/restore-supabase.js backups/backup-supabase-latest.json
   ```

4. Mettre à jour les secrets GitHub Actions
5. Redéployer l'application

### Scénario 4 : Clés API Compromises

**Symptôme** : Activité suspecte dans les logs Supabase

**Solution** : Voir [SECURITY_GUIDE.md](./SECURITY_GUIDE.md)

---

## 📊 Surveillance

### Vérifier que les Backups Fonctionnent

#### Script de Monitoring

Créez `scripts/check-backups.sh` :

```bash
#!/bin/bash

BACKUP_DIR="./backups"
MAX_AGE_HOURS=48  # Alerte si pas de backup depuis 48h

# Trouver le backup le plus récent
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup-supabase-*.json 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ ALERTE: Aucun backup trouvé!"
  exit 1
fi

# Calculer l'âge du backup
BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP" 2>/dev/null || stat -f %m "$LATEST_BACKUP")
CURRENT_TIME=$(date +%s)
AGE_HOURS=$(( ($CURRENT_TIME - $BACKUP_TIME) / 3600 ))

echo "📁 Dernier backup: $(basename "$LATEST_BACKUP")"
echo "🕒 Âge: $AGE_HOURS heures"

if [ $AGE_HOURS -gt $MAX_AGE_HOURS ]; then
  echo "❌ ALERTE: Le backup est trop ancien (>$MAX_AGE_HOURS heures)!"
  exit 1
fi

# Vérifier la taille
SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
echo "💾 Taille: $SIZE"

echo "✅ Backups OK"
```

Ajoutez au cron pour vérification quotidienne :
```bash
0 8 * * * /chemin/vers/GestionDesStocks/scripts/check-backups.sh || mail -s "ALERTE BACKUP" admin@example.com
```

---

## 📝 Checklist Complète

### Configuration Initiale
- [ ] Scripts de backup installés
- [ ] Dossier backups/ créé et dans .gitignore
- [ ] SUPABASE_SERVICE_KEY configurée dans .env.local
- [ ] Test manuel de backup réussi
- [ ] Test manuel de restauration réussi

### Automatisation
- [ ] Cron job / Tâche planifiée configurée
- [ ] Backup quotidien à 2h00
- [ ] Logs de backup activés
- [ ] Rétention de 30 jours configurée

### Sécurité
- [ ] Backups stockés hors-site (cloud, disque externe)
- [ ] Backups chiffrés si stockage externe
- [ ] Accès aux backups restreint
- [ ] Procédure de rotation documentée

### Tests
- [ ] Test mensuel de restauration
- [ ] Environnement de test configuré
- [ ] Documentation des tests à jour
- [ ] RTO/RPO documentés

### Documentation
- [ ] Équipe formée à la procédure
- [ ] Guide de restauration accessible 24/7
- [ ] Contacts d'urgence documentés
- [ ] Changelog des incidents maintenu

---

## 🆘 Support

En cas de problème avec les sauvegardes :

1. **Vérifier les logs** : `cat logs/backup.log`
2. **Tester manuellement** : `node scripts/backup-supabase.js`
3. **Consulter les docs Supabase** : https://supabase.com/docs/guides/platform/backups
4. **Contacter le support Supabase** (plan Pro) : support@supabase.com

---

**Dernière mise à jour** : 2025-01-06
**Version** : 1.0
