# 🖥️ WINDOWS to iPhone Distribution - AltStore Method
# Complete guide for Windows users with ZERO iOS knowledge

Write-Host "� Windows → iPhone App DistributiWrite-Host ""
Write-Host "🎯 AltStore Method Summary:" -ForegroundColor Cyan
Write-Host "✅ Cost: FREE (Rs.0)" -ForegroundColor Green
Write-Host "✅ Customers: Up to unlimited" -ForegroundColor Green
Write-Host "✅ No Mac needed" -ForegroundColor Green
Write-Host "✅ Auto-renewal (no 7-day expiry)" -ForegroundColor Green
Write-Host "✅ Professional app experience" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Perfect for your 5 customers!" -ForegroundColor GreengroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "Perfect for Windows users + 5 customers + FREE!" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 What we'll do:" -ForegroundColor Yellow
Write-Host "1. Build your Angular app" -ForegroundColor White
Write-Host "2. Prepare iOS files" -ForegroundColor White
Write-Host "3. Get .ipa file (multiple options)" -ForegroundColor White
Write-Host "4. Help customers install via AltStore" -ForegroundColor White
Write-Host ""

$step = Read-Host "Choose: [1] Build app [2] Get .ipa file [3] Customer instructions [4] All steps"

function Build-App {
    Write-Host "🔨 Building your Global Financial Services app..." -ForegroundColor Green
    
    # Build Angular
    Write-Host "� Building Angular application..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Angular build successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed. Check errors above." -ForegroundColor Red
        return
    }
    
    # Sync Capacitor
    Write-Host "📱 Syncing to iOS..." -ForegroundColor Yellow
    npx cap sync ios
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ iOS sync successful!" -ForegroundColor Green
        Write-Host "✅ Files ready in 'ios' folder" -ForegroundColor Green
    } else {
        Write-Host "❌ iOS sync failed." -ForegroundColor Red
        return
    }
    
    Write-Host ""
    Write-Host "🎉 Your app is ready for iOS!" -ForegroundColor Green
    Write-Host "📁 iOS project files are in: ios/" -ForegroundColor Cyan
}

function Get-IPA {
    Write-Host "📦 Getting .ipa file for AltStore distribution..." -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🔄 Choose your method:" -ForegroundColor Yellow
    Write-Host "1. GitHub Actions (Automated & Free)" -ForegroundColor Green
    Write-Host "2. Online IPA Builder (Quick)" -ForegroundColor Green
    Write-Host "3. Freelancer Service ($5-10)" -ForegroundColor Green
    Write-Host ""
    
    $method = Read-Host "Select method [1-3]"
    
    switch ($method) {
        "1" {
            Write-Host "🤖 GitHub Actions Setup:" -ForegroundColor Green
            Write-Host "✅ Workflow file created: .github/workflows/build-ios.yml" -ForegroundColor White
            Write-Host ""
            Write-Host "📋 Next steps:" -ForegroundColor Cyan
            Write-Host "1. Push your code to GitHub:" -ForegroundColor White
            Write-Host "   git add ." -ForegroundColor Gray
            Write-Host "   git commit -m 'iOS app ready'" -ForegroundColor Gray
            Write-Host "   git push" -ForegroundColor Gray
            Write-Host ""
            Write-Host "2. Go to GitHub → Actions tab" -ForegroundColor White
            Write-Host "3. Run 'Build iOS App' workflow" -ForegroundColor White
            Write-Host "4. Download .ipa from artifacts" -ForegroundColor White
        }
        
        "2" {
            Write-Host "🌐 Online IPA Builder:" -ForegroundColor Green
            Write-Host "1. Zip your 'ios' folder:" -ForegroundColor White
            Compress-Archive -Path "ios" -DestinationPath "GlobalFinServ-iOS.zip" -Force
            Write-Host "✅ Created: GlobalFinServ-iOS.zip" -ForegroundColor Green
            Write-Host ""
            Write-Host "2. Upload to online builder:" -ForegroundColor White
            Write-Host "   • https://www.iosappinstaller.com/" -ForegroundColor Gray
            Write-Host "   • https://builds.io/" -ForegroundColor Gray
            Write-Host "   • https://codemagic.io/" -ForegroundColor Gray
            Write-Host ""
            Write-Host "3. Download the .ipa file they provide" -ForegroundColor White
        }
        
        "3" {
            Write-Host "👨‍💻 Freelancer Service:" -ForegroundColor Green
            Write-Host "1. Zip your project:" -ForegroundColor White
            Compress-Archive -Path "." -DestinationPath "GlobalFinServ-Full.zip" -Force
            Write-Host "✅ Created: GlobalFinServ-Full.zip" -ForegroundColor Green
            Write-Host ""
            Write-Host "2. Post on Fiverr/Upwork:" -ForegroundColor White
            Write-Host '   "Build .ipa from Capacitor iOS project"' -ForegroundColor Gray
            Write-Host "3. Send them the zip file" -ForegroundColor White
            Write-Host "4. Get .ipa file back (cost: $5-10)" -ForegroundColor White
        }
    }
}

function Customer-Instructions {
    Write-Host "📱 Customer Installation Guide:" -ForegroundColor Green
    Write-Host ""
    
    # Create customer instruction file
    $instructions = @"
🍎 Global Financial Services iPhone App

Hi! Your exclusive invoice app is ready. Here's how to install:

📲 STEP 1: Install AltStore (5 minutes)
1. On your iPhone, go to: https://altstore.io
2. Follow their installation guide
3. Trust the certificate in Settings

📱 STEP 2: Install Our App (2 minutes)
1. I'll send you an .ipa file
2. Open AltStore app on your iPhone
3. Tap "+" button → "Install .ipa"
4. Select our file → Install
5. Trust our app in Settings

✅ DONE! App appears on your home screen

🚀 Features:
• Create professional invoices
• Share directly to WhatsApp with PDF
• Manage customers & payments
• Works offline

📞 Need help? Call: [YOUR PHONE]
"@
    
    $instructions | Out-File -FilePath "Customer-Installation-Guide.txt" -Encoding UTF8
    Write-Host "✅ Created: Customer-Installation-Guide.txt" -ForegroundColor Green
    Write-Host ""
    Write-Host "� Send this to customers along with .ipa file:" -ForegroundColor Cyan
    Write-Host $instructions -ForegroundColor White
    Write-Host ""
    Write-Host "📱 Distribution methods:" -ForegroundColor Yellow
    Write-Host "• WhatsApp: Send .ipa + instructions" -ForegroundColor White
    Write-Host "• Email: Attach both files" -ForegroundColor White
    Write-Host "• Google Drive: Share download link" -ForegroundColor White
}

switch ($step) {
    "1" { Build-App }
    "2" { Get-IPA }
    "3" { Customer-Instructions }
    "4" { 
        Build-App
        Write-Host "`n" -NoNewline
        Get-IPA
        Write-Host "`n" -NoNewline
        Customer-Instructions
    }
    default { Write-Host "❌ Invalid option" -ForegroundColor Red }
}

Write-Host ""
Write-Host "🎯 AltStore Method Summary:" -ForegroundColor Cyan
Write-Host "✅ Cost: FREE (₹0)" -ForegroundColor Green
Write-Host "✅ Customers: Up to unlimited" -ForegroundColor Green
Write-Host "✅ No Mac needed" -ForegroundColor Green
Write-Host "✅ Auto-renewal (no 7-day expiry)" -ForegroundColor Green
Write-Host "✅ Professional app experience" -ForegroundColor Green
Write-Host ""
Write-Host "� Perfect for your 5 customers!" -ForegroundColor Green
