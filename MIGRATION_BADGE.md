# Migration - Ajout de l'authentification par badge

Ce document décrit la procédure de migration pour ajouter la fonctionnalité d'authentification par badge et de sortie directe d'articles.

## 🗄️ Étape 1 : Migration de la base de données Supabase

Vous devez exécuter le script SQL suivant dans votre console Supabase :

1. Connectez-vous à votre projet Supabase
2. Allez dans l'onglet **SQL Editor**
3. Copiez et exécutez le contenu du fichier `supabase/migrations/add_badge_number.sql`

### Script SQL à exécuter :

```sql
-- Migration: Ajout du champ badge_number pour l'authentification par badge

-- Ajouter la colonne badge_number à la table user_profiles
ALTER TABLE user_profiles
ADD COLUMN badge_number TEXT UNIQUE;

-- Créer un index pour améliorer les performances de recherche par badge
CREATE INDEX idx_user_profiles_badge_number ON user_profiles(badge_number);

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN user_profiles.badge_number IS 'Numéro de badge unique pour l''authentification par scan code-barre';
```

4. Cliquez sur **Run** pour exécuter le script
5. Vérifiez qu'il n'y a pas d'erreurs

## 🎯 Étape 2 : Fonctionnalités ajoutées

### 1. Authentification par badge

- **Route** : `/badge-login`
- **Fonctionnement** :
  - L'utilisateur scanne son badge avec un lecteur code-barre
  - La connexion se fait automatiquement dès que le nombre de caractères requis est atteint
  - Pas besoin de cliquer sur un bouton

### 2. Gestion des badges (Gestionnaires)

- Dans **Gestion des utilisateurs**, vous pouvez maintenant :
  - Assigner un badge à un utilisateur lors de sa création
  - Modifier ou supprimer le badge d'un utilisateur existant
  - Le badge doit être unique dans le système

### 3. Nouveau flux de sortie directe

- **Ancien système** : L'utilisateur créait une demande → le gestionnaire validait → le stock était déduit
- **Nouveau système** : L'utilisateur valide son panier → sortie directe article par article

#### Processus de sortie :

1. L'utilisateur ajoute des articles à son panier
2. Clique sur "**Effectuer la sortie**"
3. Chaque article s'affiche un par un avec :
   - Photo du produit
   - Référence et désignation
   - **Emplacement bien visible** (Zone.Étagère.Position)
   - Stock disponible
   - Sélecteur de quantité modifiable
4. L'utilisateur valide chaque article
5. Le stock est déduit immédiatement
6. Un mouvement de stock est enregistré
7. À la fin : choix de faire une nouvelle sortie ou se déconnecter

## 🔧 Étape 3 : Configuration des lecteurs de code-barre

### Configuration recommandée :

- **Suffixe** : Entrée (Enter/Return) - le lecteur simule un appui sur Entrée après le scan
- **Préfixe** : Aucun
- **Longueur minimale** : 4 caractères
- **Longueur maximale** : 20 caractères

## 📊 Étape 4 : Créer un utilisateur avec badge

1. Connectez-vous en tant que gestionnaire
2. Allez dans **Gestion des utilisateurs**
3. Cliquez sur **Nouvel utilisateur**
4. Remplissez les informations :
   - Nom d'utilisateur
   - Nom complet
   - Mot de passe
   - **Numéro de badge** (optionnel)
   - Rôle (Utilisateur ou Gestionnaire)
5. Cliquez sur **Créer l'utilisateur**

## ✅ Étape 5 : Tester la fonctionnalité

### Test de connexion par badge :

1. Allez sur `/badge-login`
2. Scannez un badge ou saisissez manuellement un numéro de badge
3. Vérifiez que la connexion se fait automatiquement

### Test de sortie directe :

1. Connectez-vous avec un compte utilisateur
2. Ajoutez des articles au panier
3. Cliquez sur "Effectuer la sortie"
4. Vérifiez que :
   - Les articles s'affichent un par un
   - L'emplacement est bien visible
   - Vous pouvez modifier la quantité
   - Le stock est déduit après validation
   - Le message final propose nouvelle sortie ou déconnexion

## 📝 Notes importantes

- Les badges sont **optionnels** - les utilisateurs peuvent toujours se connecter avec username/password
- Les badges sont **uniques** - un badge ne peut être assigné qu'à un seul utilisateur
- Les **mouvements de stock** sont enregistrés pour chaque sortie directe
- L'**historique** reste accessible dans la section Historique pour les gestionnaires

## 🐛 Résolution de problèmes

### Le script SQL échoue

- Vérifiez que la table `user_profiles` existe
- Vérifiez que vous avez les permissions nécessaires
- Si la colonne existe déjà, supprimez la ligne `ALTER TABLE...`

### La connexion par badge ne fonctionne pas

- Vérifiez que le badge est bien enregistré dans la base de données
- Vérifiez que le lecteur code-barre est configuré pour simuler un appui sur Entrée
- Vérifiez la longueur du badge (entre 4 et 20 caractères)

### L'emplacement n'apparaît pas dans le flux de sortie

- Vérifiez que le produit a bien un emplacement défini (Zone, Étagère, Position)
- Vérifiez que les informations sont enregistrées dans la base de données

## 🎨 Personnalisation

### Modifier la longueur du badge :

Dans `src/components/BadgeLogin.tsx`, modifiez les constantes :

```typescript
const BADGE_MIN_LENGTH = 4; // Minimum de caractères
const BADGE_MAX_LENGTH = 20; // Maximum de caractères
const AUTO_SUBMIT_DELAY = 300; // Délai avant soumission (ms)
```

### Modifier les animations :

Les animations du flux de sortie sont dans `src/styles/exitflow.css`

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :

1. Les logs de la console du navigateur
2. Les erreurs dans Supabase (onglet Logs)
3. Que toutes les migrations ont été exécutées

---

**Version** : 1.0.0
**Date** : 2025-12-11
