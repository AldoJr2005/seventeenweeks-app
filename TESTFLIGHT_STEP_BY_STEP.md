# TestFlight Setup - Step-by-Step Guide

You have your privacy policy URL! ✅ Now let's get your app on TestFlight.

---

## Step 1: Prepare Xcode Project (5 minutes)

### 1.1 Open Xcode
1. Open Terminal
2. Run: `open ios/17WEEKS.xcworkspace`
   - **Important:** Open the `.xcworkspace` file, NOT the `.xcodeproj` file

### 1.2 Verify Signing
1. In Xcode, click on **"17WEEKS"** project (blue icon, left sidebar)
2. Select the **"17WEEKS"** target (under TARGETS)
3. Click **"Signing & Capabilities"** tab
4. Check:
   - ✅ **"Automatically manage signing"** is checked
   - ✅ **Team** is selected (your Apple Developer account)
   - ✅ **Bundle Identifier** shows: `com.seventeenweeks.dev`
5. If anything is missing/red, fix it now

### 1.3 Check Version & Build
1. Still in the "Signing & Capabilities" tab
2. Check:
   - **Version:** Should be `1.0` (or `1.0.0`)
   - **Build:** Should be `1` (or higher)
3. If you need to change them:
   - Click **"General"** tab
   - Update **Version** and **Build** fields
   - Come back to "Signing & Capabilities"

---

## Step 2: Archive the App (5-10 minutes)

### 2.1 Select Device
1. Look at the top toolbar in Xcode
2. Next to the Play/Stop buttons, click the device selector
3. Select **"Any iOS Device (arm64)"** or **"Generic iOS Device"**
   - **DO NOT** select a simulator (iPhone 15, iPad, etc.)
   - If you don't see "Any iOS Device", it should appear when you try to archive

### 2.2 Create Archive
1. In Xcode menu: **Product → Archive**
   - Or press: **Cmd + B** (build), then **Product → Archive**
2. Wait for the build to complete (2-5 minutes)
   - You'll see progress in the top bar
   - Xcode will show "Archive succeeded" when done
3. The **Organizer** window will open automatically

---

## Step 3: Upload to App Store Connect (5-10 minutes)

### 3.1 Distribute App
1. In the Organizer window, you should see your archive
2. Select your archive (if multiple, select the newest one)
3. Click **"Distribute App"** button (right side)

### 3.2 Choose Distribution Method
1. Select **"App Store Connect"**
2. Click **"Next"**

### 3.3 Choose Upload Option
1. Select **"Upload"**
2. Click **"Next"**

### 3.4 Distribution Options
1. ✅ Check **"Upload your app's symbols"** (for crash reports)
2. ✅ Check **"Manage Version and Build Number"** (optional, helps with auto-increment)
3. Click **"Next"**

### 3.5 Signing Options
1. Select **"Automatically manage signing"**
2. Click **"Next"**

### 3.6 Review and Upload
1. Review the summary (app name, bundle ID, version, etc.)
2. Click **"Upload"**
3. Wait for upload to complete (5-10 minutes)
   - You'll see progress bars
   - When done, you'll see "Upload successful"

---

## Step 4: Create App in App Store Connect (5 minutes)

### 4.1 Go to App Store Connect
1. Open browser
2. Go to: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
3. Sign in with your Apple Developer account

### 4.2 Create New App (If First Time)
1. Click **"My Apps"** (top navigation)
2. Click **"+"** button (top left)
3. Select **"New App"**
4. Fill in the form:
   - **Platform:** iOS
   - **Name:** `17 WEEKS`
   - **Primary Language:** English
   - **Bundle ID:** Select `com.seventeenweeks.dev` (or create if needed)
   - **SKU:** `17weeks001` (any unique identifier)
   - **User Access:** Full Access (or select team if applicable)
5. Click **"Create"**

### 4.3 Wait for Build Processing
1. After uploading, go to your app in App Store Connect
2. Click **"TestFlight"** tab (top navigation)
3. Your build will appear under **"Builds"** section
4. Status will show **"Processing"** (10-60 minutes)
   - ⏳ **Wait for this to complete**
   - Status will change to **"Ready to Submit"** when done
   - You'll get an email when processing is complete

---

## Step 5: Complete Required Fields (10 minutes)

**Wait until your build shows "Ready to Submit" before doing this step!**

