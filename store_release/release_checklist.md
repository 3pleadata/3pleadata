# 3PLE A — Official Store Release & Submission Checklist

This document provides the exact end-to-end steps to publish **3PLE A** (`com.threepleadata.app`) to the **Google Play Store** and **Apple App Store**.

---

## Part 1: Android (Google Play Console)

### Prerequisites:
- Google Play Developer Account ($25 one-time registration).
- Machine with Java JDK 17+ and Android Studio (or command-line Gradle).

### Build & Signing Steps:
1. **Sync Latest Changes:**
   ```bash
   npm run build
   npx cap sync android
   ```
2. **Generate Production Keystore:**
   ```bash
   ./scripts/generate-keystore.sh
   # Generates: android/app/release.keystore
   ```
   *Store the password and keystore in a safe, version-controlled vault.*
3. **Build the Android App Bundle (.aab):**
   ```bash
   ./scripts/build-android-bundle.sh
   # Or manually:
   cd android && ./gradlew bundleRelease
   ```
   Your signed release bundle will be created at:  
   `android/app/build/outputs/bundle/release/app-release.aab`

### Google Play Console Submission Steps:
1. Log in to [Google Play Console](https://play.google.com/console).
2. Click **Create app** → Title: `3PLE A` → Default language: English (United States) → App or game: App → Free.
3. In **App content** section, complete:
   - **Privacy Policy URL**: Provide `https://threeplea.com.ng/privacy` (or link to in-app Legal page).
   - **Data Safety**: Use the answers specified in `store_release/store_metadata.md`.
   - **App Access**: Provide test credentials (`demo@threeplea.com.ng` / `password123`) for Google Reviewers.
   - **Financial Features**: Check "Personal finance management / banking services / utility payments" and declare partner banking entity.
   - **Target Audience**: 18 and older.
4. In **Store presence** → **Main store listing**:
   - Short description: `Nigeria's all-in-one wallet for instant VTU, DISCO power, flights, and bills.`
   - Full description: Copy from `store_release/store_metadata.md`.
   - App Icon: 512x512 PNG (transparent background or rounded app icon).
   - Feature Graphic: 1024x500 PNG.
   - Screenshots: Phone (at least 2, 1080x1920 or 1080x2400).
5. In **Production** (or **Closed testing**):
   - Create new release → Upload `app-release.aab`.
   - Release name: `1.0.1 (10001)`.
   - Release notes:
     ```text
     - Initial production release of 3PLE A Fintech & Utility Platform.
     - Biometric authentication with Face & Fingerprint unlock.
     - Double-entry verified wallet with instant NGN transfers.
     - Instant VTU, DISCO electricity tokens, WAEC/JAMB exam pins, and flight bookings.
     - Push notification alerts for wallet credits and security.
     ```
6. Click **Review release** → **Start rollout to Production**.

---

## Part 2: iOS (Apple App Store Connect)

### Prerequisites:
- Apple Developer Program Enrollment ($99/year).
- Mac computer with Xcode 15+ installed.

### Build & Signing Steps:
1. **Sync Latest Changes:**
   ```bash
   npm run build
   npx cap sync ios
   ```
2. **Open in Xcode:**
   ```bash
   npx cap open ios
   # Or open ios/App/App.xcworkspace in Xcode
   ```
3. **Configure Signing:**
   - In Xcode, click the **App** project in the left navigator.
   - Select the **App** target → Navigate to **Signing & Capabilities**.
   - Check **Automatically manage signing** and select your **Apple Developer Team**.
   - Ensure Bundle Identifier is set to `com.threepleadata.app`.
4. **Build Archive:**
   - In Xcode menu, select target device: **Any iOS Device (arm64)**.
   - Click **Product** → **Archive**.
   - When archive finishes, the Organizer window opens automatically.
   - Click **Distribute App** → Select **App Store Connect** → Upload.

### App Store Connect Submission Steps:
1. Log in to [App Store Connect](https://appstoreconnect.apple.com).
2. Go to **My Apps** → Click **+** (New App).
   - Platforms: iOS
   - Name: `3PLE A: Fintech & Utility Hub`
   - Primary Language: English
   - Bundle ID: `com.threepleadata.app`
   - SKU: `3PLEA-FINTECH-01`
3. Under **App Information**:
   - Primary Category: Finance
   - Secondary Category: Utilities
4. Under **Pricing and Availability**: Set to **Free**.
5. Under **App Privacy**: Complete nutrition labels as outlined in `store_release/store_metadata.md`.
6. Under **Version 1.0.1**:
   - Add iPhone 6.7" and 6.5" screenshots.
   - Promotional Text & Description: Copy from `store_release/store_metadata.md`.
   - Keywords: `fintech,vtu,data,airtime,electricity,kedco,bills,flights,nigeria,kano,wallet,waec,pos,retailer`
   - Support URL: `https://threeplea.com.ng/support`
   - Marketing URL: `https://threeplea.com.ng`
   - App Review Information: Provide demo account login for Apple Reviewer:
     - Username: `demo@threeplea.com.ng`
     - Password: `AppleReview2026!`
     - Biometric Note: Explain that Face ID is supported via LocalAuthentication framework fallback.
     - Account Deletion Note: Explain that users can self-delete their account at any time via Settings > Legal & Security in compliance with Guideline 5.1.1(v).
7. Select the uploaded Build from Xcode Organizer.
8. Click **Submit for Review**.
