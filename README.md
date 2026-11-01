# 3PLE A

3PLE A is a responsive React web app that can also be packaged as native iOS
and Android apps with Capacitor.

## Web

Install dependencies with `bun install` or `npm install`. Start the local
development server with `npm run dev`, create a production web build with
`npm run build`, and serve that build locally with `npm run preview`.

## iOS and Android

Capacitor packages the same web app for both native platforms. Install the
platform's development tools before building it: Android Studio and the Android
SDK for Android, or macOS with Xcode for iOS. iOS apps cannot be built or
signed on Windows.

The packaged app contains the web client, not the Node server in `server.ts`.
Any `/api/v1` calls used by the client require a separately deployed API
configured for the app before release.

Add each native project once:

```sh
npm run cap:add:android
npm run cap:add:ios
```

After changing the web app, rebuild it and copy the updated assets into the
native projects:

```sh
npm run build
npm run cap:sync
```

Open a project in its native IDE with `npm run cap:open:android` or
`npm run cap:open:ios`. You can also run it on a connected device or simulator
using `npx cap run android` or `npx cap run ios`.

The native projects use the configured application ID `com.threepleadata.app`.
Update `capacitor.config.ts` before publishing if your organization uses a
different application identifier. Store-specific signing, provisioning, and
release setup must be completed in the platform's native tools.
