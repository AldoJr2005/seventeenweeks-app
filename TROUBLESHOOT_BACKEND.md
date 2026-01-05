# Troubleshooting: App Stuck on Loading Screen

If your app is stuck on the loading screen with server errors, here's how to fix it:

## Quick Fix: Start the Backend Server

The app needs the backend server to be running. Let's start it:

### Option 1: Start Local Backend (For Development)

1. **Open Terminal**
2. **Navigate to your project:**
   ```bash
   cd /Users/aj/Downloads/PWA-Builder
   ```

3. **Start the backend server:**
   ```bash
   npm run server:dev
   ```

4. **You should see:**
   - Server starting message
   - "Server running on port 5000" (or similar)
   - Keep this terminal open while using the app

5. **Start the app:**
   - In another terminal or Xcode
   - Run the app
   - It should now connect to the local server

### Option 2: Use Render Backend (Production)

Your app is configured to use the Render backend by default:
- URL: `seventeenweeks-app.onrender.com`

**Check if Render backend is running:**
1. Go to: https://seventeenweeks-app.onrender.com
2. If it shows an error or is down, the backend needs to be deployed/restarted

**If Render backend is down:**
- Go to your Render dashboard
- Check if the service is running
- Restart it if needed

---

## Common Issues & Solutions

### Issue 1: Backend Not Running
**Symptoms:** App stuck on loading, "server" error
**Solution:** Start the backend server (see above)

### Issue 2: Wrong API URL
**Symptoms:** Connection errors, can't reach server
**Solution:** Check `client/lib/query-client.ts` - should point to Render backend or localhost

### Issue 3: Render Backend Spun Down (Free Tier)
**Symptoms:** Works sometimes, doesn't work other times
**Solution:** 
- Free tier Render services spin down after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- Consider upgrading to paid tier, or use local backend for development

### Issue 4: Network Issues
**Symptoms:** Can't connect to server
**Solution:**
- Check internet connection
- Check if you're on the same network (for local backend)
- Verify the backend URL is correct

---

## For Development (Recommended):

**Always start the backend server first:**

```bash
# Terminal 1: Start backend
cd /Users/aj/Downloads/PWA-Builder
npm run server:dev

# Terminal 2 (or Xcode): Run the app
# The app will connect to local backend
```

---

## Check Current Configuration:

Your app is currently set to use the Render backend:
- URL: `seventeenweeks-app.onrender.com`

If you want to use local backend for development, we can change it temporarily.

---

**Try starting the backend server first and let me know what happens!**

