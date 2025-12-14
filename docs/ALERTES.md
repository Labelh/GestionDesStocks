# Système d'Alertes Intelligentes

Ce document explique le fonctionnement du système d'alertes intelligentes pour la gestion des stocks.

## Vue d'ensemble

Le système d'alertes surveille automatiquement:
1. **Stocks faibles**: Produits dont le stock actuel est inférieur ou égal au stock minimum
2. **Consommations inhabituelles**: Produits dont la consommation récente dépasse significativement la moyenne

## Architecture

### 1. Service de détection (`src/services/alertService.ts`)

Contient la logique de détection des alertes:

- **`detectLowStockAlerts()`**: Identifie les produits avec stock faible
  - Sévérité "critique" si stock ≤ 50% du minimum
  - Sévérité "warning" si stock > 50% du minimum mais ≤ minimum

- **`detectUnusualConsumption()`**: Analyse les consommations inhabituelles
  - Compare la consommation des 3 derniers jours vs les 30 jours précédents
  - Alerte si augmentation > 50%
  - Nécessite au moins 5 mouvements de sortie

- **`checkAndSendAlerts()`**: Fonction principale
  - Détecte toutes les alertes
  - Récupère les utilisateurs avec alertes activées
  - Envoie les emails via Edge Function

### 2. Hook de monitoring (`src/hooks/useAlertMonitor.ts`)

Hook React pour la surveillance automatique en arrière-plan:

```typescript
useAlertMonitor({
  enabled: true,         // Active/désactive la surveillance
  intervalMinutes: 60    // Intervalle de vérification (défaut: 1h)
})
```

**Fonctionnement:**
- Vérification initiale après 30 secondes (temps de chargement)
- Vérifications périodiques selon l'intervalle configuré
- Active uniquement pour les managers
- Cleanup automatique à la déconnexion

### 3. Edge Function (`supabase/functions/send-alert-email/`)

Fonction serverless Supabase pour l'envoi d'emails:

