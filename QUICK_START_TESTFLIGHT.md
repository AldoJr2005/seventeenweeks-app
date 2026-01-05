# Quick Start: TestFlight Setup

Since you have an Apple Developer account, follow these steps:

## ✅ Pre-Flight Check

1. **Xcode Sign-In**
   - Open Xcode → Preferences (Cmd+,) → Accounts
   - Ensure your Apple Developer account is listed
   - If not, click "+" → Add Apple ID

2. **Verify Current Settings** (Your project is already configured)
   - Bundle ID: `com.seventeenweeks.dev` ✅
   - Version: `1.0` ✅
   - Build: `1` ✅

## 🚀 Next Steps (In Order)

### Step 1: Create Privacy Policy (REQUIRED)
TestFlight requires a privacy policy URL. Options:
- Use a free hosting service (GitHub Pages, Netlify, etc.)
- Include: What data you collect, how it's stored, contact info
- Minimum: One page explaining your app's privacy practices

**Quick Template:**
```
Privacy Policy for 17 WEEKS

We collect:
- Weight data (stored locally on device)
- Calorie/nutrition logs (stored locally on device)
- Progress photos (stored locally on device)

Data Storage:
- All data is stored locally on your device
- Optional cloud backup (if applicable)
- No data shared with third parties

Contact: [your email]
```

### Step 2: Verify Xcode Signing
1. Open `ios/17WEEKS.xcworkspace` in Xcode
2. Select project "17WEEKS" → Target "17WEEKS" → Signing & Capabilities
3. Ensure:
   - ✅ "Automatically manage signing" is checked
   - ✅ Your Team is selected
   - ✅ Bundle Identifier shows `com.seventeenweeks.dev`

### Step 3: Archive & Upload
1. In Xcode toolbar, select **"Any iOS Device"** (not simulator)
2. Product → Archive
3. Wait for build (~2-5 minutes)
4. Organizer opens → Click "Distribute App"
5. Select "App Store Connect" → "Upload"
6. Follow prompts (use automatic signing)
7. Upload completes (~5-10 minutes)

### Step 4: App Store Connect Setup
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. My Apps → "+" → New App (if first time)
   - Name: "17 WEEKS"
   - Bundle ID: `com.seventeenweeks.dev`
   - Primary Language: English
3. Wait for build processing (10-60 minutes)

### Step 5: Complete Required Fields
Once build shows "Ready to Submit":

1. **App Information**
   - Privacy Policy URL: [your privacy policy URL]
   - Category: Health & Fitness

2. **TestFlight → Test Information**
   - Beta App Description: "17 WEEKS is a 17-week weight loss challenge app..."
   - Feedback Email: [your email]

3. **Export Compliance**
   - Does your app use encryption? → **Yes**
   - Standard encryption? → **Yes**
   - Exempt? → **No**

### Step 6: Add Testers
1. TestFlight → Internal Testing → "+" → Create Group
2. Add tester email addresses
3. Select your build → Add to Group
4. Testers receive email invitation

## 📋 Quick Checklist

Before uploading:
- [ ] Privacy policy URL created
- [ ] Xcode signed in with Apple Developer account
- [ ] Signing configured (automatic)
- [ ] Build number set to 1 (already set ✅)

After upload:
- [ ] Wait for build processing
- [ ] Add privacy policy URL
- [ ] Complete export compliance
- [ ] Add beta description
- [ ] Create test group
- [ ] Add testers

## ⏱️ Timeline

- Archive & Upload: ~10-15 minutes
- Build Processing: 10-60 minutes
- TestFlight Setup: ~5-10 minutes
- **Total: ~30-90 minutes** (mostly waiting)

## 🆘 Common Issues

**"Archive" is grayed out:**
- Select "Any iOS Device" (not simulator)

**Upload fails:**
- Check internet connection
- Verify Apple ID in Xcode Preferences → Accounts

**Build stuck on "Processing":**
- Wait up to 2 hours (rare, but possible)
- Check email for rejection notice

**Missing Privacy Policy:**
- Build will be rejected
- Must add URL before testers can install

---

**Ready?** Start with Step 1 (Privacy Policy), then proceed through the steps!

