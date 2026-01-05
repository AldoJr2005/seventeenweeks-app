# Ad Hoc Distribution - Quick Start Guide

## Step 1: Collect UDIDs from Friends

**For each friend with an iPhone:**

1. Open **Settings** on their iPhone
2. Go to **General** → **About**
3. Scroll down and find **"Identifier"** (or **"UDID"**)
4. **Long press** on the Identifier → **Copy**
5. Send it to you (text, email, etc.)

**Note:** If "Identifier" is not visible:
- Connect iPhone to Mac
- Open **Finder** → Select iPhone
- Click on "Serial Number" (it changes to UDID)
- Copy it

**You'll need one UDID per friend's iPhone.**

---

## Step 2: Add Devices in Apple Developer Portal

1. Go to: https://developer.apple.com/account/resources/devices/list
2. **Sign in** with your Apple ID (same one you use in Xcode)
3. Click the **"+"** button (top left)
4. For each friend's iPhone:
   - **Name:** Enter friend's name (e.g., "John's iPhone")
   - **UDID:** Paste the UDID they sent you
   - **Platform:** Select **iOS**
5. Click **"Continue"**
6. Review → Click **"Register"**
7. Repeat for each friend (up to 100 devices with free account)

**Once all devices are added, move to Step 3.**

---

## Step 3: Export Archive as Ad Hoc in Xcode

1. **Open Xcode Organizer:**
   - In Xcode: **Window → Organizer** (or press `Cmd+Shift+9`)
   - Or it might already be open from your Archive

2. **Select your Archive:**
   - You should see your "17WEEKS" archive listed
   - Select it (click on it)

3. **Click "Distribute App"** (blue button on the right)

4. **Select Distribution Method:**
   - Choose **"Ad Hoc"** (NOT "App Store Connect")
   - Click **"Next"**

5. **Select Distribution Options:**
   - Leave defaults as-is
   - Click **"Next"**

6. **Select Signing:**
   - Choose **"Automatically manage signing"**
   - Xcode will create a provisioning profile for your registered devices
   - Click **"Next"**

7. **Review:**
   - Check that your devices are listed
   - Click **"Export"**

8. **Choose Save Location:**
   - Choose a location (Desktop is fine)
   - Click **"Export"**
   - Xcode creates a folder with the `.ipa` file

**The .ipa file is your app! Save this location.**

---

## Step 4: Distribute to Friends

**Option A: Apple Configurator 2 (Easiest if you have Mac access)**

1. Download **Apple Configurator 2** from Mac App Store (free)
2. Friend connects their iPhone to your Mac via USB
3. Open Apple Configurator 2
4. Select their iPhone (should appear automatically)
5. Drag the `.ipa` file onto their iPhone
6. App installs directly!

**Option B: Via Finder (If friend has Mac)**

1. Friend connects their iPhone to their Mac
2. Open **Finder** → Select iPhone
3. Friend drags the `.ipa` file to their iPhone
4. App installs!

**Option C: Email/Dropbox (More Complex)**

1. Upload `.ipa` to Dropbox/Google Drive/email
2. Friend downloads it
3. Friend connects iPhone to their Mac
4. Friend opens Finder → Selects iPhone → Drags `.ipa` to iPhone
5. App installs

---

## Troubleshooting

**"No devices registered" error:**
- Make sure you added devices in Step 2
- Wait a few minutes after adding devices (can take time to sync)

**"Signing failed" error:**
- Make sure "Automatically manage signing" is selected
- Check that your Apple ID is added in Xcode → Preferences → Accounts

**Friend can't install:**
- Make sure their UDID was added in Step 2
- Make sure they're using the .ipa file you exported (not the Archive)
- Try re-exporting after adding their device

---

## Quick Checklist

- [ ] Collected UDIDs from all friends
- [ ] Added all devices in developer.apple.com
- [ ] Opened Xcode Organizer
- [ ] Selected Archive
- [ ] Distributed as "Ad Hoc"
- [ ] Exported .ipa file
- [ ] Distributed .ipa to friends
- [ ] Friends installed app

