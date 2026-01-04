# Backend Deployment Guide

This guide explains how to deploy your backend server to **Render** or **Heroku**, so your iOS app can connect to it from anywhere without local network configuration.

## Benefits of Deployed Backend

- ✅ No port conflicts (port 5000 is free on your Mac)
- ✅ Works from anywhere (no local network IP needed)
- ✅ Works on any device (no Mac running required)
- ✅ Better for testing and sharing
- ✅ Production-ready setup

---

## Option 1: Deploy to Render (Recommended - Free Tier Available)

Render is easier to set up and offers a free tier with PostgreSQL.

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up for a free account

### Step 2: Create PostgreSQL Database

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Name it: `seventeenweeks-db`
3. Select **"Free"** plan
4. Select your region
5. Click **"Create Database"**
6. Wait for database to be created
7. Copy the **"Internal Database URL"** (you'll need this)

### Step 3: Push Database Schema

1. Set the `DATABASE_URL` environment variable locally:
   ```bash
   export DATABASE_URL="<your-render-database-internal-url>"
   ```
2. Run database migrations:
   ```bash
   npm run db:push
   ```

### Step 4: Deploy Backend Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository (or push code manually)
3. Configure the service:
   - **Name**: `seventeenweeks-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run server:build`
   - **Start Command**: `npm run server:prod`
   - **Plan**: `Free`
4. Add Environment Variables:
   - `DATABASE_URL`: Use the **"Internal Database URL"** from Step 2
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render uses port from environment variable)
   - `ALLOWED_ORIGINS`: Leave empty for now (we'll add this after deployment)
5. Click **"Create Web Service"**
6. Wait for deployment to complete (~5 minutes)

### Step 5: Configure CORS

After deployment, Render will give you a URL like: `https://seventeenweeks-backend.onrender.com`

1. In your Render service settings, add/update environment variable:
   - `ALLOWED_ORIGINS`: `https://seventeenweeks-backend.onrender.com`
2. Redeploy the service

### Step 6: Update iOS App to Use Deployed Backend

**Option A: Set at build time (Recommended)**

1. In Xcode, select your project in the navigator
2. Select your target **"17WEEKS"**
3. Go to **"Build Settings"** tab
4. Search for **"User-Defined"** section (or add it)
5. Add a new setting:
   - **Key**: `EXPO_PUBLIC_DOMAIN`
   - **Value**: `seventeenweeks-backend.onrender.com` (your Render URL without `https://`)
6. Clean and rebuild: **Shift+Cmd+K**, then **Cmd+R**

**Option B: Set in code (Temporary testing)**

You can temporarily hardcode it in `client/lib/query-client.ts` for testing, but Option A is better for production.

---

## Option 2: Deploy to Heroku

Heroku requires a credit card for PostgreSQL (but free tier exists).

### Step 1: Install Heroku CLI

```bash
brew install heroku/brew/heroku
```

Or download from [heroku.com/cli](https://devcenter.heroku.com/articles/heroku-cli)

### Step 2: Create Heroku Account & Login

1. Go to [heroku.com](https://www.heroku.com)
2. Sign up for an account
3. Login via CLI:
   ```bash
   heroku login
   ```

### Step 3: Create Heroku App

```bash
cd /Users/aj/Downloads/PWA-Builder
heroku create seventeenweeks-backend
```

### Step 4: Add PostgreSQL Database

```bash
heroku addons:create heroku-postgresql:mini
```

This creates a PostgreSQL database and sets `DATABASE_URL` automatically.

### Step 5: Push Database Schema

```bash
heroku config:get DATABASE_URL  # Verify it's set
npm run db:push  # This will use DATABASE_URL from heroku config
```

Or set it locally temporarily:
```bash
export DATABASE_URL=$(heroku config:get DATABASE_URL)
npm run db:push
```

### Step 6: Configure Environment Variables

```bash
# Set Node environment
heroku config:set NODE_ENV=production

# Set allowed origins (update after getting your app URL)
heroku config:set ALLOWED_ORIGINS=https://seventeenweeks-backend.herokuapp.com
```

### Step 7: Deploy Backend

```bash
git add .
git commit -m "Deploy backend to Heroku"
git push heroku main
```

(If your default branch is `master`, use `git push heroku master`)

### Step 8: Get Your Backend URL

```bash
heroku apps:info
```

Your backend URL will be: `https://seventeenweeks-backend.herokuapp.com`

### Step 9: Update iOS App

Follow **Step 6** from the Render guide above, but use your Heroku URL instead.

---

## Testing the Deployed Backend

1. **Check backend health:**
   ```bash
   curl https://your-backend-url.onrender.com/api/health
   # or
   curl https://your-backend-url.herokuapp.com/api/health
   ```

2. **Update your iOS app:**
   - Set `EXPO_PUBLIC_DOMAIN` in Xcode build settings (see Step 6 above)
   - Or temporarily set it in code
   - Rebuild and run

3. **Test from your iPhone:**
   - The app should now connect to your deployed backend
   - No local network configuration needed!

---

## Switching Between Local and Deployed Backends

- **Local development**: Don't set `EXPO_PUBLIC_DOMAIN`, or set it to `localhost:5000`
- **Deployed backend**: Set `EXPO_PUBLIC_DOMAIN` to your Render/Heroku URL (without `https://`)

The app automatically uses `http` for local URLs and `https` for deployed URLs.

---

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly in Render/Heroku dashboard
- Check that you ran `npm run db:push` to create the schema
- For Render: Use the **"Internal Database URL"** (not the external one)

### CORS Errors

- Make sure `ALLOWED_ORIGINS` includes your backend URL
- Format: `https://your-backend-url.onrender.com` (full URL with protocol)

### Backend Not Starting

- Check Render/Heroku logs for errors
- Verify `DATABASE_URL` is set
- Verify build completed successfully

### App Still Connecting to Localhost

- Make sure you set `EXPO_PUBLIC_DOMAIN` in Xcode build settings
- Clean build folder (Shift+Cmd+K) and rebuild
- Check that the environment variable is actually set (you can log it in code)

---

## Recommended: Render

**Render** is recommended because:
- ✅ Free tier available (no credit card required)
- ✅ Easy setup with `render.yaml` configuration
- ✅ Automatic HTTPS
- ✅ PostgreSQL included in free tier
- ✅ Better documentation

**Heroku** is also good but:
- ⚠️ Requires credit card for PostgreSQL (even on free tier)
- ⚠️ Free tier is more limited

Choose whichever you prefer!

