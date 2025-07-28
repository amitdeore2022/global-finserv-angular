# iOS Development Script for Global Financial Services (PowerShell)

Write-Host "🍎 iOS Development Build Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Build Angular app
Write-Host "📦 Building Angular application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Angular build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Angular build failed" -ForegroundColor Red
    exit 1
}

# Sync to iOS
Write-Host "🔄 Syncing to iOS platform..." -ForegroundColor Yellow
npx cap sync ios

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ iOS sync successful" -ForegroundColor Green
} else {
    Write-Host "❌ iOS sync failed" -ForegroundColor Red
    exit 1
}

# Note for opening Xcode (Mac only)
Write-Host "ℹ️  To open in Xcode (Mac only): npx cap open ios" -ForegroundColor Blue

Write-Host ""
Write-Host "🎉 iOS build complete!" -ForegroundColor Green
Write-Host "📱 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Transfer project to Mac with Xcode" -ForegroundColor White
Write-Host "   2. Build and archive in Xcode" -ForegroundColor White
Write-Host "   3. Export for Ad Hoc/TestFlight distribution" -ForegroundColor White
Write-Host "   4. Share with customers" -ForegroundColor White
