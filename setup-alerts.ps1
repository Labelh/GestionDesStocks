# Script de configuration du systeme d'alertes
# Executer avec: powershell -ExecutionPolicy Bypass -File setup-alerts.ps1

Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "  Configuration Systeme d'Alertes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour verifier si une commande existe
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    } catch {
        return $false
    }
}

# Etape 1: Installation de Scoop
Write-Host "[1/7] Verification de Scoop..." -ForegroundColor Yellow

if (Test-Command "scoop") {
    Write-Host "OK Scoop deja installe" -ForegroundColor Green
} else {
    Write-Host "  Installation de Scoop..." -ForegroundColor White
    try {
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
        Write-Host "OK Scoop installe avec succes" -ForegroundColor Green
    } catch {
        Write-Host "ERREUR lors de l'installation de Scoop: $_" -ForegroundColor Red
        Write-Host "  Installez manuellement: https://scoop.sh" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Etape 2: Installation de Supabase CLI
Write-Host "[2/7] Installation de Supabase CLI..." -ForegroundColor Yellow

if (Test-Command "supabase") {
    Write-Host "OK Supabase CLI deja installe" -ForegroundColor Green
} else {
    try {
        scoop bucket add supabase https://github.com/supabase/scoop-bucket.git 2>$null
        scoop install supabase
        Write-Host "OK Supabase CLI installe avec succes" -ForegroundColor Green
    } catch {
        Write-Host "ERREUR lors de l'installation de Supabase CLI: $_" -ForegroundColor Red
        exit 1
    }
}

# Afficher la version
$version = supabase --version
Write-Host "  Version: $version" -ForegroundColor Gray
Write-Host ""

# Etape 3: Connexion a Supabase
Write-Host "[3/7] Connexion a Supabase..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Pour obtenir votre Access Token:" -ForegroundColor White
Write-Host "  1. Ouvrez: https://supabase.com/dashboard/account/tokens" -ForegroundColor Gray
Write-Host "  2. Cliquez sur 'Generate new token'" -ForegroundColor Gray
Write-Host "  3. Nommez-le: 'CLI Token'" -ForegroundColor Gray
Write-Host "  4. Copiez le token genere" -ForegroundColor Gray
Write-Host ""

# Verifier si deja connecte
$loginStatus = supabase projects list 2>&1
if ($loginStatus -like "*Not logged in*" -or $loginStatus -like "*not logged in*") {
    Write-Host "  Collez votre Access Token (appuyez sur Entree):" -ForegroundColor White
    supabase login
} else {
    Write-Host "OK Deja connecte a Supabase" -ForegroundColor Green
}

Write-Host ""

# Etape 4: Liaison du projet
Write-Host "[4/7] Liaison au projet..." -ForegroundColor Yellow

$projectRef = "jxymbulpvnzzysfcsxvw"

try {
    supabase link --project-ref $projectRef
    Write-Host "OK Projet lie avec succes" -ForegroundColor Green
} catch {
    Write-Host "WARNING Projet deja lie ou erreur: $_" -ForegroundColor Yellow
}

Write-Host ""

# Etape 5: Configuration de Resend
Write-Host "[5/7] Configuration de Resend API..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Pour obtenir votre cle API Resend:" -ForegroundColor White
Write-Host "  1. Creez un compte sur: https://resend.com" -ForegroundColor Gray
Write-Host "  2. Allez dans: https://resend.com/api-keys" -ForegroundColor Gray
Write-Host "  3. Cliquez sur 'Create API Key'" -ForegroundColor Gray
Write-Host "  4. Nommez-la: 'GestionDesStocks Production'" -ForegroundColor Gray
Write-Host "  5. Permissions: Full Access" -ForegroundColor Gray
Write-Host "  6. Copiez la cle (format: re_xxxxxxxxxxxx)" -ForegroundColor Gray
Write-Host ""

$resendKey = Read-Host "  Collez votre cle API Resend (ou appuyez sur Entree pour passer)"

if ($resendKey -and $resendKey -ne "") {
    try {
        supabase secrets set RESEND_API_KEY=$resendKey
        Write-Host "OK Cle API Resend configuree" -ForegroundColor Green
    } catch {
        Write-Host "ERREUR lors de la configuration: $_" -ForegroundColor Red
    }
} else {
    Write-Host "WARNING Cle API Resend non configuree (mode simulation)" -ForegroundColor Yellow
    Write-Host "  La fonction fonctionnera sans envoyer d'emails reels" -ForegroundColor Gray
}

Write-Host ""

# Etape 6: Deploiement de l'Edge Function
Write-Host "[6/7] Deploiement de l'Edge Function..." -ForegroundColor Yellow

try {
    supabase functions deploy send-alert-email
    Write-Host "OK Fonction deployee avec succes" -ForegroundColor Green

    # Verifier le deploiement
    Write-Host ""
    Write-Host "  Fonctions deployees:" -ForegroundColor Gray
    supabase functions list
} catch {
    Write-Host "ERREUR lors du deploiement: $_" -ForegroundColor Red
}

Write-Host ""

# Etape 7: Migration SQL
Write-Host "[7/7] Migration de la base de donnees..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Executez cette requete SQL dans Supabase Dashboard:" -ForegroundColor White
Write-Host "  https://supabase.com/dashboard/project/$projectRef/editor" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ALTER TABLE user_profiles" -ForegroundColor Gray
Write-Host "  ADD COLUMN IF NOT EXISTS alert_email TEXT," -ForegroundColor Gray
Write-Host "  ADD COLUMN IF NOT EXISTS enable_stock_alerts BOOLEAN DEFAULT TRUE," -ForegroundColor Gray
Write-Host "  ADD COLUMN IF NOT EXISTS enable_consumption_alerts BOOLEAN DEFAULT TRUE;" -ForegroundColor Gray
Write-Host ""

$openBrowser = Read-Host "  Ouvrir le SQL Editor dans le navigateur? (o/N)"
if ($openBrowser -eq "o" -or $openBrowser -eq "O") {
    Start-Process "https://supabase.com/dashboard/project/$projectRef/editor"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration terminee!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "1. Executer la migration SQL (si pas encore fait)" -ForegroundColor White
Write-Host "2. Se connecter a l'application en tant que manager" -ForegroundColor White
Write-Host "3. Aller dans Parametres > Alertes Intelligentes" -ForegroundColor White
Write-Host "4. Configurer l'email et activer les alertes" -ForegroundColor White
Write-Host "5. Le systeme verifiera automatiquement toutes les heures" -ForegroundColor White
Write-Host ""

Write-Host "Documentation complete:" -ForegroundColor Yellow
Write-Host "  docs/DEPLOIEMENT_ALERTES.md" -ForegroundColor Cyan
Write-Host "  docs/ALERTES.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "Commandes utiles:" -ForegroundColor Yellow
Write-Host "  supabase functions logs send-alert-email --tail" -ForegroundColor Gray
Write-Host "  supabase secrets list" -ForegroundColor Gray
Write-Host "  supabase functions list" -ForegroundColor Gray
Write-Host ""

Pause
