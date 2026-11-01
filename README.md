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

## Standalone admin portal

The administrator portal is a separate web build in `admin/`; it does not use the consumer app's locally seeded state or simulated biometric gate. Build it with `npm run build:admin`; the independently deployable static assets are written to `dist-admin`. Configure the static host to serve `admin/index.html` for the portal root and `/login`. Set `VITE_ADMIN_API_BASE_URL` to the Express API base (including `/api/v1`) when the API is on a different origin; configure the API's `ADMIN_APP_ORIGIN` and credentialed CORS for that exact frontend origin.

For local development, run `npm run dev` for the API and `npm run dev:admin` for the separate admin frontend. Set `VITE_ADMIN_API_BASE_URL=http://localhost:3000/api/v1` and `ADMIN_APP_ORIGIN=http://localhost:5173` in the local environment so the frontend calls the API with credentialed CORS.

The portal's read-only overview uses PostgreSQL-backed records and an OIDC authorization-code flow with PKCE. Configure the `ADMIN_*` values in `.env.example` in the API environment, register `ADMIN_OIDC_REDIRECT_URI` with the identity provider, and make sure its ID token includes the configured roles claim with `administrator` or `super_admin` and a verified email. Use HTTPS in production; only set `ADMIN_SESSION_COOKIE_SAME_SITE=none` when the portal and API are cross-site. If TLS terminates at a reverse proxy, set `TRUST_PROXY_HOPS` to the exact trusted proxy count so secure session cookies work. Generate a unique `ADMIN_SESSION_SECRET` (at least 32 bytes) and keep it, the database URL, and OIDC secrets in a secrets manager.

After provisioning the PostgreSQL database and configuring `ADMIN_DATABASE_URL`, apply the schema with `npm run migrate:admin`. The overview remains empty until the production user, transaction, and provider services populate the `admin_dashboard_*` tables; the sample consumer API does not feed or authenticate this admin data.

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
