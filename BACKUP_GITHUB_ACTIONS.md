# 🤖 Backup Automatique avec GitHub Actions

Votre système de backup est maintenant configuré pour s'exécuter automatiquement dans le cloud avec GitHub Actions !

## ✅ Avantages

- 🌍 **Fonctionne 24/7** : Même si votre PC est éteint
- ☁️ **Dans le cloud** : Les backups tournent sur les serveurs GitHub
- 📦 **Double sauvegarde** :
  - Stockés comme artifacts GitHub (30 jours)
  - Commitées dans votre dépôt Git (permanent)
- 🆓 **Gratuit** : Inclus dans GitHub Free

---

## 🔧 Configuration requise (À FAIRE MAINTENANT)

### Secret GitHub manquant

Vous devez ajouter UN secret supplémentaire dans GitHub :

1. **Allez sur GitHub** : https://github.com/Labelh/GestionDesStocks/settings/secrets/actions

2. **Cliquez sur "New repository secret"**

3. **Ajoutez ce secret** :
   - Name: `SUPABASE_SERVICE_KEY`
   - Secret: Collez votre clé `service_role` de Supabase (celle dans votre `.env.local`)
   - Cliquez sur **"Add secret"**

### ✅ Vérification

Vous devriez maintenant avoir **3 secrets** dans GitHub :
- ✅ `VITE_SUPABASE_URL` (déjà configuré)
- ✅ `VITE_SUPABASE_ANON_KEY` (déjà configuré)
- ⚠️ `SUPABASE_SERVICE_KEY` (À AJOUTER MAINTENANT)

---

## 📅 Planification

Le backup s'exécute automatiquement :
- **Tous les jours à 2h00 UTC** (3h ou 4h heure française selon été/hiver)
- **Durée** : ~1-2 minutes

---

## 🚀 Tester le backup manuellement

Pour vérifier que tout fonctionne AVANT d'attendre demain :

1. **Allez sur GitHub** : https://github.com/Labelh/GestionDesStocks/actions

2. **Cliquez sur** "Backup Automatique Supabase" dans la liste de gauche

3. **Cliquez sur** le bouton **"Run workflow"** (à droite)

4. **Cliquez sur** le bouton vert **"Run workflow"**

5. **Attendez ~2 minutes** et rafraîchissez la page

6. **Résultat attendu** :
   - ✅ Coche verte = Backup réussi
   - ❌ Croix rouge = Erreur (vérifiez les secrets)

---

## 📥 Où trouver vos backups ?

### Option 1 : Artifacts GitHub (30 jours)

1. **Allez sur** : https://github.com/Labelh/GestionDesStocks/actions

2. **Cliquez sur** un workflow terminé (avec ✅)

3. **Scrollez en bas** → Section "Artifacts"

4. **Téléchargez** le fichier ZIP contenant le backup JSON

### Option 2 : Dans votre dépôt Git (permanent)

Les backups sont aussi automatiquement commitées dans le dossier `backups/` de votre dépôt :

1. **Allez sur** : https://github.com/Labelh/GestionDesStocks/tree/main/backups

2. **Téléchargez** le fichier JSON que vous voulez

---

## 🔍 Surveiller les backups

### Chaque semaine

Vérifiez que les backups se créent bien :
- https://github.com/Labelh/GestionDesStocks/actions
- Vous devriez voir 7 exécutions réussies (une par jour)

### Notifications en cas d'échec

GitHub vous enverra automatiquement un email si un backup échoue.

---

## 🆘 Dépannage

### ❌ Le workflow échoue avec "Invalid API key"

→ Vérifiez que `SUPABASE_SERVICE_KEY` est bien configuré dans les secrets GitHub

### ❌ Le workflow ne se lance pas automatiquement

→ Attendez 24h, GitHub a parfois un délai la première fois

### ❌ Erreur "permission denied" lors du commit

→ Normal, ce n'est pas bloquant. Le backup est quand même sauvegardé comme artifact.

---

## 📊 Résumé de votre système de backup

| Méthode | Fréquence | Stockage | Durée conservation |
|---------|-----------|----------|-------------------|
| **GitHub Actions** | Quotidien (2h00 UTC) | Artifacts GitHub | 30 jours |
| **GitHub Actions** | Quotidien (2h00 UTC) | Dépôt Git | Permanent |
| **Manuel** | Sur demande | Dossier local `backups/` | Permanent |

---

## 🎉 C'est tout !

Votre système de backup automatique est maintenant opérationnel dans le cloud !

**N'oubliez pas** :
1. ⚠️ Ajouter le secret `SUPABASE_SERVICE_KEY` dans GitHub (voir ci-dessus)
2. ✅ Tester manuellement le workflow une première fois
3. 📅 Vérifier chaque semaine que les backups se font bien

---

**Besoin d'aide ?** Les logs détaillés de chaque backup sont disponibles dans l'onglet Actions de GitHub.
