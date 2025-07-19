# PWA Icon Fix for Global FinServ

## Problem
The PWA (Progressive Web App) shortcut is currently showing the Angular logo instead of the Global FinServ company logo.

## Solution

### Method 1: Use the Icon Generator (Recommended)
1. Open the icon generator: `public/icon-generator.html` (now opened in Simple Browser)
2. Upload your company logo (`src/assets/logo.jpg`)
3. Click "Generate Icons"
4. Download all generated icon files
5. Replace the existing files in `public/icons/` folder
6. Replace `public/favicon.ico` with the generated favicon

### Method 2: Manual Creation
1. Use an online favicon/PWA icon generator:
   - https://realfavicongenerator.net/ (Recommended)
   - https://www.favicon-generator.org/
   - https://favicon.io/

2. Upload `src/assets/logo.jpg` to the generator
3. Download the generated icon pack
4. Replace the following files in `public/icons/`:
   - icon-16x16.png
   - icon-32x32.png
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

5. Replace `public/favicon.ico` with the new favicon

### Method 3: Using Image Editor
1. Open `src/assets/logo.jpg` in your preferred image editor
2. Create square versions (maintain aspect ratio with white padding):
   - 16×16, 32×32, 72×72, 96×96, 128×128, 144×144, 152×152, 192×192, 384×384, 512×512
3. Save as PNG files with names: `icon-{size}x{size}.png`
4. Place in `public/icons/` folder
5. Create a 32×32 favicon.ico for the main favicon

## Files Updated
- ✅ `src/index.html` - Added proper PWA meta tags and icon references
- ✅ `public/manifest.webmanifest` - Already configured with correct icon paths
- ✅ Created `public/icon-generator.html` - Automatic icon generator tool
- ✅ Created `public/generate-icons.ps1` - PowerShell helper script

## After Replacing Icons
1. Build the application: `npm run build`
2. Deploy: `firebase deploy --only hosting`
3. Clear browser cache and test the PWA install
4. The shortcut should now show your company logo

## Testing
1. Open the deployed app: https://global-finserve.web.app
2. Install as PWA (Add to Home Screen on mobile, Install App on desktop)
3. Check that the shortcut/app icon shows the Global FinServ logo instead of Angular logo

## Current Status
- ✅ PWA manifest configured correctly
- ✅ HTML meta tags updated for better PWA support
- ✅ Icon generator tool created
- 🔄 Icons need to be replaced with company logo (manual step required)
- 🔄 Favicon needs to be updated

## Next Steps
1. Use one of the methods above to generate proper icons
2. Replace the icon files
3. Build and deploy the application
4. Test PWA installation
