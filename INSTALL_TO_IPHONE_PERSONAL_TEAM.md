# Install App to Your iPhone (Personal Team - No Metro Needed)

This installs the app to YOUR iPhone only (not friends). No Metro needed - JavaScript is bundled!

## Step 1: Connect Your iPhone

1. Connect your iPhone to your Mac via USB cable
2. **Unlock your iPhone** and **trust this computer** if prompted
3. Make sure your iPhone appears in Xcode's device list

## Step 2: Change Build Configuration to Release

1. In Xcode, go to **Product → Scheme → Edit Scheme...**
2. In the left sidebar, select **"Run"**
3. Click the **"Info"** tab (at the top)
4. Change **"Build Configuration"** from **"Debug"** to **"Release"**
5. Click **"Close"**

**This makes Xcode bundle the JavaScript into the app (no Metro needed!).**

## Step 3: Select Your iPhone

1. In Xcode toolbar (top), click the device selector (next to the Play button)
2. Select **your iPhone** (it should show up as "YourName's iPhone")
3. If you don't see it:
   - Make sure iPhone is unlocked
   - Make sure you trusted the computer
   - Try unplugging and replugging the USB cable

## Step 4: Build and Run

1. In Xcode, click the **Play button** (▶️) or press **Cmd+R**
2. Xcode will:
   - Build the app in Release mode (bundles JavaScript)
   - Install it to your iPhone
   - Launch it automatically

3. On your iPhone:
   - You might see "Untrusted Developer" message
   - Go to **Settings → General → VPN & Device Management**
   - Tap your Apple ID/email
   - Tap **"Trust [Your Email]"**
   - Go back to home screen and open the app

## That's It! ✅

The app is now installed on your iPhone and works **without Metro** - everything is bundled!

---

## Limitations (Personal Team):

- ✅ Works on YOUR iPhone only
- ✅ No Metro needed (Release build bundles JavaScript)
- ✅ Works without computer connection (after install)
- ❌ Can't install to friends' phones (need paid account)
- ❌ Limited to 3 devices
- ❌ App expires after 7 days (need to reinstall)

## To Share with Friends:

You'll need to wait for your paid Developer account to activate, then use TestFlight (much easier than Ad Hoc).

