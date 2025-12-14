# Installation de Scoop et Supabase CLI

## Méthode Correcte (Sans Administrateur)

### 1. Ouvrir PowerShell NORMAL (PAS en administrateur)

Appuyez sur `Windows + X` puis choisissez **"Windows PowerShell"** (PAS "Windows PowerShell (Admin)")

### 2. Installer Scoop

```powershell
# Autoriser l'exécution de scripts pour l'utilisateur actuel
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Installer Scoop
irm get.scoop.sh | iex
```

**Note:** Si vous voyez un avertissement sur la politique d'exécution, tapez `A` (pour "All") et appuyez sur Entrée.

### 3. Vérifier l'installation

```powershell
scoop --version
```

Vous devriez voir quelque chose comme: `Current Scoop version: 0.X.X`

### 4. Installer Supabase CLI

```powershell
# Ajouter le bucket Supabase
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# Installer Supabase CLI
scoop install supabase
```

### 5. Vérifier Supabase CLI

```powershell
supabase --version
```

Vous devriez voir: `supabase version X.XX.X`

---

## Si ça ne fonctionne toujours pas

### Alternative: Installation manuelle de Supabase CLI

1. **Télécharger directement:**
   - Aller sur: https://github.com/supabase/cli/releases/latest
   - Télécharger: `supabase_windows_amd64.zip`

2. **Extraire:**
   - Extraire le fichier dans: `C:\Users\Belha\supabase-cli\`
   - Vous devriez avoir: `C:\Users\Belha\supabase-cli\supabase.exe`

3. **Ajouter au PATH:**

   **Option A - Temporaire (cette session PowerShell uniquement):**
   ```powershell
   $env:Path += ";C:\Users\Belha\supabase-cli"
   ```

   **Option B - Permanent:**
   ```powershell
   # Ajouter au PATH utilisateur de façon permanente
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\Belha\supabase-cli", "User")
   ```

4. **Vérifier:**
   ```powershell
   # Fermer et rouvrir PowerShell, puis:
   supabase --version
   ```

---

## Prochaines Étapes

Une fois Scoop et Supabase CLI installés, continuez avec:

```powershell
# 1. Se connecter à Supabase
# Obtenir un token sur: https://supabase.com/dashboard/account/tokens
supabase login

# 2. Aller dans le dossier du projet
cd C:\Users\Belha\Desktop\Projets\GestionDesStocks

# 3. Lier le projet
supabase link --project-ref jxymbulpvnzzysfcsxvw
```

Ensuite, suivez les étapes 4-6 du **QUICKSTART.md**
