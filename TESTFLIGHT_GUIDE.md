# TestFlight Distribution Guide

Complete guide to distribute your 17 WEEKS app via TestFlight.

---

## Part 1: Preparing Xcode Project

### Step 1.1: Update Bundle Identifier
Your current bundle ID is `com.seventeenweeks.dev` (development). For TestFlight, use a production bundle ID.

**Option A: Keep development bundle ID (for testing)**
- Current: `com.seventeenweeks.dev` ✅ (can use for TestFlight)

**Option B: Change to production bundle ID (recommended)**
1. Open Xcode → Select project "17WEEKS" → Target "17WEEKS" → General tab
2. Change **Bundle Identifier** to `com.seventeenweeks.app`
3. Or use your own: `com.yourname.seventeenweeks`

**Note:** Bundle IDs must be unique across all App Store apps. If `com.seventeenweeks.app` is taken, choose a different one.

### Step 1.2: Update Version and Build Number
1. In Xcode → Target "17WEEKS" → General tab
2. **Version** (CFBundleShortVersionString): Set to `1.0.0` (or increment for updates)
3. **Build** (CFBundleVersion): Set to `1` (increment for each upload: 1, 2, 3, ...)

**Important:** Build number must be unique and incrementing for each upload.

### Step 1.3: Configure Signing & Capabilities
1. In Xcode → Target "17WEEKS" → Signing & Capabilities tab
2. Check **"Automatically manage signing"**
3. Select your **Team** (your Apple Developer account)
4. Verify **Bundle Identifier** matches Step 1.1
5. Xcode will automatically create/select provisioning profiles

**If you see signing errors:**
- Ensure you have an active Apple Developer account ($99/year)
- Add your Apple ID in Xcode → Preferences → Accounts
- Select your team from the dropdown

### Step 1.4: Verify App Icons
TestFlight requires all app icon sizes. Verify icons exist:
- `ios/17WEEKS/Images.xcassets/AppIcon.appiconset/`
- Should contain: 1024x1024 (required), plus all sizes from 20x20 to 1024x1024

---

## Part 2: Archiving and Uploading

### Step 2.1: Set Build Configuration
1. In Xcode → Product → Scheme → Edit Scheme
2. Select **Run** → Info tab → Build Configuration: **Release**
3. Close the scheme editor

### Step 2.2: Select Generic iOS Device
1. In Xcode toolbar, click the device selector (next to Play button)
2. Select **"Any iOS Device (arm64)"** or **"Generic iOS Device"**
3. Do NOT select a simulator (simulators cannot be archived)

### Step 2.3: Archive the App
1. Product → Archive (or Cmd+B then Product → Archive)
2. Wait for build to complete (may take 2-5 minutes)
3. Organizer window opens automatically

**If Archive is grayed out:**
- Ensure "Any iOS Device" is selected (not simulator)
- Clean build folder: Product → Clean Build Folder (Shift+Cmd+K)
- Try again

### Step 2.4: Upload to App Store Connect
1. In Organizer window, select your archive
2. Click **"Distribute App"**
3. Select **"App Store Connect"** → Next
4. Select **"Upload"** → Next
5. Distribution options:
   - ✅ Upload your app's symbols (recommended for crash reports)
   - ✅ Manage Version and Build Number (auto-increment)
6. Select signing: **"Automatically manage signing"** → Next
7. Review → Click **"Upload"**
8. Wait for upload to complete (may take 5-10 minutes)

**If upload fails:**
- Check internet connection
- Verify Apple ID credentials in Xcode → Preferences → Accounts
- Check Apple Developer account status (must be active)
- Try uploading via Xcode → Window → Organizer → Distribute App

---

## Part 3: App Store Connect Setup

### Step 3.1: Access App Store Connect
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Sign in with your Apple Developer account
3. Click **"My Apps"**

### Step 3.2: Create App Record (If New App)
1. Click **"+"** → **"New App"**
2. Fill in required fields:
   - **Platform:** iOS
   - **Name:** "17 WEEKS" (or your preferred name)
   - **Primary Language:** English (or your preference)
   - **Bundle ID:** Select the bundle ID from Step 1.1
   - **SKU:** Unique identifier (e.g., "17weeks001")
   - **User Access:** Full Access (unless using team structure)
3. Click **"Create"**

### Step 3.3: Wait for Processing
1. After upload, go to App Store Connect → My Apps → Your App
2. Navigate to **"TestFlight"** tab
3. Your build will appear under **"Builds"** with status **"Processing"**
4. **Wait 10-60 minutes** for Apple to process your build

**Build Processing Status:**
- **Processing:** Apple is validating your build (normal, wait)
- **Ready to Submit:** Build processed successfully ✅
- **Invalid Binary:** Build rejected (check email for details)

---

## Part 4: Required App Store Connect Fields for TestFlight

