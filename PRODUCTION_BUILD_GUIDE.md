# Building a Production App (No Metro Required)

## The Problem:

You're running a **DEBUG build** from Xcode (Cmd+R) which requires Metro bundler. For a "normal app" that works standalone (like TestFlight), you need a **RELEASE build** with bundled JavaScript.

## The Solution (Super Simple):

When you **Archive** in Xcode with **Release** configuration, Expo automatically bundles the JavaScript into the app. No Metro needed!

### Steps:

1. **Open Xcode:**
   ```bash
   open ios/17WEEKS.xcworkspace
   ```

2. **Select "Any iOS Device"** (not simulator) from the device dropdown

3. **Archive (this uses Release automatically):**
   - Product → Archive
   - Xcode automatically uses **Release** configuration for Archive
   - JavaScript gets bundled into the app
   - **No Metro needed!**

4. **Upload to TestFlight** (as before)

That's it! The Archive process automatically:
- Uses Release configuration
- Bundles JavaScript into the app
- Creates a standalone app (no Metro needed)

---

## Key Differences:

### Development Build (DEBUG - What you're doing now):
- Run from Xcode: **Cmd+R** (or Product → Run)
- Uses **Debug** configuration
- Requires Metro running
- JavaScript loaded from server
- For development only

### Production Build (RELEASE - For TestFlight):
- Build from Xcode: **Product → Archive**
- Uses **Release** configuration automatically
- JavaScript bundled into app
- **No Metro needed!**
- Works standalone
- **FOR TestFlight/App Store/sharing**

---

## Why Metro Doesn't Run Automatically:

- **Render backend** = Server that runs 24/7 (after you upgrade)
- **Metro bundler** = Development tool, only needed for DEBUG builds
- **Production builds** = JavaScript bundled into app, no Metro needed

---

## Summary:

**For TestFlight/sharing:** Just Archive in Xcode (Product → Archive) - it automatically bundles everything!

**For development:** Keep using Cmd+R (DEBUG) with Metro when making changes

