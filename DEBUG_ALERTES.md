# 🔍 Débogage: Email d'alertes ne se sauvegarde pas

## Problème
L'adresse email configurée dans **Paramètres > Alertes Intelligentes** ne se sauvegarde pas.

## Cause Probable
La migration SQL n'a probablement **pas été exécutée** dans Supabase. Les colonnes `alert_email`, `enable_stock_alerts` et `enable_consumption_alerts` n'existent pas encore dans la table `user_profiles`.

---

## Solution: Vérifier et Exécuter la Migration

### Étape 1: Vérifier si les colonnes existent

1. **Ouvrir Supabase SQL Editor:**
   https://supabase.com/dashboard/project/jxymbulpvnzzysfcsxvw/editor

2. **Nouvelle requête** (bouton "+ New query")

3. **Copier-coller ce SQL:**

```sql
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
    AND column_name IN ('alert_email', 'enable_stock_alerts', 'enable_consumption_alerts')
ORDER BY column_name;
```

4. **Cliquer sur "Run"** (ou F5)

#### Résultat Attendu

**Si les colonnes EXISTENT (✅ OK):**
```
column_name                  | data_type | is_nullable | column_default
-----------------------------|-----------|-------------|---------------
alert_email                  | text      | YES         | NULL
enable_consumption_alerts    | boolean   | YES         | true
enable_stock_alerts          | boolean   | YES         | true
```

**Si le résultat est VIDE (❌ Problème):**
```
(0 rows)
```
➜ Les colonnes n'existent pas, passez à l'Étape 2

---

### Étape 2: Exécuter la Migration

Si les colonnes n'existent pas, exécutez cette migration:

1. **Dans le même SQL Editor**

2. **Copier-coller ce SQL:**

```sql
-- Ajouter les colonnes pour les alertes
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS alert_email TEXT,
ADD COLUMN IF NOT EXISTS enable_stock_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS enable_consumption_alerts BOOLEAN DEFAULT TRUE;

-- Ajouter des commentaires
COMMENT ON COLUMN user_profiles.alert_email IS 'Adresse email pour recevoir les alertes';
COMMENT ON COLUMN user_profiles.enable_stock_alerts IS 'Active/désactive les alertes de stock faible';
COMMENT ON COLUMN user_profiles.enable_consumption_alerts IS 'Active/désactive les alertes de consommation inhabituelle';
```

3. **Cliquer sur "Run"**

4. **Vérifier le message:** Devrait dire `Success. No rows returned`

---

### Étape 3: Vérifier que ça fonctionne

1. **Revenir à l'application**

2. **Rafraîchir la page** (F5)

3. **Se reconnecter** (se déconnecter puis se reconnecter)

4. **Aller dans Paramètres > Alertes Intelligentes**

5. **Saisir un email** (ex: `votre-email@example.com`)

6. **Cliquer sur "Enregistrer les paramètres"**

7. **Vérifier:**
   - Message de succès: "Paramètres des alertes enregistrés avec succès" ✅
   - L'email reste affiché après rafraîchissement de la page ✅

---

## Vérification Finale dans Supabase

Pour confirmer que l'email est bien sauvegardé:

```sql
-- Voir tous les utilisateurs avec leurs paramètres d'alertes
SELECT
    username,
    name,
    role,
    alert_email,
    enable_stock_alerts,
    enable_consumption_alerts
FROM user_profiles
ORDER BY name;
```

Vous devriez voir votre email dans la colonne `alert_email` ✅

---

## Débogage Avancé

### Si l'email ne se sauvegarde toujours pas

#### 1. Ouvrir la Console du Navigateur

**Dans l'application (F12)**, onglet **Console**, chercher:

```
Mise à jour du profil utilisateur: { userId: "...", updates: {...} }
```

Si vous voyez une **erreur** après cette ligne, notez-la.

#### 2. Erreurs Communes

**Erreur: "column alert_email does not exist"**
➜ La migration n'a pas été exécutée correctement
➜ Retour à l'Étape 2

**Erreur: "permission denied"**
➜ Problème de RLS (Row Level Security)
➜ Vérifiez les politiques dans Supabase Dashboard

**Pas d'erreur mais l'email ne se sauvegarde pas:**
➜ Vérifiez que vous êtes bien connecté en tant que **manager**
➜ Seuls les managers peuvent modifier ces paramètres

---

## Test Complet

### Scénario de Test

1. ✅ **Migration exécutée** (colonnes existent)
2. ✅ **Connecté en tant que manager**
3. ✅ **Email saisi:** `test@example.com`
4. ✅ **Alertes activées:** ☑️ Stock, ☑️ Consommation
5. ✅ **Clic sur "Enregistrer"**
6. ✅ **Message:** "Paramètres des alertes enregistrés avec succès"
7. ✅ **Rafraîchir la page (F5)**
8. ✅ **Email toujours affiché:** `test@example.com`
9. ✅ **Dans Supabase SQL:**
   ```sql
   SELECT alert_email FROM user_profiles WHERE role = 'manager';
   ```
   Résultat: `test@example.com`

---

## Logs de Débogage

### Dans la Console Navigateur

Cherchez ces messages après avoir cliqué sur "Enregistrer":

```
Mise à jour du profil utilisateur: {
  userId: "uuid-ici",
  updates: {
    alertEmail: "votre-email@example.com",
    enableStockAlerts: true,
    enableConsumptionAlerts: true
  }
}

Profil mis à jour avec succès
```

**Si vous voyez ces 2 messages:** La sauvegarde fonctionne ✅

**Si vous voyez une erreur:** Notez le message et vérifiez:
- Migration SQL exécutée
- Colonnes présentes
- Connecté en manager

---

## Aide Rapide

| Symptôme | Solution |
|----------|----------|
| Email disparaît après rafraîchissement | Migration non exécutée → Étape 2 |
| Erreur "column does not exist" | Migration non exécutée → Étape 2 |
| Pas d'erreur mais ne sauvegarde pas | Se déconnecter/reconnecter |
| Message de succès mais email vide | Vérifier dans Supabase SQL |

---

## Commande Rapide

**Tout-en-un pour vérifier ET migrer:**

```sql
-- 1. Vérifier
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name LIKE '%alert%';

-- 2. Si vide, migrer
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS alert_email TEXT,
ADD COLUMN IF NOT EXISTS enable_stock_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS enable_consumption_alerts BOOLEAN DEFAULT TRUE;

-- 3. Vérifier les données
SELECT username, alert_email, enable_stock_alerts, enable_consumption_alerts
FROM user_profiles;
```

---

## Contact

Si le problème persiste après avoir suivi ce guide:
1. Vérifier les logs de la console navigateur
2. Vérifier les colonnes dans Supabase
3. Partager les erreurs exactes
