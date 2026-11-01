# 3PLE A

3PLE A is a React and TypeScript application for wallet, bill-payment, travel, retail, and support workflows. The same Vite web client is packaged for iOS and Android with Capacitor.

## Requirements

- Node.js 22 or newer and npm
- Android development: Android Studio, a JDK, and the Android SDK
- iOS development and signing: macOS with Xcode

## Web

```sh
npm install
npm run dev
```

The development server serves the Vite client and Express API at `http://localhost:3000`. Run `npm run build` to create the production web assets in `dist`.

## Native apps

The iOS and Android project scaffolding is committed in this repository. Set `VITE_API_BASE_URL` to the deployed API base URL, including `/api/v1`, before building the native client. For example, use a local `.env.production` file containing `VITE_API_BASE_URL=https://api.example.com/api/v1`. The API must be reachable over HTTPS and allow the native Capacitor origins (`capacitor://localhost` on iOS and `https://localhost` on Android).

Install dependencies, generate the app icon/splash screen, and build and synchronize the shared client:

```sh
npm install
npm run cap:assets
npm run build:native
```

```sh
npm run cap:open:android
npm run cap:open:ios
```

Use `npm run cap:add` only when adding the native projects to a fresh checkout that does not contain `android/` and `ios/`. The app icon and splash screen are generated from `assets/logo.svg`. Open the generated project in Android Studio or Xcode to run on a simulator/device, build, and sign it. iOS builds cannot be produced on Windows. The configured bundle identifier (`com.threepleadata.app`) should be checked against the organization's final app-store identity before publishing.

## Current product limitations

The repository is a product prototype: app state is stored in browser storage, provider/payment flows use simulated responses, and the sample Express API is not a production financial backend. Native packaging does not make wallet balances, authentication, payment processing, or provider integrations production-ready. Configure and deploy a secured production API before using real accounts or money. The optional Gemini server features require `GEMINI_API_KEY`.
