# ⚡ Quick Deploy Guide (15 Minutes)

Follow these steps to get your app live on the internet!

---

## ✅ Before You Start

Make sure you have:
- [x] GitHub account
- [x] Your code working locally
- [x] Backend running on `http://localhost:3001`
- [x] Frontend running on `http://localhost:5173`

---

## 🚀 Step 1: Push Code to GitHub (5 min)

### 1.1 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `expense-tracker`
3. Make it **Public** or **Private** (your choice)
4. **Don't** initialize with README (we already have code)
5. Click **"Create repository"**

### 1.2 Push Your Code

```bash
# Navigate to your project root
cd /Users/rahul/Desktop/Projects/expense-tracker/version1

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for deployment"

# Add remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/expense-tracker.git

# Push to GitHub
git push -u origin main
```

**✅ Checkpoint**: Refresh GitHub page - you should see your code!

---

## 🛤️ Step 2: Deploy Backend + Database (Railway) (5 min)

### 2.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub

### 2.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your **expense-tracker** repository
4. Click on **"Add variables"** (we'll add them later)

### 2.3 Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway creates a database automatically
3. Click on the **PostgreSQL** service
4. Go to **"Variables"** tab
5. Find `DATABASE_URL` and **copy it** (you'll need this!)

### 2.4 Configure Backend Service

1. Click on your **backend** service (the one from GitHub)
2. Go to **"Variables"** tab
3. Click **"New Variable"** and add these ONE BY ONE:

```
DATABASE_URL = (paste the PostgreSQL DATABASE_URL you copied)
JWT_SECRET = (generate below)
JWT_EXPIRES_IN = 15m
NODE_ENV = production
PORT = 3001
```

**Generate JWT_SECRET** (run this locally):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy output and use as `JWT_SECRET`

### 2.5 Add Build Configuration

1. Still in backend service, go to **"Settings"**
2. Scroll to **"Build Command"** → leave as default (`npm run build`)
3. **Start Command** → Change to:
   ```
   npx prisma migrate deploy && npm start
   ```
4. **Root Directory** → Set to `backend` (if your backend is in a subfolder)

### 2.6 Deploy!

1. Click **"Deploy"** or Railway will auto-deploy
2. Wait 2-3 minutes
3. Go to **"Deployments"** tab → see live logs
4. When you see "🎉 Backend is running!" - it's live!

### 2.7 Get Your Backend URL

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. You get: `https://your-app-name.up.railway.app`
4. **Copy this URL!** You'll need it for frontend

### 2.8 Test Backend

Open in browser:
```
https://your-app-name.up.railway.app/health
```

You should see:
```json
{
  "status": "ok",
  "message": "ExpenseAI Backend is running!",
  "timestamp": "2026-01-02T...",
  "uptime": 123.45
}
```

**✅ Backend is LIVE!** 🎉

---

## 🎨 Step 3: Deploy Frontend (Vercel) (5 min)

### 3.1 Update Frontend API URL

First, tell your frontend where the backend is:

1. Create file: `version1/frontend/.env.production`
   ```
   VITE_API_URL=https://your-app-name.up.railway.app
   ```
   (Use your Railway URL from Step 2.7)

2. Update `version1/frontend/src/services/api.ts`:

Find this line:
```typescript
const API_BASE_URL = 'http://localhost:3001';
```

Replace with:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

3. **Commit and push** this change:
   ```bash
   cd /Users/rahul/Desktop/Projects/expense-tracker/version1
   git add .
   git commit -m "Add production API URL"
   git push
   ```

### 3.2 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Authorize Vercel

### 3.3 Deploy Frontend

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. **Import** your `expense-tracker` repository
3. Vercel auto-detects it's a Vite app
4. **Framework Preset**: Vite
5. **Root Directory**: Click **"Edit"** → Set to `frontend`
6. **Environment Variables**: Click **"Add"**
   ```
   VITE_API_URL = https://your-app-name.up.railway.app
   ```
7. Click **"Deploy"**

### 3.4 Wait for Deployment

- Vercel builds your app (~1-2 minutes)
- You'll see a confetti animation when done! 🎊

### 3.5 Get Your Frontend URL

Vercel gives you:
```
https://expense-tracker-abc123.vercel.app
```

**✅ Frontend is LIVE!** 🎉

---

## 🔗 Step 4: Update CORS (Important!)

Your backend needs to allow requests from your Vercel frontend:

1. Edit `version1/backend/src/main.ts`

2. Find this section (around line 57):
```typescript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'http://localhost:5173']
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      ...
    ];
```

3. Update it to:
```typescript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://expense-tracker-abc123.vercel.app', // Your Vercel URL
      'http://localhost:5173', // Keep for local testing
    ]
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:5175',
    ];
```

4. **Commit and push**:
```bash
git add .
git commit -m "Update CORS for production"
git push
```

5. Railway will **auto-redeploy** your backend (wait 2-3 min)

---

## 🧪 Step 5: Test Your Live App!

1. **Open your Vercel URL**: `https://expense-tracker-abc123.vercel.app`

2. **Test Signup**:
   - Click "Sign Up"
   - Name: `Production Test`
   - Email: `test@production.com`
   - Password: `Test123@`
   - Click "Create account"
   - Should redirect to Dashboard! ✅

3. **Test Logout**:
   - Click "Sign out"
   - Should go to login page ✅

4. **Test Login**:
   - Email: `test@production.com`
   - Password: `Test123@`
   - Should login and see Dashboard! ✅

**🎉 CONGRATULATIONS! Your app is live on the internet!**

---

## 📱 Share Your App

Your app URLs:
- **Frontend**: `https://expense-tracker-abc123.vercel.app`
- **Backend**: `https://your-app-name.up.railway.app`

Share the frontend URL with anyone - they can sign up and use your app!

---

## 🐛 Troubleshooting

### "Network Error" when signing up

**Fix**: Check CORS settings
1. Make sure you updated `main.ts` with your Vercel URL
2. Check Railway deployment logs for CORS errors
3. Hard refresh your browser (Cmd+Shift+R)

### "Can't connect to backend"

**Fix**: Check `.env.production` file
1. Make sure `VITE_API_URL` has your Railway URL
2. No trailing slash: `https://app.railway.app` ✅ (not `https://app.railway.app/` ❌)
3. Redeploy frontend on Vercel

### Backend crashes on Railway

**Fix**: Check logs
1. Go to Railway → Backend Service → Deployments → Logs
2. Look for error messages
3. Common issues:
   - Missing environment variable
   - Database migration not run
   - Wrong `DATABASE_URL`

### Database connection error

**Fix**: Check `DATABASE_URL`
1. Go to Railway → PostgreSQL → Variables
2. Copy the exact `DATABASE_URL`
3. Paste into Backend Service → Variables → `DATABASE_URL`
4. Redeploy

---

## 🎯 Next Steps

Now that your app is live, you can:

1. ✅ **Test all features** (signup, login, password reset)
2. 🎨 **Customize** the landing page with your branding
3. 📧 **Add email service** (SendGrid, Resend) for password resets
4. 🌐 **Add custom domain** (optional, $10-15/year)
5. 📊 **Add analytics** (PostHog, Plausible - both free)
6. 🚀 **Build expense tracking features!**

---

## 💡 Pro Tips

1. **Railway sleeps after 5 min of inactivity** (free tier)
   - First request wakes it up (takes 10-20 seconds)
   - Upgrade to $5/month for instant wake-up

2. **Vercel is always instant** (no sleep on free tier!)

3. **Check logs when things break**:
   - Railway: Deployments → View Logs
   - Vercel: Deployments → Function Logs

4. **Auto-deploys are enabled**:
   - Push to GitHub → Railway + Vercel auto-deploy
   - No need to manually deploy again!

---

## 🎊 You Did It!

Your expense tracker is now:
- ✅ Hosted on the internet
- ✅ Using a real PostgreSQL database
- ✅ Secured with JWT authentication
- ✅ Built with modern tech stack
- ✅ Deployable with a single `git push`

**Share it with friends, add it to your portfolio, and keep building!** 🚀
