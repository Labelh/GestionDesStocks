# 🚀 Guide Démarrage Rapide - Système d'Alertes

## Étape 1: Migration SQL (5 minutes)

### Exécuter la migration

1. Ouvrir: https://supabase.com/dashboard/project/jxymbulpvnzzysfcsxvw/editor

2. Créer une nouvelle requête (bouton "+ New query")

3. Copier-coller ce SQL:

```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS alert_email TEXT,
ADD COLUMN IF NOT EXISTS enable_stock_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS enable_consumption_alerts BOOLEAN DEFAULT TRUE;
```

4. Cliquer sur "Run" (ou F5)

5. ✅ Vérifier le message: "Success. No rows returned"

---

## Étape 2: Installer Supabase CLI

### Option A: Via Scoop (Recommandé)

```powershell
# Ouvrir PowerShell en tant qu'administrateur

# Installer Scoop
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Installer Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option B: Téléchargement Direct

1. Aller sur: https://github.com/supabase/cli/releases/latest
2. Télécharger: `supabase_windows_amd64.zip`
3. Extraire dans `C:\Program Files\Supabase`
4. Ajouter au PATH système

---

## Étape 3: Se Connecter à Supabase

```powershell
# 1. Obtenir un Access Token
# Aller sur: https://supabase.com/dashboard/account/tokens
# Cliquer sur "Generate new token"
# Copier le token

# 2. Se connecter
supabase login
# Coller le token quand demandé

# 3. Lier le projet
cd C:\Users\Belha\Desktop\Projets\GestionDesStocks
supabase link --project-ref jxymbulpvnzzysfcsxvw
```

---

## Étape 4: Configuration Resend

### 1. Créer un compte

- Aller sur: https://resend.com
- S'inscrire gratuitement

### 2. Obtenir une clé API

- Dashboard: https://resend.com/api-keys
- Cliquer "Create API Key"
- Nom: "GestionDesStocks"
- Permissions: **Full Access**
- Copier la clé (format: `re_xxxxxxxxxxxx`)

### 3. Configurer la clé dans Supabase

```powershell
supabase secrets set RESEND_API_KEY=re_votre_cle_ici
```

---

## Étape 5: Déployer la Fonction

```powershell
cd C:\Users\Belha\Desktop\Projets\GestionDesStocks
supabase functions deploy send-alert-email
```

Vous devriez voir:
```
✓ Deployed send-alert-email
```

---

## Étape 6: Configuration dans l'Application

1. **Lancer l'application** (npm run dev)
2. **Se connecter** en tant que manager
3. **Aller dans Paramètres** (⚙️)
4. **Section "Alertes Intelligentes"**:
   - Email: Votre adresse email
   - ✅ Alertes de stock activées
   - ✅ Alertes de consommation activées
5. **Enregistrer**

---

## ✅ Test

### Créer une alerte de stock faible

1. Aller dans **Produits**
2. Créer ou modifier un produit:
   - Stock actuel: `5`
   - Stock minimum: `10`
3. Enregistrer
4. Attendre **30 secondes**
5. Vérifier votre **email** (et spam)

---

## 📊 Vérification

### Voir les logs de la fonction

```powershell
supabase functions logs send-alert-email --tail
```

### Vérifier les secrets

```powershell
supabase secrets list
```

### Liste des fonctions

```powershell
supabase functions list
```

---

## 🔧 Utilisation du domaine de test Resend

Par défaut, Resend fournit un domaine de test: `onboarding@resend.dev`

Pour l'utiliser, **AUCUNE modification nécessaire** dans le code!

**Limite:** 100 emails/jour (suffisant pour tester)

---

## 🌐 Utiliser votre propre domaine (Optionnel)

### 1. Ajouter votre domaine dans Resend

- Dashboard Resend > Domains > Add Domain
- Suivre les instructions DNS

### 2. Modifier le fichier de fonction

**Fichier:** `supabase/functions/send-alert-email/index.ts`

**Ligne 156:**
```typescript
from: 'Gestion des Stocks <alerts@votredomaine.com>',
```

### 3. Redéployer

```powershell
supabase functions deploy send-alert-email
```

---

## 📝 Résumé des Commandes

```powershell
# Installation
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Configuration
supabase login
supabase link --project-ref jxymbulpvnzzysfcsxvw
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx

# Déploiement
supabase functions deploy send-alert-email

# Monitoring
supabase functions logs send-alert-email --tail
supabase secrets list
supabase functions list
```

---

## ❓ Problèmes Courants

### "supabase: command not found"

**Solution:** Fermer et rouvrir PowerShell après installation

### "Failed to link project"

**Solutions:**
- Vérifier le token: `supabase logout` puis `supabase login`
- Vérifier que vous êtes dans le bon dossier

### Email non reçu

**Vérifications:**
1. Email configuré dans l'app (Paramètres)
2. Vérifier le dossier spam
3. Logs de la fonction: `supabase functions logs send-alert-email`
4. Clé API configurée: `supabase secrets list`

### "Resend API error"

**Vérifier:**
- Clé API valide dans Resend dashboard
- Format correct: `re_xxxxxxxxxxxx`
- Quota Resend non dépassé (100/jour gratuit)

---

## 📚 Documentation Complète

- **Architecture:** `docs/ALERTES.md`
- **Déploiement détaillé:** `docs/DEPLOIEMENT_ALERTES.md`

---

## ⏱️ Temps Total: ~15-20 minutes

- ✅ Migration SQL: 2 min
- ✅ Installation CLI: 5 min
- ✅ Configuration Resend: 5 min
- ✅ Déploiement: 2 min
- ✅ Test: 5 min

**Le système fonctionne en arrière-plan automatiquement!**
