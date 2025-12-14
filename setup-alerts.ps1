# Script de configuration du système d'alertes
# Exécuter avec: powershell -ExecutionPolicy Bypass -File setup-alerts.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration Système d'Alertes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour vérifier si une commande existe
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

# Étape 1: Installation de Scoop
Write-Host "[1/7] Vérification de Scoop..." -ForegroundColor Yellow

if (Test-Command "scoop") {
    Write-Host "✓ Scoop déjà installé" -ForegroundColor Green
} else {
    Write-Host "  Installation de Scoop..." -ForegroundColor White
    try {
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
        Write-Host "✓ Scoop installé avec succès" -ForegroundColor Green
    } catch {
        Write-Host "✗ Erreur lors de l'installation de Scoop: $_" -ForegroundColor Red
        Write-Host "  Installez manuellement: https://scoop.sh" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Étape 2: Installation de Supabase CLI
Write-Host "[2/7] Installation de Supabase CLI..." -ForegroundColor Yellow

if (Test-Command "supabase") {
    Write-Host "✓ Supabase CLI déjà installé" -ForegroundColor Green
} else {
    try {
        scoop bucket add supabase https://github.com/supabase/scoop-bucket.git 2>$null
        scoop install supabase
        Write-Host "✓ Supabase CLI installé avec succès" -ForegroundColor Green
    } catch {
        Write-Host "✗ Erreur lors de l'installation de Supabase CLI: $_" -ForegroundColor Red
        exit 1
    }
}

# Afficher la version
$version = supabase --version
Write-Host "  Version: $version" -ForegroundColor Gray
Write-Host ""

# Étape 3: Connexion à Supabase
Write-Host "[3/7] Connexion à Supabase..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Pour obtenir votre Access Token:" -ForegroundColor White
Write-Host "  1. Ouvrez: https://supabase.com/dashboard/account/tokens" -ForegroundColor Gray
Write-Host "  2. Cliquez sur 'Generate new token'" -ForegroundColor Gray
Write-Host "  3. Nommez-le: 'CLI Token'" -ForegroundColor Gray
Write-Host "  4. Copiez le token généré" -ForegroundColor Gray
Write-Host ""

# Vérifier si déjà connecté
$loginStatus = supabase projects list 2>&1
if ($loginStatus -like "*Not logged in*" -or $loginStatus -like "*not logged in*") {
    Write-Host "  Collez votre Access Token (appuyez sur Entrée):" -ForegroundColor White
    supabase login
} else {
    Write-Host "✓ Déjà connecté à Supabase" -ForegroundColor Green
}

Write-Host ""

# Étape 4: Liaison du projet
Write-Host "[4/7] Liaison au projet..." -ForegroundColor Yellow

$projectRef = "jxymbulpvnzzysfcsxvw"

try {
    supabase link --project-ref $projectRef
    Write-Host "✓ Projet lié avec succès" -ForegroundColor Green
} catch {
    Write-Host "⚠ Projet déjà lié ou erreur: $_" -ForegroundColor Yellow
}

Write-Host ""

# Étape 5: Configuration de Resend
Write-Host "[5/7] Configuration de Resend API..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Pour obtenir votre clé API Resend:" -ForegroundColor White
Write-Host "  1. Créez un compte sur: https://resend.com" -ForegroundColor Gray
Write-Host "  2. Allez dans: https://resend.com/api-keys" -ForegroundColor Gray
Write-Host "  3. Cliquez sur 'Create API Key'" -ForegroundColor Gray
Write-Host "  4. Nommez-la: 'GestionDesStocks Production'" -ForegroundColor Gray
Write-Host "  5. Permissions: Full Access" -ForegroundColor Gray
Write-Host "  6. Copiez la clé (format: re_xxxxxxxxxxxx)" -ForegroundColor Gray
Write-Host ""

$resendKey = Read-Host "  Collez votre clé API Resend (ou appuyez sur Entrée pour passer)"

if ($resendKey -and $resendKey -ne "") {
    try {
        supabase secrets set RESEND_API_KEY=$resendKey
        Write-Host "✓ Clé API Resend configurée" -ForegroundColor Green
    } catch {
        Write-Host "✗ Erreur lors de la configuration: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ Clé API Resend non configurée (mode simulation)" -ForegroundColor Yellow
    Write-Host "  La fonction fonctionnera sans envoyer d'emails réels" -ForegroundColor Gray
}

Write-Host ""

# Étape 6: Déploiement de l'Edge Function
Write-Host "[6/7] Déploiement de l'Edge Function..." -ForegroundColor Yellow

try {
    supabase functions deploy send-alert-email
    Write-Host "✓ Fonction déployée avec succès" -ForegroundColor Green

    # Vérifier le déploiement
    Write-Host ""
    Write-Host "  Fonctions déployées:" -ForegroundColor Gray
    supabase functions list
} catch {
    Write-Host "✗ Erreur lors du déploiement: $_" -ForegroundColor Red
}

Write-Host ""

# Étape 7: Migration SQL
Write-Host "[7/7] Migration de la base de données..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Exécutez cette requête SQL dans Supabase Dashboard:" -ForegroundColor White
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
Write-Host "  Configuration terminée!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Exécuter la migration SQL (si pas encore fait)" -ForegroundColor White
Write-Host "2. Se connecter à l'application en tant que manager" -ForegroundColor White
Write-Host "3. Aller dans Paramètres > Alertes Intelligentes" -ForegroundColor White
Write-Host "4. Configurer l'email et activer les alertes" -ForegroundColor White
Write-Host "5. Le système vérifiera automatiquement toutes les heures" -ForegroundColor White
Write-Host ""

Write-Host "Documentation complète:" -ForegroundColor Yellow
Write-Host "  docs/DEPLOIEMENT_ALERTES.md" -ForegroundColor Cyan
Write-Host "  docs/ALERTES.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "Commandes utiles:" -ForegroundColor Yellow
Write-Host "  supabase functions logs send-alert-email --tail" -ForegroundColor Gray
Write-Host "  supabase secrets list" -ForegroundColor Gray
Write-Host "  supabase functions list" -ForegroundColor Gray
Write-Host ""

Pause
