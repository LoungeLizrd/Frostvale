# Building the iOS & Android apps

Frostvale is wrapped into native iOS and Android apps with [Capacitor](https://capacitorjs.com). The game itself is `www/index.html`, the same file that GitHub Pages serves. All commands below run from the repository root.

## What's already done

- **Native saves.** On a phone, the game saves through Capacitor Preferences: UserDefaults on iOS and SharedPreferences on Android. The operating system won't clear these to free up space, and they're included in normal device backups. A second backup save is written once per in-game day. If the main save is ever damaged, the game loads that backup.
- **App lifecycle.** The game saves whenever the app goes to the background or a call comes in.
- **Android back button.** It closes the open panel (shop, quests, menu). When nothing is open, it saves and minimizes the app.
- **Status bar and notch.** The status bar is hidden, and safe areas are respected.
- **First-day tutorial.** New players get a 9-step guided tutorial. They can skip it, and it can be replayed from Menu → Save.
- **Icon and splash art** are in `assets/` and get turned into every required size by one command.

## What you need

| | iOS | Android |
|---|---|---|
| Computer | A Mac | Mac, Windows or Linux |
| Tools | Xcode 26+ (from the Mac App Store) and CocoaPods if Xcode asks | Android Studio (latest) |
| Account | Apple Developer Program, $99 USD a year | Google Play Console, $25 USD one time |
| Both | Node.js 22 or newer | |

## First-time setup

Open a terminal in the repository folder and run:

```bash
npm install
npx cap add android
npx cap add ios          # Mac only
npm run assets           # makes every icon and splash size from assets/
npx cap sync
```

## Run it on a phone

```bash
npm run android   # opens Android Studio → press ▶ with your phone plugged in
npm run ios       # opens Xcode → pick your iPhone → press ▶
```

On iOS, the first time you run it, choose your team in Xcode under **Signing & Capabilities**.

## When you update the game

Edit `www/index.html`, then run `npx cap sync`. Before each store upload, raise the version number:

- **iOS:** in Xcode, App target → General → Version / Build.
- **Android:** in `android/app/build.gradle`, `versionCode` (must go up by 1 every upload) and `versionName`.

## Before you submit

1. **App ID.** It's set to `com.frostvale.game` in `capacitor.config.json`. Change it to something you own, such as `com.yourname.frostvale`, before running `cap add`. It can never change after your first store upload.
2. **Lock orientation (optional).** The game supports landscape. If you'd rather lock it to portrait:
   - iOS: Xcode → General → Deployment Info, untick the landscape boxes.
   - Android: add `android:screenOrientation="portrait"` to the activity in `AndroidManifest.xml`.
3. **Privacy policy.** Fill in the date and contact email in `www/privacy.html`. Once GitHub Pages is on, it's live at `https://<your-username>.github.io/<repo-name>/privacy.html`, and that's the link both stores ask for. On both stores, declare **no data collected**.
4. **Age rating.** Fill in the questionnaires. The game has no violence, purchases or chat, so it should come out as 4+ / Everyone.
5. **Screenshots.** Take them from the simulators and emulators:
   - iPhone 6.9" (1320×2868) is required. Add iPad 13" only if you leave iPad support on.
   - Android needs at least 2 phone screenshots.
   - Google Play also needs a feature graphic (1024×500).
6. **Android signing.** In Android Studio, use Build → Generate Signed App Bundle. Back up the keystore file and its password somewhere safe; if you lose them, you can't update the app.
7. **Google Play testing rule.** New personal developer accounts must run a closed test with at least 12 testers for 14 days before going to production. Check the current rule in Play Console.
8. **Apple review.** Upload through Xcode (Product → Archive → Distribute), test with TestFlight, then submit for review.

## Brand note

The hockey team is "the Wolves", with blue and grey colours and an original wolf emblem. Keep it that way: don't use "Sudbury", OHL marks or the real team's logo in the game or its store listing.
