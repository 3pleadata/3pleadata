#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "   3PLE A FinTech - Apple App Store Archive & IPA Build   "
echo "=========================================================="

echo "Step 1: Building Web Assets with Vite..."
npm run build

echo "Step 2: Syncing Capacitor iOS Project..."
npx cap sync ios

echo "Step 3: Checking Apple Xcode Environment..."
if command -v xcodebuild &> /dev/null; then
  echo "Xcode found. Archiving App..."
  cd ios/App
  xcodebuild -workspace App.xcworkspace \
             -scheme App \
             -configuration Release \
             -archivePath build/App.xcarchive \
             archive
  echo "Xcode Archive complete at ios/App/build/App.xcarchive"
  echo "Use 'xcodebuild -exportArchive' or Xcode Organizer to upload to TestFlight / App Store Connect."
  cd ../..
else
  echo "[ENVIRONMENT NOTE]"
  echo "The cloud container runs Linux x86_64, whereas Apple iOS builds require macOS with Xcode."
  echo "All iOS configurations, entitlements, privacy permissions, and assets are fully configured in '/ios'."
  echo ""
  echo "To build your signed iOS app and IPA on a Mac or GitHub Actions macOS runner:"
  echo "  1. Clone this repository on macOS."
  echo "  2. Run: npm install"
  echo "  3. Run: npm run build && npx cap sync ios"
  echo "  4. Open in Xcode: npx cap open ios (or open ios/App/App.xcworkspace)"
  echo "  5. In Xcode: Select your Apple Developer Team under 'Signing & Capabilities'."
  echo "  6. Product -> Archive -> Distribute App -> TestFlight / App Store Connect."
fi
