# Distribution

CADYomi can be distributed as a Windows desktop application or an Android application. Both packages keep STEP processing local in the app; the web UI and OCCT WASM bundle are packaged with the application.

## Windows

Prerequisites:

- Node.js and npm
- Windows build tools supported by Electron Builder

Build the web assets and Windows installer:

```sh
npm run build:desktop
```

The installer is written to `release/`. The package uses Electron with:

- `contextIsolation: true`
- `nodeIntegration: false`
- a sandboxed renderer
- local `dist/` content only

The current environment may fail during Electron Builder's Windows directory rename with `EPERM`. This is usually an OS file-lock or security-software issue. Close Explorer windows and CADYomi processes, remove the incomplete `release/` directory, and retry from a normal writable workspace.

## Android

The Capacitor Android project is generated with:

```sh
npm run android:add
```

Sync web assets and build an APK/AAB with:

```sh
npm run android:build
```

Open the native Android project in Android Studio with:

```sh
npm run android:open
```

Required local tools:

- JDK and `JAVA_HOME`
- Android SDK and `ANDROID_HOME` or `ANDROID_SDK_ROOT`
- Android SDK Platform and Build Tools
- Gradle support provided by the generated Capacitor project or Android Studio

The Android platform directory is generated from the same `dist/` output. A debug APK can be installed on a connected device with `adb install` after building. A release APK/AAB must be signed before distributing to other users.

### GitHub Actions artifacts

The workflow at `.github/workflows/android.yml` runs on pushes to `main`, pull
requests, and manual dispatch. It performs the web build, Capacitor sync,
Android unit tests, debug APK build, APK artifact upload, and Android emulator
instrumentation tests.

Download the artifact named `cadyomi-android-debug-<commit>` from a completed
workflow run. It is a debug APK for testing, not a production-signed release.

## Sharing builds

- Windows: share the signed installer from `release/`.
- Android testing: share a signed APK directly or use an internal testing track.
- Android production: upload a signed AAB to Google Play Console.

Do not distribute the restricted local STEP fixtures with these packages. Users should select their own local STEP files.
