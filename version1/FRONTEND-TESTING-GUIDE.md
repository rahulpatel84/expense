# 🧪 Frontend Testing Guide

## ✅ Servers Running
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## 👉 Open Browser: http://localhost:5173

---

## Test Flow

### 1. Landing Page
- See "ExpenseTracker" logo and features
- Click "Sign Up"

### 2. Signup
- Full Name: `Test User`
- Email: `test@example.com`
- Password: `Test123@`
- Confirm: `Test123@`
- Watch password strength indicator turn GREEN
- Click "Create Account"
- Auto-redirects to Dashboard

### 3. Dashboard
- See your name and email
- Click red "Logout" button

### 4. Login
- Email: `test@example.com`
- Password: `Test123@`
- Click "Sign In"

### 5. Forgot Password
- Logout
- Click "Forgot password?"
- Email: `test@example.com`
- Click "Send Reset Link"
- **CHECK BACKEND CONSOLE FOR RESET LINK!**

### 6. Reset Password
- Copy reset link from backend console
- Paste in browser
- New Password: `NewPassword456@`
- Confirm: `NewPassword456@`
- Click "Reset Password"
- Auto-redirects to Login

### 7. Login with New Password
- Email: `test@example.com`
- Password: `NewPassword456@` (NEW password!)
- Works! ✅
- Old password `Test123@` fails ❌

---

## 🔐 Security Features

1. **Email Enumeration Prevention**
   - Try: `nonexistent@example.com`
   - Same success message!

2. **One-Time Use Tokens**
   - Try reset link twice
   - Second time fails

3. **Protected Routes**
   - Try http://localhost:5173/dashboard when logged out
   - Redirects to login

---

## 🎉 Success Checklist

- [ ] Signup works
- [ ] Dashboard loads
- [ ] Logout works
- [ ] Login works
- [ ] Forgot password shows success
- [ ] Reset link in backend console
- [ ] Reset password works
- [ ] New password works
- [ ] Old password fails
- [ ] Console logs detailed info

**All good? You're ready! 🚀**
