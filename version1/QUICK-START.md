# 🚀 Quick Start Guide - Fix "Unable to connect to server"

## ❌ **Problem: "Unable to connect to server"**

This error means your **backend server is not running**. The frontend is trying to connect to `http://localhost:3001` but can't reach it.

---

## ✅ **Solution: Start the Backend Server**

### **Step 1: Open a Terminal**

Open a new terminal window (keep it separate from your frontend terminal).

### **Step 2: Navigate to Backend Directory**

```bash
cd /Users/rahul/Desktop/Projects/expense-tracker/version1/backend
```

### **Step 3: Start the Backend Server**

```bash
npm run start:dev
```

### **Step 4: Wait for Success Message**

You should see:
```
🚀 Starting ExpenseAI Backend...
✅ NestJS application created
✅ CORS enabled for http://localhost:5173
✅ Global validation pipe enabled

🎉 Backend is running!
📡 Server: http://localhost:3001
📚 API Base: http://localhost:3001/api

✨ Ready to accept requests!
```

---

## 🔍 **Verify Backend is Running**

### **Test 1: Check Backend Health**

Open a new terminal and run:
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2026-01-02T..."}
```

### **Test 2: Check Backend Root**

```bash
curl http://localhost:3001
```

**Expected Response:**
```
🎉 Welcome to ExpenseAI Backend!
...
```

---

## 📋 **Complete Setup Checklist**

### **Terminal 1: Backend Server**
```bash
cd version1/backend
npm run start:dev
```
✅ Should show: "Backend is running on http://localhost:3001"

### **Terminal 2: Frontend Server**
```bash
cd version1/frontend
npm run dev
```
✅ Should show: "Local: http://localhost:5173/"

### **Browser**
- Open: `http://localhost:5173/`
- Open Developer Console (F12)
- Try to login/signup

---

## 🐛 **Troubleshooting**

### **Issue 1: Port 3001 Already in Use**

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
PORT=3002 npm run start:dev
```

**Then update frontend:**
```javascript
// In frontend/src/services/authService.js
const API_URL = 'http://localhost:3002'; // Change to match
```

---

### **Issue 2: Backend Won't Start**

**Check:**
1. Are you in the correct directory? (`version1/backend`)
2. Are dependencies installed? (`npm install`)
3. Is PostgreSQL running? (for database)

**Try:**
```bash
cd version1/backend
npm install
npm run start:dev
```

---

### **Issue 3: CORS Error**

**Error in Browser Console:**
```
Access to fetch at 'http://localhost:3001/auth/login' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution:**
- Check `backend/src/main.ts` has CORS enabled
- Verify frontend URL matches CORS origin
- Restart backend server

---

### **Issue 4: Database Connection Error**

**Error:**
```
PrismaClientInitializationError: Can't reach database server
```

**Solution:**
1. Make sure PostgreSQL is running
2. Check `.env` file has correct `DATABASE_URL`
3. Run: `npx prisma db push`

---

## ✅ **Quick Test**

Once backend is running, test it:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test root endpoint  
curl http://localhost:3001

# Test signup endpoint
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123@","fullName":"Test User"}'
```

---

## 🎯 **Expected Behavior**

### **Backend Running:**
- ✅ Terminal shows "Backend is running!"
- ✅ `curl http://localhost:3001` works
- ✅ Frontend can connect
- ✅ No "Unable to connect" error

### **Backend Not Running:**
- ❌ Terminal shows nothing or errors
- ❌ `curl http://localhost:3001` fails
- ❌ Frontend shows "Unable to connect"
- ❌ Browser console shows network errors

---

## 📝 **Summary**

**The fix is simple:**
1. Open terminal
2. `cd version1/backend`
3. `npm run start:dev`
4. Wait for "Backend is running!"
5. Refresh frontend browser
6. Error should disappear ✅

**Both servers must run simultaneously:**
- Backend: `http://localhost:3001` (Terminal 1)
- Frontend: `http://localhost:5173` (Terminal 2)

---

**Need help?** Check the backend terminal for error messages!

