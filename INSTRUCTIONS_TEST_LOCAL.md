# Instructions pour tester le type de conditionnement en local

## 1. Exécuter le script SQL dans Supabase

1. Ouvrez votre dashboard Supabase : https://supabase.com/dashboard
2. Allez dans votre projet
3. Cliquez sur "SQL Editor" dans le menu gauche
4. Ouvrez le fichier `supabase-add-packaging-type.sql` de votre projet
5. Copiez tout le contenu et collez-le dans l'éditeur SQL
6. Cliquez sur "Run" pour exécuter le script

Cela va :
- Ajouter la colonne `packaging_type` à la table products
- Mettre à jour automatiquement les produits existants avec des valeurs intelligentes
- Afficher un résumé de la distribution des types

## 2. Lancer le serveur de développement

Dans le terminal, depuis la racine du projet :

```bash
npm run dev
```

## 3. Tester les fonctionnalités

### Test 1 : Ajouter un nouveau produit

1. Connectez-vous en tant que gestionnaire
2. Allez dans "Ajouter un Produit"
3. Vérifiez que le champ "Type de conditionnement" est présent
4. Testez les 2 options :
   - 🔧 Unité - Déclarer à chaque sortie
   - 📦 Lot/Boîte - Déclarer à l'ouverture
5. Créez un produit de test (par exemple : "Gants latex (boîte de 100)" en type "Lot")

### Test 2 : Modifier le type d'un produit existant

1. Dans la page "Gestion des Produits"
2. Cliquez sur "Modifier" (icône crayon) sur un produit
3. Vérifiez que le champ "Type de conditionnement" est présent dans le modal
4. Changez le type (ex: de "Unité" vers "Lot")
5. Sauvegardez et vérifiez que le changement est pris en compte

### Test 3 : Visualiser les icônes dans le catalogue utilisateur

1. Déconnectez-vous du compte gestionnaire
2. Connectez-vous en tant qu'utilisateur
3. Allez dans le "Catalogue"
4. Vérifiez que chaque produit affiche **sur l'image**, au même niveau :
   - Badge catégorie à gauche
   - Badge type à droite avec **texte "Unité" ou "Lot"** sur fond noir transparent
5. Survolez le badge type avec la souris pour voir l'infobulle explicative

### Test 4 : Vérifier l'affichage dans la liste gestionnaire

1. En tant que gestionnaire, allez dans "Gestion des Produits"
2. Dans le tableau, colonne "Catégorie", vérifiez que :
   - L'**icône** (🔧 ou 📦) est affichée **à gauche** de la catégorie
   - Le badge de l'icône est **transparent** (sans couleur de fond)
3. Vérifiez la cohérence des types entre catalogue et liste

### Test 5 : Vérifier les produits existants

1. Vérifiez que les produits existants ont été automatiquement catégorisés :
   - Produits avec "boîte", "lot", "paquet" dans le nom → type "Lot" (📦)
   - Autres produits → type "Unité" (🔧) par défaut

## 4. Que tester spécifiquement

✅ Le formulaire d'ajout affiche 2 options : Unité et Lot
✅ Le modal de modification permet de changer le type
✅ Dans le catalogue : badge texte "Unité"/"Lot" aligné à droite avec fond noir transparent
✅ Dans la gestion produits : icône 🔧/📦 à gauche de la catégorie avec badge transparent
✅ L'infobulle apparaît au survol du badge
✅ La création de produit fonctionne avec le nouveau champ
✅ La modification de produit sauvegarde le type correctement
✅ Les produits existants ont été mis à jour automatiquement (lot vs unité)

## 5. En cas de problème

Si vous rencontrez des erreurs :
- Vérifiez que le script SQL a bien été exécuté (pas d'erreurs dans Supabase)
- Vérifiez la console du navigateur (F12) pour voir les erreurs JavaScript
- Assurez-vous que le serveur de développement tourne sans erreurs

## 6. Notes importantes

- Les modifications sont SEULEMENT en local pour l'instant
- Aucun commit n'a été fait
- Vous pouvez tester tranquillement sans impacter la production
- Si tout fonctionne bien, je commiterai et déploierai
