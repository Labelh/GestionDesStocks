# 🧪 Guide de Test du Système d'Alertes

## ✅ Nouveau: Bouton de Test Immédiat

J'ai ajouté un **bouton "🔔 Tester les alertes maintenant"** dans la page Paramètres qui vous permet de tester sans attendre!

---

## 🚀 Test Rapide (2 minutes)

### Étape 1: Préparer un Produit avec Stock Faible

1. **Aller dans Produits** (ou créer un nouveau)
2. **Configurer:**
   - Nom: "Produit Test Alerte"
   - Stock actuel: **5**
   - Stock minimum: **10**
3. **Enregistrer**

### Étape 2: Vérifier la Configuration des Alertes

1. **Aller dans Paramètres** (⚙️)
2. **Section "Alertes Intelligentes"**
3. **Vérifier:**
   - ✅ Email renseigné (ex: votre-email@example.com)
   - ✅ "Alertes de stock" activé
   - ✅ "Alertes de consommation" activé

### Étape 3: Tester Immédiatement

1. **Cliquer sur le bouton bleu "🔔 Tester les alertes maintenant"**
2. **Attendre quelques secondes**
3. **Ouvrir la Console** (F12) → onglet **Console**

### Étape 4: Vérifier les Logs

Dans la console, vous devriez voir:

```
🔔 Test manuel des alertes...
[AlertMonitor] Vérification des alertes à HH:MM:SS
Détecté: 1 alertes de stock, 0 alertes de consommation
Alertes envoyées à 1 utilisateur(s)
```

### Étape 5: Vérifier l'Email

1. **Vérifier votre boîte email** (et le dossier spam)
2. **Email attendu:**
   - Sujet: "🔔 Alertes Stock - 1 notification(s)"
   - Contenu: Tableau avec "Produit Test Alerte"

---

## 🔍 Diagnostic en Cas de Problème

### Scénario A: Aucun Log dans la Console

**Symptôme:** Rien ne s'affiche dans la console après le clic

**Solutions:**
1. Vérifier que vous êtes connecté en **manager** (pas user)
2. Rafraîchir la page (F5)
3. Vérifier la console pour d'éventuelles erreurs

### Scénario B: "Détecté: 0 alertes de stock"

**Symptôme:** Le système détecte 0 alerte alors que vous avez créé un produit avec stock faible

**Vérifications:**
1. Le produit a bien: **Stock actuel ≤ Stock minimum** ?
2. Le produit n'est pas **supprimé** (soft delete)?
3. Rafraîchir la page pour être sûr que les données sont à jour

### Scénario C: Alertes détectées mais pas d'email

**Symptôme:** Console affiche "Détecté: X alertes" mais pas d'email reçu

**Vérifications:**

#### 1. Edge Function Déployée?

```powershell
supabase functions list
```

Devrait afficher `send-alert-email` avec status `ACTIVE`

**Si pas déployée:**
```powershell
cd C:\Users\Belha\Desktop\Projets\GestionDesStocks
supabase functions deploy send-alert-email
```

#### 2. Clé API Resend Configurée?

```powershell
supabase secrets list
```

Devrait afficher `RESEND_API_KEY`

**Si pas configurée:**
```powershell
supabase secrets set RESEND_API_KEY=re_votre_cle_ici
```

#### 3. Vérifier les Logs de la Fonction

```powershell
supabase functions logs send-alert-email --tail
```

Chercher des erreurs comme:
- `Resend API error`
- `Invalid email`
- `Permission denied`

#### 4. Tester la Fonction Directement

Obtenez votre `anon key` sur:
https://supabase.com/dashboard/project/jxymbulpvnzzysfcsxvw/settings/api

Puis testez:

```powershell
curl -i --location --request POST `
  'https://jxymbulpvnzzysfcsxvw.supabase.co/functions/v1/send-alert-email' `
  --header 'Authorization: Bearer VOTRE_ANON_KEY' `
  --header 'Content-Type: application/json' `
  --data '{
    "to": "votre-email@example.com",
    "userName": "Test",
    "stockAlerts": [{
      "type": "low_stock",
      "productReference": "TEST-001",
      "productDesignation": "Test",
      "currentStock": 5,
      "minStock": 10,
      "percentage": 50,
      "severity": "warning"
    }],
    "consumptionAlerts": []
  }'
```

Réponse attendue:
```json
{"success": true, "emailId": "xxxxx"}
```

### Scénario D: Email en spam

