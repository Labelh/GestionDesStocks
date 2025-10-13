# Guide de Déploiement et Hébergement

## 1. Publier sur GitHub

### Étape 1 : Créer un repository sur GitHub
1. Allez sur [GitHub](https://github.com)
2. Cliquez sur le bouton "+" en haut à droite et sélectionnez "New repository"
3. Nommez votre repository (ex: `gestion-des-stocks`)
4. Choisissez "Public" ou "Private"
5. **Ne cochez PAS** "Initialize this repository with a README"
6. Cliquez sur "Create repository"

### Étape 2 : Pousser le code vers GitHub
Copiez et exécutez les commandes suivantes dans votre terminal :

```bash
cd "C:\Users\Ajust82\Desktop\Projet\GestionDesStocks"

# Ajouter l'URL de votre repository GitHub (remplacez USERNAME par votre nom d'utilisateur)
git remote add origin https://github.com/USERNAME/gestion-des-stocks.git

# Pousser le code
git branch -M main
git push -u origin main
```

## 2. Héberger l'Application en Ligne

### Option A : Vercel (Recommandé - Gratuit)

1. **Créer un compte Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez-vous avec votre compte GitHub

2. **Importer le projet**
   - Cliquez sur "Add New" > "Project"
   - Sélectionnez votre repository `gestion-des-stocks`
   - Vercel détectera automatiquement Vite
   - Cliquez sur "Deploy"

3. **Configuration automatique**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Accéder à votre application**
   - Une fois déployé, vous obtiendrez une URL : `https://votre-projet.vercel.app`
   - L'application sera automatiquement redéployée à chaque push sur GitHub

### Option B : Netlify (Gratuit)

1. **Créer un compte Netlify**
   - Allez sur [netlify.com](https://netlify.com)
   - Connectez-vous avec votre compte GitHub

2. **Importer le projet**
   - Cliquez sur "Add new site" > "Import an existing project"
   - Sélectionnez GitHub
   - Choisissez votre repository

3. **Configuration**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Déployer**
   - Cliquez sur "Deploy site"
   - Vous obtiendrez une URL : `https://votre-projet.netlify.app`

### Option C : GitHub Pages (Gratuit)

1. **Installer gh-pages**
```bash
npm install --save-dev gh-pages
```

2. **Modifier package.json**
Ajoutez ces lignes :
```json
{
  "homepage": "https://USERNAME.github.io/gestion-des-stocks",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. **Modifier vite.config.ts**
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/gestion-des-stocks/'
})
```

4. **Déployer**
```bash
npm run deploy
```

## 3. Domaine Personnalisé (Optionnel)

### Avec Vercel
1. Allez dans les paramètres de votre projet
2. Cliquez sur "Domains"
3. Ajoutez votre domaine personnalisé

### Avec Netlify
1. Allez dans "Domain settings"
2. Ajoutez votre domaine personnalisé

## Notes Importantes

- **LocalStorage** : Actuellement, les données sont stockées localement dans le navigateur
- **Limitation** : Si l'utilisateur efface ses données de navigation, les données seront perdues
- **Solution** : Voir le fichier `DATABASE_INTEGRATION.md` pour migrer vers une vraie base de données

## Mises à Jour Automatiques

Avec Vercel ou Netlify, chaque fois que vous poussez du code sur GitHub :
```bash
git add .
git commit -m "Votre message de commit"
git push
```

Votre site sera automatiquement redéployé en quelques minutes !