### 5.1 Add Privacy Policy URL
1. In App Store Connect → Your App
2. Click **"App Information"** (left sidebar)
3. Scroll to **"Privacy Policy URL"**
4. Paste your URL: `https://AldoJr2005.github.io/17weeks-privacy/`
5. Click **"Save"** (top right)

### 5.2 Set Category
1. Still in **"App Information"**
2. Under **"Category"**:
   - **Primary:** Select **"Health & Fitness"**
   - **Secondary:** (Optional, leave blank or choose)
3. Click **"Save"**

### 5.3 Complete Export Compliance
1. Go to **"TestFlight"** tab
2. Find your processed build (should show "Ready to Submit")
3. Click on the build number/version
4. Scroll to **"Export Compliance"** section
5. Answer the questions:
   - **Does your app use encryption?** → Select **"Yes"**
   - **Does your app use standard encryption?** → Select **"Yes"**
     - (HTTPS counts as standard encryption)
   - **Is your app exempt?** → Select **"No"**
6. Click **"Save"** or **"Done"**

### 5.4 Add Beta App Information
1. Still in **"TestFlight"** tab
2. Click **"Test Information"** (left sidebar, under TestFlight section)
3. Fill in:
   - **Beta App Description:** 
     ```
     17 WEEKS is a 17-week weight loss challenge app. Track your nutrition, workouts, and progress photos. Set goals, log daily habits, and monitor your transformation over 17 weeks.
     ```
   - **Feedback Email:** `aldo400@outlook.com`
   - **Marketing URL:** (Optional, leave blank)
   - **What to Test:** (Optional, leave blank or add instructions)
4. Click **"Save"**

---

## Step 6: Set Up Internal Testing (5 minutes)

### 6.1 Create Test Group
1. In **"TestFlight"** tab
2. Click **"Internal Testing"** (left sidebar)
3. Click **"+"** button (or "Create Group" if no groups exist)
4. Name it: `Internal Testers`
5. Click **"Create"**

### 6.2 Add Testers
1. In your test group, click **"+"** button (or "Add Testers")
2. Enter tester email addresses (one per line or separated by commas)
   - Testers need Apple IDs
   - You can add up to 100 internal testers
3. Click **"Add"** or **"Invite"**

### 6.3 Add Build to Group
1. Still in your test group
2. Click **"Add Build to Group"** or **"+"** next to Builds
3. Select your processed build (the one showing "Ready to Submit")
4. Click **"Add"** or **"Done"**

### 6.4 Testers Receive Invitation
1. Testers will receive an email invitation
2. They need to:
   - Install the **TestFlight app** from the App Store (if not installed)
   - Click the invitation link in the email
   - Accept the invitation
   - Install your app from TestFlight

---

## Step 7: Test Your Setup (Optional)

1. **Visit your privacy policy:** Make sure `https://AldoJr2005.github.io/17weeks-privacy/` works
2. **Check build status:** Make sure it shows "Ready to Submit" (not "Processing")
3. **Test with yourself:** Add your own email as a tester to test the flow

---

## Timeline Summary

- **Xcode Setup:** 5 minutes
- **Archive:** 5-10 minutes
- **Upload:** 5-10 minutes
- **Build Processing:** 10-60 minutes (waiting - you can do other things)
- **App Store Connect Setup:** 10 minutes
- **TestFlight Setup:** 5 minutes
- **Total Active Time:** ~40 minutes
- **Total Time (including waiting):** ~2 hours

---

## Troubleshooting

**"Archive" is grayed out:**
- Make sure "Any iOS Device" is selected (not simulator)
- Clean build: Product → Clean Build Folder (Shift+Cmd+K)

**Upload fails:**
- Check internet connection
- Verify Apple ID in Xcode → Preferences → Accounts
- Try again

**Build stuck on "Processing":**
- Wait up to 2 hours (rare but possible)
- Check email for rejection notice
- If stuck >2 hours, upload a new build

**Can't find your build in TestFlight:**
- Wait 5-10 minutes after upload
- Refresh the page
- Check you're looking at the correct app

---

## Next Steps After TestFlight

1. **Collect feedback** from testers
2. **Fix bugs** reported
3. **Upload new builds** (use `./scripts/increment-build.sh` to increment build number)
4. **When ready:** Submit for App Store review (different from TestFlight)

---

**Ready to start?** Begin with Step 1 - Open Xcode! 🚀

