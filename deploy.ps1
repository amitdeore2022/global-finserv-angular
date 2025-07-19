# Global Financial Services - Build and Deploy Script
# This script builds the Angular app, deploys to Firebase, and commits changes to git

Write-Host "=== Global Financial Services - Build & Deploy Script ===" -ForegroundColor Cyan
Write-Host "Starting build and deployment process..." -ForegroundColor Green
Write-Host ""

# Function to check if last command was successful
function Test-LastCommand {
    param($Message)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ $Message failed!" -ForegroundColor Red
        Write-Host "Exiting script due to error." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✅ $Message completed successfully!" -ForegroundColor Green
        Write-Host ""
    }
}

# Step 1: Development Build
Write-Host "📦 Step 1: Building Angular app (development)..." -ForegroundColor Yellow
ng build
Test-LastCommand "Development build"

# Step 2: Production Build
Write-Host "🚀 Step 2: Building Angular app (production)..." -ForegroundColor Yellow
ng build --configuration production
Test-LastCommand "Production build"

# Step 3: Firebase Deploy
Write-Host "☁️ Step 3: Deploying to Firebase hosting..." -ForegroundColor Yellow
firebase deploy --only hosting
Test-LastCommand "Firebase deployment"

# Step 4: Git Operations
Write-Host "📝 Step 4: Committing changes to git..." -ForegroundColor Yellow

# Check if there are any changes to commit
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Changes detected. Adding all files to git..." -ForegroundColor Cyan
    git add .
    Test-LastCommand "Git add"
    
    # Get current date and time for commit message
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "Deploy: Build and deploy completed successfully - $timestamp"
    
    Write-Host "Committing with message: $commitMessage" -ForegroundColor Cyan
    git commit -m "$commitMessage"
    Test-LastCommand "Git commit"
    
    Write-Host "Pushing changes to remote repository..." -ForegroundColor Cyan
    git push
    Test-LastCommand "Git push"
} else {
    Write-Host "No changes detected in git. Skipping commit." -ForegroundColor Yellow
}

# Success message
Write-Host ""
Write-Host "🎉 SUCCESS! All operations completed successfully!" -ForegroundColor Green
Write-Host "✅ Development build completed" -ForegroundColor Green
Write-Host "✅ Production build completed" -ForegroundColor Green
Write-Host "✅ Firebase deployment completed" -ForegroundColor Green
Write-Host "✅ Git operations completed" -ForegroundColor Green
Write-Host ""
Write-Host "Your application has been successfully built, deployed, and committed to git!" -ForegroundColor Cyan
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
