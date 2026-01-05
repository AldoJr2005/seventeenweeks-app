# Automated TestFlight Setup Help

I've created some automated tools to help you prepare for TestFlight. Here's what I can do automatically and what requires your action:

## ✅ What I've Automated

### 1. Project Verification Script
Run: `./scripts/prepare-testflight.sh`
- Checks your current Bundle ID, Version, and Build number
- Verifies settings are configured
- Shows next steps

### 2. Build Number Incrementer
Run: `./scripts/increment-build.sh`
- Automatically increments build number for new uploads
- Use this each time you upload a new build to TestFlight

### 3. Privacy Policy Template
File: `privacy-policy-template.html`
- Ready-to-use HTML template
- Just add your email address and upload to a web host

## ❌ What Requires Your Action

These steps cannot be automated and require you to:

### 1. Create Privacy Policy URL (REQUIRED)
**Options:**
- **GitHub Pages (Free):**
  1. Create a GitHub repository
  2. Upload `privacy-policy-template.html` (rename to `index.html`)
  3. Enable GitHub Pages in repository settings
  4. URL will be: `https://yourusername.github.io/repository-name`

- **Netlify (Free & Easy):**
  1. Go to [netlify.com](https://netlify.com)
  2. Drag and drop the `privacy-policy-template.html` file
  3. Get instant URL (e.g., `https://random-name.netlify.app`)

- **Any Web Hosting:**
  - Upload `privacy-policy-template.html` to any web server
  - Update the template with your email address first

**Quick Steps:**
1. Open `privacy-policy-template.html`
2. Replace `[YOUR_EMAIL_ADDRESS]` with your email
3. Replace `[DATE]` with today's date
4. Upload to web hosting service
5. Copy the URL for App Store Connect

### 2. Archive in Xcode (REQUIRED)
**Steps:**
1. Open Xcode: `open ios/17WEEKS.xcworkspace`
2. In toolbar, select **"Any iOS Device"** (not simulator)
3. Product → Archive
4. Wait for archive to complete (~2-5 minutes)

### 3. Upload to App Store Connect (REQUIRED)
**Steps:**
1. Organizer window opens automatically after archive
2. Click **"Distribute App"**
3. Select **"App Store Connect"** → Next
4. Select **"Upload"** → Next
5. Use automatic signing → Next → Upload
6. Wait for upload (~5-10 minutes)

### 4. App Store Connect Setup (REQUIRED)
**Steps:**
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create app record (if first time):
   - Click "+" → New App
   - Name: "17 WEEKS"
   - Bundle ID: `com.seventeenweeks.dev`
   - Primary Language: English
3. Wait for build processing (10-60 minutes)

### 5. Complete Required Fields (REQUIRED)
Once build shows "Ready to Submit":
1. **App Information → Privacy Policy URL:** Paste your privacy policy URL
2. **TestFlight → Test Information:**
   - Beta App Description: "17 WEEKS is a 17-week weight loss challenge app..."
   - Feedback Email: Your email
3. **Export Compliance:**
   - Uses encryption? → Yes
   - Standard encryption? → Yes
   - Exempt? → No

### 6. Add Testers (REQUIRED)
1. TestFlight → Internal Testing → "+" → Create Group
2. Add tester email addresses
3. Select build → Add to Group

## 🚀 Quick Start Checklist

1. **Create Privacy Policy:**
   - [ ] Edit `privacy-policy-template.html` (add email)
   - [ ] Upload to web host (GitHub Pages/Netlify)
   - [ ] Copy the URL

2. **Verify Settings:**
   - [ ] Run `./scripts/prepare-testflight.sh`
   - [ ] Check all settings are correct

3. **Archive & Upload:**
   - [ ] Open Xcode → Select "Any iOS Device"
   - [ ] Product → Archive
   - [ ] Distribute App → App Store Connect → Upload

4. **App Store Connect:**
   - [ ] Create app record (if needed)
   - [ ] Wait for build processing
   - [ ] Add privacy policy URL
   - [ ] Complete export compliance
   - [ ] Add beta description
   - [ ] Create test group and add testers

## 📝 Notes

- **Build numbers must increment** for each upload (use `./scripts/increment-build.sh`)
- **Privacy policy URL is mandatory** - TestFlight will reject without it
- **Build processing takes 10-60 minutes** - be patient
- **Export compliance is required** - answer "Yes" to standard encryption

## 💡 Pro Tips

1. **Test on device first:** Make sure app works on a physical device before uploading
2. **Increment build number:** Use the script before each new upload
3. **Save privacy policy URL:** You'll need it for App Store submission later too
4. **Start with internal testing:** Easier to set up, no review needed

---

**Ready to start?** Begin with creating your privacy policy URL, then follow the checklist!

