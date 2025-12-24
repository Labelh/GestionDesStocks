# Migration: Persistance du Panier de Sortie

## Problème résolu

Avant cette modification, les articles du panier de sortie étaient stockés dans `localStorage`. Si un utilisateur ajoutait 5 articles au panier et ne récupérait que 2 articles, les 3 autres étaient **perdus après déconnexion**.

## Solution implémentée

Les articles en attente de sortie (panier) sont maintenant stockés dans **Supabase** avec les avantages suivants :

✅ **Persistance après déconnexion** - Les articles restent dans le panier même après reconnexion
✅ **Sélection individuelle** - Possibilité de cocher uniquement les articles récupérés
✅ **Suppression sélective** - Seuls les articles cochés sont retirés du panier après génération du PDF
✅ **Multi-utilisateurs** - Chaque utilisateur a son propre panier

## Installation

### 1. Appliquer la migration SQL

Connectez-vous à votre projet Supabase et exécutez le fichier SQL :

```bash
# Via l'interface Supabase
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet GestionDesStocks
3. Allez dans "SQL Editor"
4. Cliquez sur "New Query"
5. Copiez-collez le contenu du fichier: supabase-pending-exits.sql
6. Cliquez sur "Run"
```

Ou via la CLI Supabase :

```bash
supabase db push --db-url YOUR_DATABASE_URL < supabase-pending-exits.sql
```

### 2. Vérifier la création de la table

Vérifiez que la table `pending_exits` a été créée :

```sql
SELECT * FROM pending_exits LIMIT 1;
```

### 3. Déployer le code

```bash
# Installer les dépendances (si nécessaire)
npm install

# Build
npm run build

# Déployer
git add .
git commit -m "feat: Persistance du panier de sortie avec Supabase"
git push
```

## Utilisation

### Pour l'utilisateur

1. **Ajouter des articles** - Approuvez des demandes de sortie comme d'habitude
2. **Voir le panier** - Allez sur "Feuille de Sortie"
3. **Sélectionner les articles récupérés** - Cochez uniquement les articles que vous avez récupérés
4. **Générer le PDF** - Cliquez sur "Générer PDF et Retirer les Articles Sélectionnés"
5. **Résultat** - Les articles non cochés restent dans le panier pour plus tard

### Fonctionnalités

- **Case "Tout sélectionner"** dans l'en-tête du tableau
- **Compteur** affichant "X / Y articles sélectionnés"
- **Mise en surbrillance** des lignes sélectionnées
- **Bouton désactivé** si aucun article sélectionné

## Structure de la table

```sql
CREATE TABLE pending_exits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  product_reference TEXT NOT NULL,
  product_designation TEXT NOT NULL,
  storage_zone TEXT,
  shelf INTEGER,
  position INTEGER,
  quantity NUMERIC NOT NULL,
  requested_by TEXT NOT NULL,
  reason TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Sécurité (RLS)

Les politiques Row Level Security garantissent que :

- ✅ Les utilisateurs ne voient que leur propre panier
- ✅ Les utilisateurs ne peuvent créer/modifier que leurs articles
- ✅ Les managers peuvent voir tous les paniers (lecture seule)

## Migration depuis localStorage

Les anciens paniers stockés dans `localStorage` ne sont **pas migrés automatiquement**. Les utilisateurs devront :

1. Se reconnecter
2. Réapprouver les demandes de sortie si nécessaire

## Dépannage

### Les articles n'apparaissent pas

1. Vérifiez que la table existe :
   ```sql
   SELECT * FROM pending_exits;
   ```

2. Vérifiez les permissions RLS :
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'pending_exits';
   ```

3. Vérifiez la connexion Supabase dans la console du navigateur

### Erreur lors de l'ajout

- Assurez-vous que l'utilisateur est connecté (`currentUser` non null)
- Vérifiez que la politique RLS permet l'insertion

## Rollback (Retour en arrière)

Si vous souhaitez revenir à l'ancien système :

```sql
DROP TABLE IF EXISTS pending_exits CASCADE;
```

Puis restaurez le code depuis le commit précédent.

---

**Date de migration** : 2025-12-24
**Version** : 2.0.0
