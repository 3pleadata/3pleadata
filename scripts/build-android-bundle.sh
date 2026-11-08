#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "   3PLE A FinTech - Google Play App Bundle (.aab) Build   "
echo "=========================================================="

echo "Step 1: Building Web Assets with Vite..."
npm run build

echo "Step 2: Syncing Capacitor Android Project..."
npx cap sync android

echo "Step 3: Checking Android Build Environment..."
if [ -d "android" ]; then
  cd android
  if [ -f "./gradlew" ] && command -v java &> /dev/null; then
    chmod +x ./gradlew
    echo "Running Gradle release bundle build..."
    ./gradlew bundleRelease --stacktrace
    echo "Build Complete! Android App Bundle (.aab) generated at:"
    echo "android/app/build/outputs/bundle/release/app-release.aab"
  else
    echo "[ENVIRONMENT NOTE]"
    echo "The cloud development container does not have the native Android SDK or Java JDK installed."
    echo "All Android Gradle files, manifests, and web assets are fully prepared in '/android'."
    echo ""
    echo "To build your signed .aab on your local machine or CI/CD runner:"
    echo "  1. Clone this repository onto a machine with Android Studio / JDK 17+."
    echo "  2. Run: npm install"
    echo "  3. Run: npm run build"
    echo "  4. Run: npx cap sync android"
    echo "  5. cd android && ./gradlew bundleRelease"
    echo "  6. Your signed AAB will be in android/app/build/outputs/bundle/release/app-release.aab ready for Google Play Console upload."
  fi
  cd ..
fi
