# Instructions de mise à jour - Système de fournisseurs

## Modifications effectuées

J'ai mis à jour votre application pour supporter 3 fournisseurs par produit au lieu de 2. Voici ce qui a été fait :

### 1. Fichiers modifiés

#### `src/types/index.ts`
- ✅ Ajout des champs `supplier3` et `orderLink3` à l'interface Product

#### `src/context/AppContextSupabase.tsx`
- ✅ Ajout du mapping des colonnes supplier3 et orderLink3 dans `loadProducts`
- ✅ Ajout de l'insertion des colonnes dans `addProduct`
- ✅ Ajout de la mise à jour des colonnes dans `updateProduct`

#### `src/pages/AddProduct.tsx`
- ✅ Ajout des champs supplier3 et orderLink3 dans le formulaire
- ✅ Catégorisation du formulaire en 4 sections :
  - Informations générales
  - Localisation
  - Gestion du stock
  - Fournisseurs et commandes

#### `src/pages/Products.tsx`
- ✅ Ajout des champs supplier3 et orderLink3 dans le modal d'édition
- ✅ Mise à jour du modal "Commander" pour afficher 3 fournisseurs

#### `src/index.css`
- ✅ Ajout des styles pour les sections de formulaire (`.form-section`, `.form-section-title`)

#### `supabase_migrations.sql`
- ✅ Création du fichier de migration SQL

---

## ⚠️ ACTIONS REQUISES ⚠️

### ÉTAPE 1 : Exécuter la migration SQL dans Supabase

Vous devez **absolument** exécuter le script SQL dans votre base de données Supabase avant que l'application puisse sauvegarder les données des fournisseurs.

1. Connectez-vous à votre tableau de bord Supabase
2. Allez dans **SQL Editor**
3. Copiez et collez le contenu du fichier `supabase_migrations.sql` :

```sql
-- Migration pour ajouter les colonnes de fournisseurs et liens de commande
-- À exécuter dans Supabase SQL Editor

-- Ajouter les colonnes pour les fournisseurs et liens de commande supplémentaires
ALTER TABLE products
ADD COLUMN IF NOT EXISTS order_link_1 TEXT,
ADD COLUMN IF NOT EXISTS supplier_1 TEXT,
ADD COLUMN IF NOT EXISTS order_link_2 TEXT,
ADD COLUMN IF NOT EXISTS supplier_2 TEXT,
ADD COLUMN IF NOT EXISTS order_link_3 TEXT,
ADD COLUMN IF NOT EXISTS supplier_3 TEXT;

-- Migrer les données existantes de order_link vers order_link_1
UPDATE products
SET order_link_1 = order_link
WHERE order_link IS NOT NULL AND order_link_1 IS NULL;

-- Note: La colonne order_link est conservée pour la rétrocompatibilité
```

4. Cliquez sur **Run** pour exécuter la migration

---

### ÉTAPE 2 : Tester l'application

Une fois la migration SQL exécutée :

1. Rafraîchissez votre application
2. Testez l'ajout d'un nouveau produit avec 3 fournisseurs
3. Vérifiez que les données se sauvegardent correctement
4. Testez la modification d'un produit existant
5. Vérifiez que le modal "Commander" affiche bien les 3 fournisseurs

---

## Fonctionnalités ajoutées

### Formulaire d'ajout de produit
- Le formulaire est maintenant organisé en sections claires
- Support de 3 fournisseurs avec leurs liens de commande respectifs
- Meilleure lisibilité et organisation des champs

### Modal d'édition
- Ajout du 3ème fournisseur dans le modal d'édition
- Tous les champs fournisseurs peuvent être modifiés

### Modal "Commander"
- Affichage de jusqu'à 3 cards de fournisseurs
- Chaque card affiche le nom du fournisseur ou un nom par défaut
- Les cards ne s'affichent que si un lien de commande est renseigné

---

## Notes importantes

1. **Rétrocompatibilité** : L'ancienne colonne `order_link` est conservée pour la compatibilité avec les anciens produits
2. **Migration des données** : Les liens existants dans `order_link` seront automatiquement copiés vers `order_link_1`
3. **Champs optionnels** : Tous les champs fournisseurs sont optionnels, vous pouvez utiliser 1, 2 ou 3 fournisseurs selon vos besoins

---

## Prochaines étapes (optionnelles)

Si vous souhaitez aller plus loin, voici des améliorations possibles :

1. **Gestion centralisée des fournisseurs** : Créer une section dans les paramètres pour gérer une liste de fournisseurs réutilisables
2. **Listes déroulantes** : Remplacer les champs texte par des listes déroulantes pour sélectionner les fournisseurs depuis la liste centralisée
3. **Statistiques fournisseurs** : Ajouter des statistiques sur les produits par fournisseur

Ces améliorations nécessiteraient :
- Création d'une table `suppliers` dans Supabase
- Ajout d'une interface de gestion des fournisseurs dans les Paramètres
- Modification des formulaires pour utiliser des selects au lieu d'inputs texte

---

## Support

Si vous rencontrez des problèmes après avoir exécuté la migration SQL, vérifiez :
1. Que la migration s'est exécutée sans erreur dans Supabase
2. Que les colonnes ont bien été ajoutées à la table `products`
3. Que vous avez rafraîchi l'application après la migration

En cas de problème, vérifiez la console du navigateur pour voir les erreurs éventuelles.
