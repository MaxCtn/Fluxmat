# Script de vérification du fichier .env.local
# Ce script vérifie que le fichier existe et que les variables sont bien formatées

$envFile = ".env.local"
$projectRoot = Get-Location

Write-Host "`n=== Vérification de la configuration .env.local ===" -ForegroundColor Cyan
Write-Host "Répertoire: $projectRoot`n" -ForegroundColor Gray

if (-not (Test-Path $envFile)) {
    Write-Host "❌ ERREUR: Le fichier .env.local n'existe pas!" -ForegroundColor Red
    Write-Host "   Créez-le à la racine du projet avec:" -ForegroundColor Yellow
    Write-Host "   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co" -ForegroundColor White
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY=votre-cle" -ForegroundColor White
    exit 1
}

Write-Host "✅ Fichier .env.local trouvé`n" -ForegroundColor Green

$content = Get-Content $envFile -Raw
$lines = Get-Content $envFile

Write-Host "Contenu du fichier:" -ForegroundColor Cyan
foreach ($line in $lines) {
    if ($line -match '^[^#]') { # Ignorer les commentaires
        if ($line -match '^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)') {
            $varName = ($line -split '=')[0]
            $varValue = ($line -split '=', 2)[1]
            if ($varValue -match '^\s*["\']|["\']\s*$') {
                Write-Host "   ⚠️  $varName a des guillemets (à retirer)" -ForegroundColor Yellow
            }
            if ($varName -match '\s+=\s+' -or $varName -match '=\s+') {
                Write-Host "   ⚠️  $varName a des espaces autour du = (à corriger)" -ForegroundColor Yellow
            }
            $displayValue = if ($varValue.Length -gt 50) { $varValue.Substring(0, 50) + "..." } else { $varValue }
            Write-Host "   $varName = $displayValue" -ForegroundColor Gray
        } elseif ($line.Trim() -ne '' -and -not ($line -match '^\s*#')) {
            Write-Host "   ⚠️  Ligne non reconnue: $line" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n=== Vérification détaillée ===" -ForegroundColor Cyan

$hasUrl = $false
$hasKey = $false
$urlValid = $false
$keyValid = $false

foreach ($line in $lines) {
    if ($line -match '^NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)$') {
        $hasUrl = $true
        $value = $matches[1].Trim().Trim('"').Trim("'")
        $urlValid = $value.Length -gt 0 -and $value -match '^https://.*\.supabase\.co'
        if ($urlValid) {
            Write-Host "✅ NEXT_PUBLIC_SUPABASE_URL: Format valide" -ForegroundColor Green
        } else {
            Write-Host "❌ NEXT_PUBLIC_SUPABASE_URL: Format invalide ou vide" -ForegroundColor Red
            Write-Host "   Doit commencer par https:// et contenir .supabase.co" -ForegroundColor Yellow
        }
    }
    if ($line -match '^SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)$') {
        $hasKey = $true
        $value = $matches[1].Trim().Trim('"').Trim("'")
        $keyValid = $value.Length -gt 0
        if ($keyValid) {
            Write-Host "✅ SUPABASE_SERVICE_ROLE_KEY: Présente (longueur: $($value.Length))" -ForegroundColor Green
        } else {
            Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY: Vide ou absente" -ForegroundColor Red
        }
    }
}

if (-not $hasUrl) {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_URL: Variable absente" -ForegroundColor Red
}
if (-not $hasKey) {
    Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY: Variable absente" -ForegroundColor Red
}

Write-Host "`n=== Résumé ===" -ForegroundColor Cyan
if ($hasUrl -and $hasKey -and $urlValid -and $keyValid) {
    Write-Host "✅ Configuration correcte!" -ForegroundColor Green
    Write-Host "   Assurez-vous d'avoir redémarré le serveur Next.js après la création du fichier." -ForegroundColor Yellow
    Write-Host "   Redémarrez avec: npm run dev (ou pnpm dev)" -ForegroundColor Yellow
} else {
    Write-Host "❌ Configuration incomplète ou incorrecte" -ForegroundColor Red
    Write-Host "   Corrigez les erreurs ci-dessus et redémarrez le serveur." -ForegroundColor Yellow
}

Write-Host ""

