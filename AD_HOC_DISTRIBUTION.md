# Ad Hoc Distribution (Test Without Developer Account)

Use this to test with friends while waiting for your paid Apple Developer account.

## What You Need:

1. ✅ Your Archive (already created)
2. ✅ Personal Team (free Apple Developer account)
3. ❌ Device UDIDs from your friends (need to collect these)

## Steps:

### Step 1: Collect Device UDIDs from Friends

Each friend needs to send you their iPhone's UDID:

**On iPhone (Easiest):**
1. Go to Settings → General → About
2. Scroll down to find "Identifier" (or "UDID")
3. Long press to copy
4. Send it to you

**Alternative (if not visible):**
- Connect iPhone to Mac
- Open Finder → Select iPhone → Click "Serial Number" (changes to UDID)
- Or use: `system_profiler SPUSBDataType | grep -A 11 iPhone`

### Step 2: Add Devices in Apple Developer Portal

1. Go to [developer.apple.com/account/resources/devices/list](https://developer.apple.com/account/resources/devices/list)
2. Sign in with your Apple ID (same one used in Xcode)
3. Click **"+"** to add a device
4. For each friend's iPhone:
   - **Name:** Friend's name (e.g., "John's iPhone")
   - **UDID:** Paste their UDID
   - **Platform:** iOS
5. Click **"Continue"** → **"Register"**
6. Repeat for all friends (up to 100 devices with free account)

### Step 3: Export Archive as Ad Hoc Distribution

1. In Xcode, open **Organizer** (Window → Organizer, or Cmd+Shift+9)
2. Select your archive
3. Click **"Distribute App"**
4. Select **"Ad Hoc"** (NOT "App Store Connect")
5. Click **"Next"**
6. Select **"Automatically manage signing"**
7. Click **"Next"**
8. Xcode will create a provisioning profile for your registered devices
9. Review → Click **"Export"**
10. Choose a location to save (e.g., Desktop)
11. Xcode creates a folder with the `.ipa` file

### Step 4: Distribute to Friends

**Option A: Apple Configurator 2 (Mac Only)**
1. Download Apple Configurator 2 from Mac App Store (free)
2. Connect friend's iPhone to your Mac
3. Drag the `.ipa` file onto their iPhone in Apple Configurator
4. App installs directly

**Option B: Email/Dropbox (More Complex)**
1. Upload `.ipa` file to a cloud service (Dropbox, Google Drive, etc.)
2. Friend downloads it
3. Friend connects iPhone to their Mac
4. Friend opens Finder → Selects iPhone → Drags `.ipa` to iPhone
5. App installs

**Option C: TestFlight (After Paid Account Activates) ⭐ RECOMMENDED**
- Much easier!
- Just send friends a TestFlight link
- They install via TestFlight app
- No UDIDs, no cables, no hassle

---

## Limitations of Ad Hoc:

- ✅ Works with free Personal Team
- ✅ No Metro needed
- ✅ Works without computer connection
- ❌ Need to collect UDIDs
- ❌ Need to re-export when adding new devices
- ❌ More complex distribution
- ❌ Limited to 100 devices

## TestFlight (After Paid Account):

- ✅ No UDIDs needed
- ✅ Easy distribution (just send link)
- ✅ Friends install via TestFlight app
- ✅ Can add/remove testers easily
- ✅ Better for ongoing testing
- ❌ Need paid Developer account ($99/year)

---

## Recommendation:

**If you can wait:** TestFlight is much easier (once account activates)

**If you need to test NOW:** Use Ad Hoc (follow steps above)

**Best of both:** Start with Ad Hoc for immediate testing, then switch to TestFlight once account activates (no need to re-build, just upload existing Archive)

