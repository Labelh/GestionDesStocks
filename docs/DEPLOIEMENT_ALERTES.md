# Guide de Déploiement du Système d'Alertes

Ce guide vous accompagne pas à pas pour activer complètement le système d'alertes avec envoi d'emails.

## Prérequis

- ✅ Migration de base de données (déjà créée)
- ⚠️ Supabase CLI (à installer)
- ⚠️ Compte Resend (à créer)

---

## Étape 1: Installation de Supabase CLI

### Option A: Via Scoop (Recommandé pour Windows)

```powershell
# Installer Scoop si pas déjà installé
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Installer Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option B: Via Chocolatey

```powershell
choco install supabase
```

### Option C: Téléchargement direct

1. Aller sur https://github.com/supabase/cli/releases
2. Télécharger `supabase_windows_amd64.zip`
3. Extraire dans un dossier (ex: `C:\Program Files\Supabase`)
4. Ajouter au PATH Windows:
   - Ouvrir "Modifier les variables d'environnement système"
   - Variables d'environnement → Path → Modifier
   - Ajouter `C:\Program Files\Supabase`

### Vérification

```bash
supabase --version
# Devrait afficher: supabase version X.XX.X
```

---

## Étape 2: Connexion à Supabase

### 2.1 Créer un Access Token

1. Aller sur https://supabase.com/dashboard/account/tokens
2. Cliquer sur "Generate new token"
3. Donner un nom: "CLI Token"
4. Copier le token généré (il ne sera affiché qu'une fois!)

### 2.2 Se connecter

```bash
supabase login
# Coller votre access token quand demandé
```

### 2.3 Lier le projet

```bash
cd C:/Users/Belha/Desktop/Projets/GestionDesStocks
supabase link --project-ref jxymbulpvnzzysfcsxvw
```

Vous devriez voir:
```
✓ Linked to project jxymbulpvnzzysfcsxvw
```

---

## Étape 3: Configuration de Resend

### 3.1 Créer un compte Resend

1. Aller sur https://resend.com
2. Cliquer sur "Get Started"
3. S'inscrire avec email ou GitHub
4. Confirmer votre email

### 3.2 Obtenir une clé API

1. Dans le dashboard Resend: https://resend.com/api-keys
2. Cliquer sur "Create API Key"
3. Donner un nom: "GestionDesStocks Production"
4. Permissions: **Full Access** (pour envoyer des emails)
5. Cliquer sur "Add"
6. **COPIER LA CLÉ** (format: `re_xxxxxxxxxxxx`)
   ⚠️ Elle ne sera affichée qu'une fois!

### 3.3 Configurer le domaine d'envoi

**Option A: Utiliser le domaine Resend (onboarding.resend.dev)**

Par défaut, vous pouvez utiliser le domaine de test de Resend:
- From: `onboarding@resend.dev`
- Limite: 100 emails/jour
- Parfait pour tester!

**Option B: Utiliser votre propre domaine** (Recommandé pour production)

1. Aller dans "Domains" → "Add Domain"
2. Entrer votre domaine (ex: `gestionstocks.com`)
3. Ajouter les enregistrements DNS fournis par Resend
4. Attendre la vérification (quelques minutes)

### 3.4 Configurer la clé API dans Supabase

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
```

Remplacez `re_xxxxxxxxxxxx` par votre vraie clé API Resend.

Vous devriez voir:
```
✓ Finished supabase secrets set.
```

---

## Étape 4: Modifier l'adresse d'envoi (si domaine personnalisé)

Si vous utilisez votre propre domaine vérifié, modifiez le fichier:

**Fichier:** `supabase/functions/send-alert-email/index.ts`

**Ligne 156** (environ):
```typescript
from: 'Gestion des Stocks <alerts@votredomaine.com>', // Modifier ici
```

Si vous utilisez le domaine de test Resend, modifiez en:
```typescript
from: 'Gestion des Stocks <onboarding@resend.dev>',
```

---

## Étape 5: Déployer l'Edge Function

### 5.1 Déployer

```bash
supabase functions deploy send-alert-email
```

Vous devriez voir:
```
Deploying send-alert-email...
✓ Deployed send-alert-email
```

### 5.2 Vérifier le déploiement

```bash
supabase functions list
```

Devrait afficher:
```
┌─────────────────────┬─────────┬────────────┐
│ NAME                │ VERSION │ STATUS     │
├─────────────────────┼─────────┼────────────┤
│ send-alert-email    │ 1       │ ACTIVE     │
└─────────────────────┴─────────┴────────────┘
```

---

## Étape 6: Migration de la base de données

### 6.1 Exécuter dans Supabase Dashboard

1. Aller sur https://supabase.com/dashboard/project/jxymbulpvnzzysfcsxvw/editor
2. Cliquer sur "SQL Editor" (icône </> dans le menu gauche)
3. "New query"
4. Coller le SQL suivant:

```sql
-- Ajouter les colonnes d'alertes
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS alert_email TEXT,
ADD COLUMN IF NOT EXISTS enable_stock_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS enable_consumption_alerts BOOLEAN DEFAULT TRUE;

-- Commentaires
COMMENT ON COLUMN user_profiles.alert_email IS 'Adresse email pour recevoir les alertes';
COMMENT ON COLUMN user_profiles.enable_stock_alerts IS 'Active/désactive les alertes de stock faible';
COMMENT ON COLUMN user_profiles.enable_consumption_alerts IS 'Active/désactive les alertes de consommation inhabituelle';
```

5. Cliquer sur "Run" (ou F5)
6. Vérifier le message: `Success. No rows returned`

