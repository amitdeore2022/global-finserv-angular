#!/bin/bash
# iOS Development Script for Global Financial Services

echo "🍎 iOS Development Build Script"
echo "================================"

# Build Angular app
echo "📦 Building Angular application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Angular build successful"
else
    echo "❌ Angular build failed"
    exit 1
fi

# Sync to iOS
echo "🔄 Syncing to iOS platform..."
npx cap sync ios

if [ $? -eq 0 ]; then
    echo "✅ iOS sync successful"
else
    echo "❌ iOS sync failed"
    exit 1
fi

# Open Xcode (if on Mac)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🚀 Opening Xcode..."
    npx cap open ios
else
    echo "ℹ️  To open in Xcode (Mac only): npx cap open ios"
fi

echo ""
echo "🎉 iOS build complete!"
echo "📱 Next steps:"
echo "   1. Build and archive in Xcode"
echo "   2. Export for Ad Hoc/TestFlight distribution"
echo "   3. Share with customers"