**Service utilisé:** [Resend](https://resend.com) - Service d'envoi d'emails transactionnels

**Format de l'email:**
- Tableau des stocks faibles avec sévérité
- Tableau des consommations inhabituelles avec pourcentages
- Design HTML responsive
- Lien vers les paramètres pour gérer les préférences

## Configuration

### Étape 1: Configuration utilisateur (dans l'application)

1. Se connecter en tant que manager
2. Aller dans **Paramètres > Alertes Intelligentes**
3. Configurer:
   - Adresse email pour recevoir les alertes
   - Activer/désactiver les alertes de stock
   - Activer/désactiver les alertes de consommation

### Étape 2: Migration de la base de données

Exécuter la migration dans Supabase Dashboard:

```sql
-- Fichier: supabase/migrations/add_alert_settings.sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS alert_email TEXT,
ADD COLUMN IF NOT EXISTS enable_stock_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS enable_consumption_alerts BOOLEAN DEFAULT TRUE;
```

### Étape 3: Configuration de l'envoi d'emails

#### Option A: Resend (Recommandé)

1. Créer un compte sur [Resend](https://resend.com)
2. Obtenir une clé API
3. Installer Supabase CLI:
   ```bash
   npm install -g supabase
   ```

4. Se connecter et lier le projet:
   ```bash
   supabase login
   supabase link --project-ref jxymbulpvnzzysfcsxvw
   ```

5. Configurer la clé API:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

6. Déployer la fonction:
   ```bash
   supabase functions deploy send-alert-email
   ```

#### Option B: Mode simulation (développement)

Si `RESEND_API_KEY` n'est pas configurée, la fonction retournera un succès simulé avec un aperçu de l'email.

#### Option C: SMTP personnalisé

Modifier `supabase/functions/send-alert-email/index.ts` pour utiliser un client SMTP Deno.

## Fonctionnement en production

### Flux complet

```
1. [AlertMonitor] Monte au chargement de l'app (si utilisateur connecté)
   ↓
2. [useAlertMonitor] Démarre la surveillance (managers uniquement)
   ↓
3. Attente 30s puis vérification initiale
   ↓
4. [checkAndSendAlerts] Toutes les heures:
   ├── Détection stocks faibles
   ├── Analyse consommations inhabituelles
   ├── Récupération utilisateurs avec alertes
   └── Envoi emails via Edge Function
       ↓
5. [Edge Function] Pour chaque utilisateur:
   ├── Génération HTML avec tableaux
   ├── Appel API Resend
   └── Envoi email
```

### Critères de déclenchement

**Alertes de stock faible:**
- Stock actuel ≤ Stock minimum configuré

**Alertes de consommation inhabituelle:**
- Minimum 5 sorties dans l'historique
- Consommation récente (3 jours) > +50% vs historique (30 jours)
- Consommation récente > 0

### Fréquence des vérifications

- **Défaut**: Toutes les heures (60 minutes)
- **Modifiable** dans `src/components/AlertMonitor.tsx`:
  ```typescript
  useAlertMonitor({
    enabled: true,
    intervalMinutes: 30, // Changer ici
  });
  ```

## Développement et tests

### Test local de la fonction

```bash
# Démarrer la fonction localement
supabase functions serve send-alert-email

# Tester avec curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-alert-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "test@example.com",
    "userName": "Test User",
    "stockAlerts": [{
      "type": "low_stock",
      "productReference": "TEST-001",
      "productDesignation": "Produit Test",
      "currentStock": 5,
      "minStock": 10,
      "percentage": 50,
      "severity": "warning"
    }],
    "consumptionAlerts": []
  }'
```

### Vérification manuelle des alertes

Ajouter un bouton dans l'interface manager pour déclencher manuellement:

```typescript
import { useApp } from '../context/AppContextSupabase';
import { checkAndSendAlerts } from '../services/alertService';

function ManualAlertButton() {
  const { products, stockMovements } = useApp();

  const handleCheck = async () => {
    await checkAndSendAlerts(products, stockMovements);
  };

  return <button onClick={handleCheck}>Vérifier les alertes</button>;
}
```

## Logs et monitoring

### Logs de la fonction Edge

```bash
supabase functions logs send-alert-email
```

### Logs dans la console navigateur

Le système log automatiquement:
- Démarrage du monitoring
- Vérifications effectuées
- Nombre d'alertes détectées
- Emails envoyés

Rechercher `[AlertMonitor]` dans la console.

## Personnalisation

### Modifier les seuils

**Stocks faibles - Sévérité critique:**
```typescript
// src/services/alertService.ts, ligne ~40
severity: percentage <= 50 ? 'critical' : 'warning'
// Changer 50 par le pourcentage souhaité
```

**Consommation inhabituelle - Seuil d'augmentation:**
```typescript
// src/services/alertService.ts, ligne ~100
if (percentageIncrease > 50 && recentDaily > 0)
// Changer 50 par le pourcentage souhaité
```

**Période d'analyse:**
```typescript
// src/services/alertService.ts
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
// Modifier les valeurs 3 et 30
```

### Modifier le design de l'email

Éditer `supabase/functions/send-alert-email/index.ts`, section `htmlContent`.

## Sécurité

- Les emails ne sont envoyés qu'aux utilisateurs ayant configuré une adresse
- Vérification des préférences (enable_stock_alerts, enable_consumption_alerts)
- Edge Function avec CORS configuré
- Clé API Resend stockée en tant que secret Supabase
- Surveillance active uniquement pour les managers

## Limitations

- Nécessite au moins 5 mouvements de sortie pour l'analyse de consommation
- Vérification basée sur le client (nécessite qu'un manager soit connecté)
- Pour une surveillance 24/7, envisager:
  - Cron job externe appelant l'Edge Function
  - Supabase Database Webhooks
  - Trigger PostgreSQL avec pg_cron

## Améliorations futures

- [ ] Historique des alertes envoyées (éviter duplicatas)
- [ ] Dashboard de visualisation des alertes
- [ ] Support multi-langues pour les emails
- [ ] Notifications in-app en plus des emails
- [ ] Scheduler backend (indépendant du frontend)
- [ ] Alertes personnalisables par produit/catégorie
- [ ] Digest quotidien/hebdomadaire