### 6.2 Vérifier les colonnes

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
```

Vous devriez voir les 3 nouvelles colonnes:
- `alert_email` (text)
- `enable_stock_alerts` (boolean, default true)
- `enable_consumption_alerts` (boolean, default true)

---

## Étape 7: Tester le système

### 7.1 Configurer dans l'application

1. **Se connecter** en tant que manager dans l'application
2. Aller dans **Paramètres** (icône ⚙️)
3. Faire défiler jusqu'à **"Alertes Intelligentes"**
4. Configurer:
   - **Email**: Votre adresse email de test
   - ✅ **Alertes de stock** activé
   - ✅ **Alertes de consommation** activé
5. Cliquer sur **"Enregistrer les paramètres"**

### 7.2 Créer des conditions d'alerte (Stock faible)

1. Aller dans **Produits**
2. Modifier un produit existant ou en créer un:
   - Stock actuel: `5`
   - Stock minimum: `10`
3. Enregistrer

### 7.3 Attendre la vérification automatique

Le système vérifie automatiquement toutes les heures. Pour tester immédiatement:

**Option A: Attendre 30 secondes**
Le système fait une vérification initiale 30s après la connexion.

**Option B: Redémarrer l'application**
1. Se déconnecter
2. Se reconnecter en tant que manager
3. Attendre 30 secondes

### 7.4 Vérifier les logs

**Dans la console navigateur (F12):**
Rechercher:
```
[AlertMonitor] Vérification des alertes à HH:MM:SS
Détecté: X alertes de stock, Y alertes de consommation
```

**Logs Supabase Function:**
```bash
supabase functions logs send-alert-email --tail
```

### 7.5 Vérifier l'email reçu

- Vérifier votre boîte email (et spam)
- L'email devrait contenir un tableau avec le produit en stock faible

---

## Étape 8: Test manuel de l'Edge Function (Optionnel)

Pour tester la fonction directement:

```bash
# Récupérer votre anon key
# Dashboard Supabase → Settings → API → Project API keys → anon public

# Tester avec curl
curl -i --location --request POST \
  'https://jxymbulpvnzzysfcsxvw.supabase.co/functions/v1/send-alert-email' \
  --header 'Authorization: Bearer VOTRE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "votre-email@example.com",
    "userName": "Test User",
    "stockAlerts": [{
      "type": "low_stock",
      "productReference": "TEST-001",
      "productDesignation": "Produit de Test",
      "currentStock": 3,
      "minStock": 10,
      "percentage": 30,
      "severity": "critical"
    }],
    "consumptionAlerts": []
  }'
```

Réponse attendue:
```json
{
  "success": true,
  "emailId": "xxxxx-xxxx-xxxx-xxxx-xxxxx"
}
```

---

## Dépannage

### Problème: "supabase: command not found"

**Solution:** Supabase CLI n'est pas dans le PATH
- Fermer et rouvrir le terminal
- Vérifier l'installation: `scoop list` (si installé via Scoop)

### Problème: "Failed to link project"

**Solutions:**
1. Vérifier le token d'accès: `supabase logout` puis `supabase login`
2. Vérifier le project-ref: `jxymbulpvnzzysfcsxvw`

### Problème: "Function deployment failed"

**Causes possibles:**
1. Pas connecté: `supabase login`
2. Pas lié au projet: `supabase link --project-ref jxymbulpvnzzysfcsxvw`
3. Vérifier les logs: `supabase functions deploy send-alert-email --debug`

### Problème: Email non reçu

**Vérifications:**
1. ✅ RESEND_API_KEY configurée: `supabase secrets list`
2. ✅ Fonction déployée: `supabase functions list`
3. ✅ Email configuré dans l'app (Paramètres)
4. ✅ Vérifier spam/courrier indésirable
5. ✅ Logs de la fonction: `supabase functions logs send-alert-email`

**Limites Resend (compte gratuit):**
- 100 emails/jour avec domaine onboarding.resend.dev
- 3000 emails/mois

### Problème: "Resend API error"

**Vérifier:**
1. Clé API valide dans Resend dashboard
2. Clé configurée dans Supabase: `supabase secrets list`
3. Format de l'email "from" correspond au domaine vérifié

---

## Configuration Production

### Recommandations

1. **Domaine personnalisé**
   - Ajouter et vérifier votre domaine dans Resend
   - Modifier le "from" dans la fonction

2. **Fréquence des alertes**
   - Par défaut: 1 vérification/heure
   - Modifier dans `src/components/AlertMonitor.tsx` ligne 11

3. **Seuils personnalisés**
   - Modifier dans `src/services/alertService.ts`:
     - Ligne 40: Sévérité critique (défaut: 50%)
     - Ligne 100: Augmentation consommation (défaut: 50%)

4. **Monitoring**
   - Activer les notifications d'erreur Supabase
   - Surveiller les quotas Resend

---

## Commandes utiles

```bash
# Voir les logs en temps réel
supabase functions logs send-alert-email --tail

# Lister les secrets configurés
supabase secrets list

# Redéployer après modification
supabase functions deploy send-alert-email

# Supprimer un secret
supabase secrets unset RESEND_API_KEY

# Voir les fonctions déployées
supabase functions list
```

---

## Checklist finale

- [ ] Supabase CLI installé et connecté
- [ ] Projet lié (`supabase link`)
- [ ] Compte Resend créé
- [ ] Clé API Resend obtenue
- [ ] Secret RESEND_API_KEY configuré
- [ ] Adresse "from" modifiée (si domaine personnalisé)
- [ ] Fonction déployée
- [ ] Migration SQL exécutée
- [ ] Email configuré dans l'app
- [ ] Test effectué avec succès

---

🎉 **Système d'alertes opérationnel!**

Pour toute question, consultez:
- [Documentation Supabase Functions](https://supabase.com/docs/guides/functions)
- [Documentation Resend](https://resend.com/docs)
- `docs/ALERTES.md` pour l'architecture complète
