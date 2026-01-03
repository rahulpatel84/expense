# ✅ Deployment Checklist

Use this checklist to deploy your app step by step!

---

## 📋 Pre-Deployment

- [ ] Backend runs locally: `cd backend && npm run start:dev`
- [ ] Frontend runs locally: `cd frontend && npm run dev`
- [ ] Test signup/login locally
- [ ] GitHub account created
- [ ] Railway account created (sign up with GitHub)
- [ ] Vercel account created (sign up with GitHub)

---

## 🐙 GitHub Setup

- [ ] Create repository: [github.com/new](https://github.com/new)
  - Name: `expense-tracker`
  - Public or Private
  - Don't initialize with README
- [ ] Run locally:
  ```bash
  cd /Users/rahul/Desktop/Projects/expense-tracker/version1
  git init
  git add .
  git commit -m "Initial commit - ready for deployment"
  git remote add origin https://github.com/YOUR-USERNAME/expense-tracker.git
  git push -u origin main
  ```
- [ ] Verify code is on GitHub

---

## 🛤️ Railway (Backend + Database)

### Database
- [ ] Go to [railway.app](https://railway.app)
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose `expense-tracker` repo
- [ ] Click "New" → "Database" → "Add PostgreSQL"
- [ ] Click PostgreSQL service → Variables tab
- [ ] **Copy `DATABASE_URL`** (save it somewhere!)

### Backend Service
- [ ] Click backend service → Variables tab
- [ ] Add environment variables:
  - [ ] `DATABASE_URL` = (paste from PostgreSQL)
  - [ ] `JWT_SECRET` = (generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
  - [ ] `JWT_EXPIRES_IN` = `15m`
  - [ ] `NODE_ENV` = `production`
  - [ ] `PORT` = `3001`

### Build Settings
- [ ] Go to Settings
- [ ] Start Command: `npx prisma migrate deploy && npm start`
- [ ] Root Directory: `backend` (if backend is in subfolder)
- [ ] Click "Deploy" (or wait for auto-deploy)

### Get Backend URL
- [ ] Go to Settings → Networking
- [ ] Click "Generate Domain"
- [ ] **Copy the URL**: `https://your-app-name.up.railway.app`
- [ ] Test: Open `https://your-app-name.up.railway.app/health` in browser
- [ ] Should see: `{ "status": "ok", "message": "ExpenseAI Backend is running!" }`

---

## 🎨 Vercel (Frontend)

### Update Frontend Code
- [ ] Create `frontend/.env.production`:
  ```
  VITE_API_URL=https://your-app-name.up.railway.app
  ```
- [ ] Update `frontend/src/services/api.ts`:
  ```typescript
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  ```
- [ ] Commit and push:
  ```bash
  git add .
  git commit -m "Add production API URL"
  git push
  ```

### Deploy to Vercel
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "Add New..." → "Project"
- [ ] Import `expense-tracker` repository
- [ ] Framework: Vite (auto-detected)
- [ ] Root Directory: `frontend`
- [ ] Add Environment Variable:
  - Key: `VITE_API_URL`
  - Value: `https://your-app-name.up.railway.app`
- [ ] Click "Deploy"
- [ ] Wait for confetti! 🎊
- [ ] **Copy Frontend URL**: `https://expense-tracker-abc123.vercel.app`

---

## 🔗 Update CORS

- [ ] Edit `backend/src/main.ts`
- [ ] Find `allowedOrigins` (around line 57)
- [ ] Add your Vercel URL:
  ```typescript
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://expense-tracker-abc123.vercel.app', // Your URL
        'http://localhost:5173',
      ]
    : [...];
  ```
- [ ] Commit and push:
  ```bash
  git add .
  git commit -m "Update CORS for production"
  git push
  ```
- [ ] Wait for Railway auto-redeploy (2-3 min)

---

## 🧪 Test Production App

- [ ] Open frontend: `https://expense-tracker-abc123.vercel.app`
- [ ] **Test Signup**:
  - [ ] Click "Sign Up"
  - [ ] Fill form: Name, Email, Password
  - [ ] Click "Create account"
  - [ ] Redirects to Dashboard ✅
- [ ] **Test Logout**:
  - [ ] Click "Sign out"
  - [ ] Goes to login page ✅
- [ ] **Test Login**:
  - [ ] Enter email and password
  - [ ] Click "Sign in"
  - [ ] Logs in successfully ✅
- [ ] **Test Protected Route**:
  - [ ] Logout
  - [ ] Try to visit: `https://your-app.vercel.app/dashboard`
  - [ ] Should redirect to login ✅

---

## 📱 Share Your App

- [ ] Frontend URL: ` https://expense-tracker-abc123.vercel.app`
- [ ] Backend URL: `https://your-app-name.up.railway.app`
- [ ] Share with friends!
- [ ] Add to portfolio/resume
- [ ] Tweet about it 🐦

---

## 🐛 Troubleshooting

### Network Error when signing up

- [ ] Check CORS in `backend/src/main.ts`
- [ ] Make sure Vercel URL is in `allowedOrigins`
- [ ] Check Railway logs for errors
- [ ] Hard refresh browser (Cmd+Shift+R)

### Can't connect to backend

- [ ] Check `frontend/.env.production` has correct Railway URL
- [ ] Make sure no trailing slash in URL
- [ ] Redeploy frontend on Vercel
- [ ] Check browser console for errors

### Backend crashes

- [ ] Check Railway Deployments → Logs
- [ ] Verify all environment variables are set
- [ ] Check `DATABASE_URL` is correct
- [ ] Make sure `npx prisma migrate deploy` ran successfully

### Database error

- [ ] Copy exact `DATABASE_URL` from Railway PostgreSQL Variables
- [ ] Paste into Backend Variables
- [ ] Redeploy

---

## ✨ Congratulations!

If all checkboxes are ticked:

✅ Your app is LIVE on the internet!
✅ Backend hosted on Railway
✅ Frontend hosted on Vercel
✅ Real PostgreSQL database
✅ Fully functional authentication
✅ Ready to share with the world!

---

## 🚀 What's Next?

Now that your app is deployed, you can:

1. **Build expense tracking features**
   - Add expense creation/editing
   - Create categories
   - Add budgets
   - Build charts/analytics

2. **Enhance production setup**
   - Add email service (SendGrid/Resend)
   - Set up monitoring (Sentry)
   - Add analytics (PostHog)
   - Get custom domain

3. **Share and iterate**
   - Share with friends for feedback
   - Fix bugs
   - Add features users want
   - Keep learning! 🎓

**You did it!** 🎉
