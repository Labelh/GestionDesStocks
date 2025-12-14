# 🚀 Installation Rapide du Système d'Alertes

## Option Simple: Script Automatisé (Recommandé)

### Étape 1: Exécuter le script PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File setup-alerts.ps1
```

Le script va:
1. ✅ Installer Scoop (gestionnaire de paquets Windows)
2. ✅ Installer Supabase CLI
3. ✅ Vous guider pour la connexion à Supabase
4. ✅ Lier le projet
5. ✅ Configurer la clé API Resend
6. ✅ Déployer l'Edge Function

### Étape 2: Migration SQL

Exécutez le fichier `migration-alertes.sql` dans Supabase Dashboard:
1. Ouvrir: https://supabase.com/dashboard/project/jxymbulpvnzzysfcsxvw/editor
2. Copier le contenu de `migration-alertes.sql`
3. Coller et exécuter (Run)

### Étape 3: Configuration dans l'app

1. Se connecter en tant que **manager**
2. Aller dans **Paramètres** ⚙️
3. Section **"Alertes Intelligentes"**
4. Configurer votre email
5. Activer les alertes souhaitées
6. Enregistrer

**C'est tout! Le système est opérationnel.**

---

## Guide Complet

Pour plus de détails, consultez:
- **`docs/DEPLOIEMENT_ALERTES.md`** - Guide complet étape par étape
- **`docs/ALERTES.md`** - Architecture et fonctionnement technique

---

## Prérequis Resend

**Gratuit pour commencer:**
- Créer un compte sur https://resend.com
- Obtenir une clé API (format: `re_xxxxxxxxxxxx`)
- Limite gratuite: 100 emails/jour avec domaine test

**Pour production:**
- Ajouter votre domaine personnalisé
- Vérifier via DNS
- Modifier le "from" dans `supabase/functions/send-alert-email/index.ts`

---

## Test Rapide

Une fois configuré:

1. Créer un produit avec stock faible:
   - Stock actuel: 5
   - Stock minimum: 10

2. Attendre 30 secondes (vérification initiale)

3. Vérifier votre email (et spam)

---

## Dépannage Express

### La fonction ne s'exécute pas?
```bash
# Vérifier les logs
supabase functions logs send-alert-email --tail
```

### Email non reçu?
1. Vérifier la configuration email dans Paramètres
2. Vérifier spam
3. Vérifier que RESEND_API_KEY est configurée:
   ```bash
   supabase secrets list
   ```

### Réinstaller/Redéployer?
```bash
supabase functions deploy send-alert-email
```

---

## Support

- 📖 Documentation: `docs/`
- 🐛 Issues: GitHub Issues
- 💬 Questions: Consultez `DEPLOIEMENT_ALERTES.md`
