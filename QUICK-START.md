# ⚡ Quick Start Guide - Run in 5 Minutes

## 🎯 What You Have

A complete **SaaS Authentication System** with:
- User Registration with Email Verification
- Secure Login with JWT Tokens
- Password Reset Flow
- Account Lockout Protection
- Session Management
- Audit Logging

---

## 🚀 How to Run Both Backend & Frontend

### Step 1: Setup Database (ONE TIME ONLY)

```bash
cd /Users/rahul/Desktop/Projects/expense-tracker
bash SETUP-LOCAL-DB.sh
```

**What this does:**
- Installs PostgreSQL locally
- Creates your database
- Runs all migrations
- Backend auto-restarts

**Time:** 5 minutes

---

### Step 2: Verify Backend is Running

Backend should already be running at: **http://localhost:3000**

**Test it:**
```bash
curl http://localhost:3000/api/health
```

**If NOT running:**
```bash
cd /Users/rahul/Desktop/Projects/expense-tracker/backend
npm run start:dev
```

---

### Step 3: Start Frontend

**Open NEW terminal:**
```bash
cd /Users/rahul/Desktop/Projects/expense-tracker/frontend
npm install  # First time only
npm run dev
```

Frontend will start at: **http://localhost:5173**

---

### Step 4: Open in Browser

```bash
open http://localhost:5173
```

**You should see the ExpenseAI login page!**

---

## 🧪 Test the Login System

### 1. Register New User

**Using the Browser:**
1. Click "Sign Up"
2. Enter your details
3. Click "Create Account"

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "currencyCode": "USD"
  }'
```

---

### 2. Verify Email (For Testing)

Since we're in development, manually verify:

```bash
psql expenseai_dev -c "UPDATE users SET email_verified = true WHERE email = 'test@example.com';"
```

---

### 3. Login

**Using Browser:**
1. Go to login page
2. Enter email and password
3. Click "Login"
4. 🎉 You're in!

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**You'll get back:**
- Access Token (use for API requests)
- Refresh Token (use to get new access token)
- User Information

---

## 📊 Your Running Services

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5173 | 🟢 |
| Backend API | http://localhost:3000 | 🟢 |
| Database | localhost:5432 | 🟢 |
| Redis | Upstash Cloud | 🟢 |
| Email | SendGrid | 🟢 |

---

## 🔄 Daily Workflow

**To start working:**

```bash
# Terminal 1: Backend (if not running)
cd /Users/rahul/Desktop/Projects/expense-tracker/backend
npm run start:dev

# Terminal 2: Frontend
cd /Users/rahul/Desktop/Projects/expense-tracker/frontend
npm run dev

# Open browser
open http://localhost:5173
```

**To stop:**
- Press `Ctrl+C` in both terminals

---

## 🎯 Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                    │
└─────────────────────────────────────────────────────────────┘

1. User fills signup form
   └─► Frontend validates inputs
       └─► POST /api/auth/signup
           └─► Backend validates data
               └─► Hash password with bcrypt
                   └─► Create user in database
                       └─► Generate verification token
                           └─► Send verification email
                               └─► Return success message

┌─────────────────────────────────────────────────────────────┐
│                      USER LOGIN FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. User enters credentials
   └─► Frontend validates inputs
       └─► POST /api/auth/login
           └─► Backend finds user
               └─► Check if account locked
                   └─► Verify password
                       ├─► ✅ Correct
                       │   └─► Generate JWT tokens
                       │       └─► Cache refresh token in Redis
                       │           └─► Return tokens + user data
                       │               └─► Frontend stores tokens
                       │                   └─► Redirect to dashboard
                       │
                       └─► ❌ Wrong
                           └─► Increment failed attempts
                               └─► Lock after 5 attempts
                                   └─► Return error

┌─────────────────────────────────────────────────────────────┐
│                  ACCESSING PROTECTED ROUTE                   │
└─────────────────────────────────────────────────────────────┘

1. User navigates to protected page
   └─► Frontend adds token to request
       └─► GET /api/expenses (Authorization: Bearer token)
           └─► Backend JWT Guard intercepts
               └─► Validate token signature
                   └─► Check expiration
                       ├─► ✅ Valid
                       │   └─► Extract user from token
                       │       └─► Process request
                       │           └─► Return data
                       │
                       └─► ❌ Expired
                           └─► Return 401 Unauthorized
                               └─► Frontend auto-refreshes token
                                   └─► Retry request

┌─────────────────────────────────────────────────────────────┐
│                    PASSWORD RESET FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. User clicks "Forgot Password"
   └─► Enter email
       └─► POST /api/auth/forgot-password
           └─► Backend finds user
               └─► Generate reset token
                   └─► Send reset email
                       └─► User clicks link
                           └─► Enter new password
                               └─► POST /api/auth/reset-password
                                   └─► Validate token
                                       └─► Hash new password
                                           └─► Update database
                                               └─► Invalidate all sessions
                                                   └─► Success message
```

---

## 🛠️ Troubleshooting

### Backend Issues

**Port already in use:**
```bash
lsof -ti:3000 | xargs kill -9
cd backend && npm run start:dev
```

**Database connection failed:**
```bash
brew services restart postgresql@15
cd backend && npm run start:dev
```

### Frontend Issues

**Port already in use:**
```bash
lsof -ti:5173 | xargs kill -9
cd frontend && npm run dev
```

**Dependencies issues:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 🎯 Available API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| POST | `/api/auth/refresh` | Refresh access token | No (refresh token) |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password | No (reset token) |
| GET | `/api/auth/verify-email` | Verify email address | No (verify token) |
| POST | `/api/auth/resend-verification` | Resend verification email | No |
| GET | `/api/auth/me` | Get current user | Yes |

---

## 📝 Example Requests

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "currencyCode": "USD"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## ✅ Success Checklist

When everything is running:

- [ ] Backend responds at http://localhost:3000/api/health
- [ ] Frontend loads at http://localhost:5173
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can access dashboard after login
- [ ] Can logout successfully
- [ ] Tokens are working

---

## 📚 Full Documentation

- `HOW-IT-WORKS.md` - Complete technical guide
- `DATABASE-ISSUE-EXPLAINED.md` - Database setup details
- `START-SERVER.md` - Backend server guide
- `SETUP-STATUS.md` - Project status overview

---

## 🎉 You're Ready!

Your complete SaaS authentication system is ready to test!

**Need help?** Check the full guides above or ask questions.

**Next:** Start building your expense tracking features! 🚀

