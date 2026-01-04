# Building 17 WEEKS for iOS

## Prerequisites

1. **macOS** with Xcode installed (download from App Store)
2. **Apple Developer Account** (free or paid)
3. **Node.js** installed on your Mac

## Quick Start (One-Click Setup)

1. Download/clone this project to your Mac
2. Open Terminal
3. Drag and drop `ios_setup.sh` into Terminal and press Enter
4. Wait for the script to complete and Xcode to open

## In Xcode

1. **Select your Development Team:**
   - Click on the project in the left sidebar (the blue icon at the top)
   - Select the "17WEEKS" target
   - Go to "Signing & Capabilities" tab
   - Under "Signing", select your Team from the dropdown

2. **Connect your iPhone:**
   - Plug in your iPhone via USB cable
   - Trust the computer on your iPhone if prompted
   - Select your iPhone from the device dropdown at the top of Xcode

3. **Build and Run:**
   - Click the Play button (or press Cmd+R)
   - Wait for the build to complete
   - The app will install and launch on your iPhone

## Troubleshooting

### "Untrusted Developer" error on iPhone
- Go to Settings > General > VPN & Device Management
- Tap your developer certificate and select "Trust"

### CocoaPods issues
If you get pod-related errors, try:
```bash
cd ios
arch -x86_64 pod install --repo-update
```

### Build fails with signing errors
- Make sure you're signed into Xcode with your Apple ID
- Xcode > Settings > Accounts > Add your Apple ID
- Select a valid development team in project settings

## App Configuration

- **Bundle ID:** com.seventeenweeks.dev
- **App Name:** 17 WEEKS
- **Minimum iOS:** 15.1

## Notes

- The app requires camera access for progress photos and barcode scanning
- Photo library access is needed for selecting existing photos
- Data is stored locally on the device and synced with the server when online