### Step 4.1: App Information (Required)
1. In App Store Connect → Your App → **"App Information"**
2. Fill in:
   - **Name:** "17 WEEKS"
   - **Subtitle:** (Optional, up to 30 characters)
   - **Category:** 
     - Primary: **Health & Fitness**
     - Secondary: (Optional)
   - **Privacy Policy URL:** ⚠️ **REQUIRED for TestFlight** (see Step 4.3)

### Step 4.2: Pricing and Availability
1. Navigate to **"Pricing and Availability"**
2. Set **Price:** Free (or paid)
3. Set **Availability:** All countries (or select specific)

### Step 4.3: Privacy Policy URL (REQUIRED)
TestFlight requires a privacy policy URL, especially for health/fitness apps.

**Options:**
1. **Create a simple privacy policy page:**
   - Use GitHub Pages, Netlify, or any web hosting
   - Include basic privacy information
   - Example template: [privacypolicygenerator.info](https://www.privacypolicygenerator.info)

2. **Minimum required content:**
   - What data you collect (weight, calories, photos, etc.)
   - How data is stored (locally, cloud, etc.)
   - Third-party services (if any)
   - Contact information

3. **Add URL to App Store Connect:**
   - App Information → Privacy Policy URL
   - Paste your privacy policy URL

### Step 4.4: Export Compliance (REQUIRED)
1. Navigate to TestFlight → Your Build → Click build number
2. Scroll to **"Export Compliance"**
3. Answer questions:
   - **Does your app use encryption?** → Typically **"Yes"** (HTTPS counts as encryption)
   - **Does your app use standard encryption?** → Typically **"Yes"** (HTTPS, AES, etc.)
   - **Is your app exempt?** → Typically **"No"** (unless you have EXC documentation)

**For most apps:** Select "Yes" to standard encryption, "No" to exemption.

### Step 4.5: Beta App Information (Optional but Recommended)
1. Navigate to TestFlight → **"Test Information"**
2. Fill in:
   - **Beta App Description:** Brief description for testers (e.g., "17 WEEKS is a 17-week weight loss challenge app. Track nutrition, workouts, and progress.")
   - **Feedback Email:** Your email for tester feedback
   - **Marketing URL:** (Optional) Your website
   - **What to Test:** (Optional) Instructions for testers

---

## Part 5: Enabling TestFlight and Adding Testers

### Step 5.1: Internal Testing (Up to 100 Testers)
1. Navigate to TestFlight → **"Internal Testing"**
2. Click **"+"** to create a group (e.g., "Internal Testers")
3. Add testers:
   - Click **"+"** → Enter Apple ID email addresses
   - Testers must accept email invitation
   - They'll receive TestFlight app download link
4. Select your processed build → Click **"Add Build to Group"**
5. Testers can now install via TestFlight app

### Step 5.2: External Testing (Up to 10,000 Testers)
**Note:** External testing requires App Review (can take 24-48 hours).

1. Navigate to TestFlight → **"External Testing"**
2. Click **"+"** → Create group (e.g., "Beta Testers")
3. Add testers:
   - Enter email addresses
   - Or use public link (see Step 5.3)
4. Select build → Click **"Start Testing"**
5. Fill in required information:
   - **Beta App Description:** Same as Step 4.5
   - **Feedback Email:** Your email
   - **Export Compliance:** Same as Step 4.4
   - **Demo Account:** (Optional) For apps requiring login
6. Submit for Beta App Review
7. Wait 24-48 hours for Apple review

### Step 5.3: Public TestFlight Link (External Testing Only)
1. After external testing is approved
2. Navigate to TestFlight → External Testing → Your Group
3. Find **"Public Link"** section
4. Enable **"Enable Public Link"**
5. Copy the public link (e.g., `https://testflight.apple.com/join/XXXXXXXX`)
6. Share this link with testers (no email invitation needed)

**Limitations:**
- Only works for external testing groups
- Requires Beta App Review approval
- Up to 10,000 testers via public link

---

## Part 6: Extra Requirements for Fitness/Calorie-Tracking Apps

### Health Data Handling
1. **HealthKit Integration (if used):**
   - Declare HealthKit capability in Xcode
   - Add privacy descriptions in Info.plist
   - Include HealthKit usage in privacy policy

2. **Health & Fitness Category:**
   - Already set in Step 4.1
   - Apple may request additional information about health claims

### Medical Claims Compliance
- **Do NOT make medical claims** (e.g., "cures diabetes", "treats obesity")
- Use fitness/wellness language (e.g., "weight loss challenge", "fitness tracking")
- Your app appears compliant ✅ (weight loss challenge, not medical treatment)

### Data Privacy (Enhanced Requirements)
1. **Privacy Policy must include:**
   - What health data is collected (weight, calories, photos)
   - How data is stored (locally on device, cloud backup)
   - Third-party analytics (if any)
   - Data retention policies

2. **App Tracking Transparency (if applicable):**
   - If using IDFA or tracking, implement ATT framework
   - Request permission before tracking

### App Store Review Guidelines (Health & Fitness)
- Section 2.5.9: Health, Fitness, and Medical Data
- Ensure app doesn't provide medical diagnosis
- Don't claim to replace medical consultation
- Provide accurate calorie/nutrition information (if provided)

**Your app status:** ✅ Appears compliant (challenge/tracking app, not medical)

---

## Part 7: Common TestFlight Rejection Reasons

### 7.1: Missing Privacy Policy URL
**Error:** "Missing Privacy Policy URL"
**Fix:** Add privacy policy URL in App Information (Step 4.3)

### 7.2: Missing Export Compliance
**Error:** "Export Compliance Information Required"
**Fix:** Complete export compliance questions (Step 4.4)

### 7.3: Invalid Binary / Build Errors
**Error:** "Invalid Binary"
**Common causes:**
- App crashes on launch
- Missing required icons
- Incorrect bundle identifier
- Signing errors
**Fix:** Check email for specific error, fix issues, upload new build

### 7.4: Missing App Description
**Error:** "Beta App Description Required"
**Fix:** Add description in Test Information (Step 4.5)

### 7.5: Health Claims (Fitness Apps)
**Error:** "Medical Claims Not Allowed"
**Fix:** Review app description, remove medical claims, use fitness/wellness language

### 7.6: Crash on Launch
**Error:** Build rejected due to crashes
**Fix:**
- Test app on physical device before uploading
- Check crash logs in Xcode → Window → Devices and Simulators
- Fix crashes, upload new build

### 7.7: Missing Required Capabilities
**Error:** "Missing Required Capabilities"
**Fix:** Ensure all declared capabilities (camera, photos, etc.) are properly configured

---

## Part 8: Troubleshooting

### Build Stuck on "Processing"
**Symptoms:** Build shows "Processing" for >2 hours

**Solutions:**
1. **Wait longer:** Processing can take up to 2 hours (rare, but possible)
2. **Check email:** Apple sends email if processing fails
3. **Check build size:** Very large builds (>500MB) take longer
4. **Re-upload:** Sometimes builds get stuck, upload a new build with incremented build number
5. **Check Xcode/Apple status:** Check [developer.apple.com/system-status](https://developer.apple.com/system-status)

### Build Doesn't Appear in TestFlight
**Symptoms:** Upload succeeded, but build not visible in TestFlight

**Solutions:**
1. **Refresh page:** Hard refresh (Cmd+Shift+R) App Store Connect
2. **Wait 5-10 minutes:** Builds can take time to appear
3. **Check correct app:** Ensure you're viewing the correct app in App Store Connect
4. **Check bundle ID:** Verify bundle ID matches between Xcode and App Store Connect
5. **Check email:** Apple emails if build is rejected during processing

### Upload Fails in Xcode
**Symptoms:** "Upload failed" error in Organizer

**Solutions:**
1. **Check internet connection:** Stable connection required
2. **Check Apple ID:** Verify credentials in Xcode → Preferences → Accounts
3. **Check developer account:** Ensure account is active ($99/year)
4. **Try again:** Sometimes temporary server issues
5. **Use Application Loader (legacy):** Download from App Store Connect → Tools → Application Loader

### "No Compatible Versions" Error
**Symptoms:** Testers see "No compatible versions" in TestFlight

**Solutions:**
1. **Check iOS version:** Ensure build supports testers' iOS versions (check Deployment Target)
2. **Check device compatibility:** Verify app supports testers' devices
3. **Check build status:** Ensure build is "Ready to Submit" (not "Processing" or "Invalid")

### Signing Errors
**Symptoms:** "Code signing error" or "Provisioning profile" errors

**Solutions:**
1. **Automatically manage signing:** Enable in Xcode → Signing & Capabilities
2. **Check team selection:** Select correct team in Signing & Capabilities
3. **Refresh provisioning profiles:** Xcode → Preferences → Accounts → Download Manual Profiles
4. **Clean build folder:** Product → Clean Build Folder (Shift+Cmd+K)

---

## Quick Checklist

Before uploading to TestFlight, verify:

- [ ] Bundle Identifier is set correctly
- [ ] Version and Build Number are set
- [ ] Signing is configured (Automatic)
- [ ] App icons are present (1024x1024 required)
- [ ] Build for "Any iOS Device" (not simulator)
- [ ] Archive created successfully
- [ ] Privacy Policy URL is added in App Store Connect
- [ ] Export Compliance is completed
- [ ] Beta App Description is filled in
- [ ] App Information is complete (Category, Name, etc.)

---

## Next Steps After TestFlight

1. **Collect Feedback:** Monitor TestFlight feedback and crash reports
2. **Fix Issues:** Address bugs and crashes reported by testers
3. **Iterate:** Upload new builds with fixes (increment build number)
4. **Prepare for App Store:** When ready, submit for App Store review (different from TestFlight review)

---

## Additional Resources

- [Apple TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Health & Fitness Guidelines (Section 2.5.9)](https://developer.apple.com/app-store/review/guidelines/#health-and-fitness)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

---

**Need Help?** Check Apple Developer Support or review error emails from Apple (they include specific rejection reasons).

