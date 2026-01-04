# Icon Update Notes

To update all app icons with the new "17" digital segmented display design, replace the following image files:

## Required Icon Files to Replace:

1. **`assets/images/icon.png`** - Main app icon (1024x1024px recommended)
   - Used for: iOS app icon, Android app icon, LoginScreen logo

2. **`assets/images/splash-icon.png`** - Splash screen icon (200px width, will be scaled)
   - Used for: App splash screen on first launch
   - Configured in `app.json` under `expo-splash-screen` plugin

3. **`assets/images/favicon.png`** - Web favicon
   - Used for: Web version of the app

## Android Icons (if needed):

- `assets/images/android-icon-foreground.png`
- `assets/images/android-icon-background.png`  
- `assets/images/android-icon-monochrome.png`

## Icon Specifications:

- **Format**: PNG with transparency
- **Main Icon**: Square (1:1 aspect ratio)
- **Background**: Transparent or match app theme
- **Design**: Digital segmented display showing "17" (as shown in reference image)
- **Colors**: White segments on dark background (or adapt for light mode)

## After Replacing:

1. Rebuild the app in Xcode (Clean + Build)
2. The new icons will appear:
   - On the login screen (icon.png)
   - As the app icon on home screen
   - On the splash screen when app launches
   - In app store listings (when published)

