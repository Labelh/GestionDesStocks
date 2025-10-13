# Guide de Déploiement sur Vercel

## Option 1 : Déploiement via Interface Web Vercel (Recommandé)

### Étapes :

1. **Aller sur Vercel**
   - Visitez https://vercel.com
   - Connectez-vous avec votre compte GitHub

2. **Importer le Projet**
   - Cliquez sur "Add New..." → "Project"
   - Sélectionnez votre repository `GestionDesStocks`
   - Cliquez sur "Import"

3. **Configuration du Projet**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Déployer**
   - Cliquez sur "Deploy"
   - Attendez quelques minutes
   - Votre URL sera disponible (ex: `gestion-des-stocks.vercel.app`)

## Option 2 : Déploiement via CLI

### Installation :
```bash
npm install -g vercel
```

### Déploiement :
```bash
cd C:\Users\Ajust82\Desktop\Projet\GestionDesStocks
vercel
```

Suivez les instructions :
- Set up and deploy? **Y**
- Which scope? Sélectionnez votre compte
- Link to existing project? **N**
- What's your project's name? **GestionDesStocks**
- In which directory is your code located? **.**
- Want to override the settings? **N**

## Après le Déploiement

Votre application sera accessible via une URL comme :
- `https://gestion-des-stocks.vercel.app`
- `https://gestion-des-stocks-[username].vercel.app`

## Mises à Jour Automatiques

Chaque fois que vous poussez vers GitHub (`git push`), Vercel redéploiera automatiquement votre application.

## Accès à l'Application

**Identifiants par défaut :**
- **Gestionnaire** : admin / admin
- **Utilisateur** : user / user

## Notes Importantes

⚠️ **Stockage de Données**
- Les données sont stockées dans le localStorage du navigateur
- Les données seront perdues si vous videz le cache du navigateur
- Pour une persistance permanente, configurez le backend MySQL (voir BACKEND_SETUP_GUIDE.md)

⚠️ **Domaine Personnalisé**
- Vous pouvez ajouter un domaine personnalisé dans les paramètres Vercel
- Allez dans Project Settings → Domains

## Support

En cas de problème :
1. Vérifiez les logs de build sur Vercel
2. Assurez-vous que `npm run build` fonctionne localement
3. Consultez la documentation Vercel : https://vercel.com/docs
