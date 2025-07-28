# PowerShell script to generate PWA icons from company logo
# Run this script from the public folder

$logoPath = "logo.jpg"
$iconsDir = "icons"

# Icon sizes needed for PWA
$sizes = @(16, 32, 72, 96, 128, 144, 152, 192, 384, 512)

Write-Host "Generating PWA icons for Global FinServ..." -ForegroundColor Green

# Check if logo file exists
if (-not (Test-Path $logoPath)) {
    Write-Host "Error: $logoPath not found!" -ForegroundColor Red
    Write-Host "Please ensure logo.jpg is in the public folder" -ForegroundColor Yellow
    exit 1
}

# Create icons directory if it doesn't exist
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir
}

Write-Host "Manual steps required:" -ForegroundColor Yellow
Write-Host "1. Open logo.jpg in an image editor (Paint, GIMP, Photoshop, etc.)" -ForegroundColor White
Write-Host "2. Create square versions in the following sizes:" -ForegroundColor White

foreach ($size in $sizes) {
    Write-Host "   - ${size}x${size} pixels -> save as icons/icon-${size}x${size}.png" -ForegroundColor Cyan
}

Write-Host "3. Create a 32x32 favicon and save as favicon.ico in the public folder" -ForegroundColor White
Write-Host ""
Write-Host "Alternative: Use the icon-generator.html file in your browser for automatic generation" -ForegroundColor Green
Write-Host "Open: http://localhost:4200/icon-generator.html (when serving the app)" -ForegroundColor Cyan

# For future enhancement - if Windows has PowerShell image support
# This would require additional modules like PowerShell Community Extensions
Write-Host ""
Write-Host "Quick online tools you can use:" -ForegroundColor Yellow
Write-Host "- https://realfavicongenerator.net/" -ForegroundColor Cyan
Write-Host "- https://www.favicon-generator.org/" -ForegroundColor Cyan
Write-Host "- https://favicon.io/" -ForegroundColor Cyan
