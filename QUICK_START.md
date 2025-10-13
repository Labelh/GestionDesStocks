# Guide Rapide de Déploiement

## Étape 1 : Publier sur GitHub (5 minutes)

1. **Créer un repository GitHub**
   - Allez sur https://github.com/new
   - Nom du repository : `gestion-des-stocks`
   - Cliquez sur "Create repository"

2. **Pousser le code**
   ```bash
   cd "C:\Users\Ajust82\Desktop\Projet\GestionDesStocks"
   git remote add origin https://github.com/VOTRE_USERNAME/gestion-des-stocks.git
   git push -u origin main
   ```

## Étape 2 : Héberger sur Vercel (5 minutes)

1. **Créer un compte Vercel**
   - Allez sur https://vercel.com/signup
   - Connectez-vous avec GitHub

2. **Importer le projet**
   - Cliquez sur "Add New" → "Project"
   - Sélectionnez `gestion-des-stocks`
   - Cliquez sur "Deploy"

3. **Votre application sera en ligne !**
   - URL : `https://gestion-des-stocks-xxxxx.vercel.app`
   - Accessible depuis n'importe où

## Étape 3 : Intégrer une Base de Données (30 minutes)

### Solution Recommandée : Firebase

1. **Créer un projet Firebase**
   - Allez sur https://console.firebase.google.com
   - Cliquez sur "Ajouter un projet"
   - Nommez-le "gestion-stocks"
   - Activez "Firestore Database"

2. **Installer Firebase**
   ```bash
   npm install firebase
   ```

3. **Obtenir la configuration**
   - Dans Firebase Console : Paramètres du projet → Applications Web
   - Copiez la configuration `firebaseConfig`

4. **Créer src/config/firebase.ts**
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getFirestore } from 'firebase/firestore';

   const firebaseConfig = {
     // Collez votre configuration ici
   };

   const app = initializeApp(firebaseConfig);
   export const db = getFirestore(app);
   ```

5. **Modifier AppContext.tsx**
   - Remplacer `localStorage` par les fonctions Firestore
   - Voir `DATABASE_INTEGRATION.md` pour les exemples complets

## Résumé

✅ Code sauvegardé sur GitHub → Jamais perdu
✅ Application hébergée sur Vercel → Accessible partout
✅ Base de données Firebase → Données persistantes

## Commandes Utiles

```bash
# Voir l'état Git
git status

# Sauvegarder les changements
git add .
git commit -m "Description des changements"
git push

# L'application se mettra à jour automatiquement sur Vercel
```

## Support

- Guide complet de déploiement : `DEPLOYMENT.md`
- Guide d'intégration base de données : `DATABASE_INTEGRATION.md`
- Documentation principale : `README.md`