**C'est normal au début!** Les emails de nouveaux domaines vont souvent en spam.

**Solutions:**
1. Marquer comme "Pas un spam"
2. Ajouter `alerts@gestionstocks.app` (ou votre domaine) aux contacts
3. Utiliser un domaine personnalisé vérifié dans Resend (production)

---

## 📋 Checklist Complète de Vérification

### Configuration Supabase

- [ ] Migration SQL exécutée (colonnes alert_email, enable_stock_alerts, enable_consumption_alerts créées)
- [ ] Edge Function déployée (`supabase functions list`)
- [ ] Clé API Resend configurée (`supabase secrets list`)

### Configuration Application

- [ ] Connecté en tant que **manager**
- [ ] Email configuré dans Paramètres > Alertes Intelligentes
- [ ] Alertes de stock activées
- [ ] Email persiste après rafraîchissement (fix appliqué)

### Données de Test

- [ ] Au moins un produit avec stock actuel ≤ stock minimum
- [ ] Produit non supprimé (pas de deletedAt)

### Test

- [ ] Bouton "Tester les alertes maintenant" cliqué
- [ ] Console ouverte (F12)
- [ ] Logs affichés: "Détecté: X alertes"
- [ ] Email reçu (ou spam vérifié)

---

## 🎯 Tests Avancés

### Test de Consommation Inhabituelle

Pour tester les alertes de consommation, il faut:

1. **Historique de sorties** (au moins 30 jours)
2. **Augmentation récente** (3 derniers jours)
3. **Augmentation significative** (+50% par rapport à la moyenne)

**Note:** Difficile à simuler rapidement. Concentrez-vous sur les alertes de stock pour le test initial.

### Test de Multiple Alertes

1. Créer plusieurs produits avec stock faible
2. Cliquer sur "Tester les alertes"
3. L'email devrait contenir tous les produits

### Test de Désactivation

1. Décocher "Alertes de stock" dans Paramètres
2. Enregistrer
3. Tester les alertes
4. Email ne devrait **pas** être envoyé

---

## 📊 Logs Utiles

### Console Navigateur (F12)

Cherchez ces messages:

**Succès:**
```
🔔 Test manuel des alertes...
Vérification des alertes...
Détecté: 1 alertes de stock, 0 alertes de consommation
Alertes envoyées à 1 utilisateur(s)
```

**Erreur - Edge Function:**
```
Erreur lors de l'invocation de la fonction d'envoi d'email: ...
```
➜ Vérifier que la fonction est déployée

**Erreur - Configuration:**
```
Aucun utilisateur avec alertes activées
```
➜ Vérifier l'email dans Paramètres

### Logs Edge Function

```powershell
supabase functions logs send-alert-email --tail
```

**Succès:**
```
Sending email to: votre-email@example.com
Email sent successfully
```

**Erreur:**
```
Resend API error: Invalid API key
```
➜ Vérifier la clé API

---

## 💡 Astuces

### Test Rapide Quotidien

1. Cliquer sur "🔔 Tester les alertes maintenant"
2. Vérifier la console (F12)
3. Confirmer "Détecté: X alertes"

Pas besoin d'attendre l'email si les logs sont OK!

### Limite Gratuite Resend

- 100 emails/jour avec domaine test
- 3000 emails/mois
- Si dépassé, upgrader ou utiliser domaine personnalisé

### Mode Développement vs Production

**Développement:**
- Utiliser `onboarding@resend.dev` comme expéditeur
- Limite: 100 emails/jour

**Production:**
- Ajouter votre domaine dans Resend
- Modifier le "from" dans la fonction
- Redéployer

---

## 🆘 Besoin d'Aide?

Si après avoir suivi ce guide le problème persiste:

1. **Copier les logs de la console**
2. **Exécuter:**
   ```powershell
   supabase functions logs send-alert-email
   ```
3. **Vérifier:**
   ```powershell
   supabase secrets list
   supabase functions list
   ```
4. **Partager** ces informations pour diagnostic

---

## ✅ Test Réussi?

Si vous recevez l'email avec le tableau des stocks faibles, **félicitations!** 🎉

Le système d'alertes est **100% opérationnel** et vérifiera automatiquement toutes les heures en arrière-plan.

Vous pouvez maintenant:
- Ajuster les seuils de stock minimum selon vos besoins
- Configurer des alertes pour tous vos produits critiques
- Recevoir des notifications automatiques sans intervention
