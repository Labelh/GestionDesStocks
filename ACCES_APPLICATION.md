# 🌐 Comment Accéder à l'Application

## ✅ Le serveur fonctionne !

Votre serveur de développement est en ligne. Voici comment y accéder :

## 📱 3 Façons d'Accéder

### Option 1 : localhost (Recommandé)
```
http://localhost:5174
```
**👉 Essayez cette URL en premier !**

### Option 2 : IP Locale
```
http://10.186.89.5:5174
```
**✅ Fonctionne depuis n'importe quel appareil sur votre réseau local**
- Votre ordinateur
- Votre téléphone (connecté au même WiFi)
- Autre PC sur le même réseau

### Option 3 : 127.0.0.1
```
http://127.0.0.1:5174
```
**Alternative à localhost**

---

## 🔧 Si localhost ne fonctionne toujours pas

### Solution 1 : Vider le cache du navigateur
1. Appuyez sur `Ctrl + Shift + Delete`
2. Cochez "Images et fichiers en cache"
3. Cliquez sur "Effacer les données"
4. Réessayez `http://localhost:5174`

### Solution 2 : Utiliser un autre navigateur
- Chrome : `http://localhost:5174`
- Firefox : `http://localhost:5174`
- Edge : `http://localhost:5174`

### Solution 3 : Mode Navigation Privée
- Ouvrez une fenêtre de navigation privée
- Collez : `http://localhost:5174`

### Solution 4 : Utiliser l'IP directement
Si localhost ne marche vraiment pas, utilisez :
```
http://10.186.89.5:5174
```

---

## 🎯 Accès depuis votre Téléphone

**Sur le même WiFi que votre PC :**

1. Ouvrez le navigateur de votre téléphone
2. Tapez : `http://10.186.89.5:5174`
3. Vous verrez l'application !

**⚠️ Note :** Votre PC doit rester allumé et le serveur doit tourner.

---

## 🔥 Pare-feu Windows

Si l'IP locale ne fonctionne pas depuis un autre appareil :

1. Recherchez "Pare-feu Windows" dans le menu Démarrer
2. Cliquez sur "Autoriser une application"
3. Trouvez "Node.js"
4. Cochez les cases "Privé" et "Public"
5. Cliquez sur "OK"

---

## 📊 État Actuel du Serveur

```
✅ Serveur : EN LIGNE
🌐 Port : 5174
📍 IP Locale : 10.186.89.5
⏰ Démarré : 2025-10-13 20:31
```

---

## 🔑 Connexion

Une fois sur l'application :

**Compte Gestionnaire :**
- Username : `admin`
- Password : `admin`

**Compte Utilisateur :**
- Username : `user`
- Password : `user`

---

## 🛑 Arrêter le Serveur

Pour arrêter le serveur :
- Retournez dans le terminal
- Appuyez sur `Ctrl + C`

Pour le relancer :
```bash
npm run dev
```

---

## 🆘 Dépannage

### Le port change à chaque fois ?
C'est normal si le port précédent est encore utilisé. Le serveur trouve automatiquement un port libre (5173, 5174, 5175, etc.)

### "ERR_CONNECTION_REFUSED"
- Vérifiez que le serveur tourne (vous devez voir "VITE ready in XXms")
- Vérifiez le numéro de port dans le terminal
- Essayez l'IP locale : `http://10.186.89.5:5174`

### "This site can't be reached"
- Vérifiez l'orthographe de l'URL
- Assurez-vous d'utiliser `http://` et pas `https://`
- Essayez un autre navigateur
- Redémarrez le serveur (`Ctrl+C` puis `npm run dev`)

### Rien ne s'affiche (page blanche)
- Ouvrez la console du navigateur (F12)
- Regardez s'il y a des erreurs
- Videz le cache (`Ctrl + Shift + Delete`)

---

## 💡 Astuce Pro

**Créez un raccourci :**

1. Créez un fichier `lancer-app.bat` avec :
```batch
@echo off
cd "C:\Users\Ajust82\Desktop\Projet\GestionDesStocks"
start http://localhost:5174
npm run dev
```

2. Double-cliquez dessus pour lancer l'app automatiquement !

---

## 🎉 Tout Fonctionne ?

Si vous voyez la page de connexion, **félicitations !**

Votre application de gestion de stock est en ligne ! 🚀
