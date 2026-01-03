# 🔍 Debug: "Unable to connect to server" - Backend Running

## ✅ **Backend Status: RUNNING**
- ✅ Backend: `http://localhost:3001`
- ✅ Database: Connected
- ✅ Routes: All mapped correctly
- ✅ CORS: Enabled for `http://localhost:5173`

## 🔍 **Diagnostic Steps**

### **Step 1: Check Frontend Port**

**Question:** Is your frontend running on `http://localhost:5173`?

**Check:**
1. Look at your frontend terminal
2. Should see: `Local: http://localhost:5173/`
3. If different port, update CORS in backend `main.ts`

---

### **Step 2: Test Backend Directly**

Open browser and visit:
```
http://localhost:3001/health
```

**Expected:** Should see JSON response
```json
{"status":"ok","timestamp":"..."}
```

**If this fails:** Backend might not be accessible

---

### **Step 3: Check Browser Console**

1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Look for errors:
   - ❌ `Failed to fetch`
   - ❌ `CORS policy`
   - ❌ `Network error`
   - ❌ `ERR_CONNECTION_REFUSED`

**Common Errors:**

**CORS Error:**
```
Access to fetch at 'http://localhost:3001/auth/login' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```
**Fix:** Restart backend server

**Connection Refused:**
```
Failed to fetch: ERR_CONNECTION_REFUSED
```
**Fix:** Backend not running or wrong port

---

### **Step 4: Check Network Tab**

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Try to login/signup
4. Look for requests to `localhost:3001`

**What to check:**
- ✅ Request appears in Network tab
- ✅ Status code (200 = success, 401 = auth error, etc.)
- ✅ Request URL is correct
- ✅ Response shows data

**If no request appears:**
- Frontend code might not be calling API
- Check if form submission is working

---

### **Step 5: Test API Directly**

Open browser console and run:
```javascript
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Expected:** Should log `{status: "ok", ...}`

**If error:** Check error message

---

### **Step 6: Check Frontend Code**

Verify the error message location:

**Where is "Unable to connect to server" coming from?**

1. Check `LoginPage.jsx` or `SignupPage.jsx`
2. Look for error handling code
3. Might be showing error before actually trying to connect

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: Frontend Running on Different Port**

**Symptom:** Frontend on `http://localhost:5174` but CORS allows `5173`

**Fix:**
```typescript
// backend/src/main.ts
app.enableCors({
  origin: 'http://localhost:5174', // Change to match your frontend port
  credentials: true,
});
```
Then restart backend.

---

### **Issue 2: Browser Cache**

**Fix:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or clear browser cache
3. Or try incognito/private window

---

### **Issue 3: Error Message Shows Before API Call**

**Symptom:** Error appears immediately, not after clicking button

**Fix:** Check if error is being shown by default. Look for:
```javascript
// Bad - shows error immediately
{error && <div>Unable to connect</div>}

// Good - only shows after failed request
{error && <div>{error}</div>}
```

---

### **Issue 4: Port Conflict**

**Check if port 3001 is actually free:**
```bash
lsof -i :3001
```

**If something else is using it:**
- Kill the process
- Or change backend port in `.env`: `PORT=3002`

---

## ✅ **Quick Test Commands**

**Test 1: Backend Health**
```bash
curl http://localhost:3001/health
```

**Test 2: Backend Root**
```bash
curl http://localhost:3001
```

**Test 3: Signup Endpoint**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123@","fullName":"Test"}'
```

**Test 4: Browser Console**
```javascript
// In browser console
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(console.log)
```

---

## 🎯 **What to Check Right Now**

1. **Frontend Terminal:** What port is it running on?
2. **Browser Console:** What exact error do you see?
3. **Network Tab:** Are requests being made?
4. **Backend Terminal:** Any errors logged?

---

## 📝 **Share This Info**

Please share:
1. Frontend terminal output (what port?)
2. Browser console errors (exact message)
3. Network tab screenshot (if possible)
4. Backend terminal (any errors?)

This will help identify the exact issue!

