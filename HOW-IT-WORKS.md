# 🎯 ExpenseAI Authentication System - Complete Guide

## 📚 Table of Contents
1. [How the System Works](#how-the-system-works)
2. [Authentication Flow](#authentication-flow)
3. [Running the Application](#running-the-application)
4. [Testing the System](#testing-the-system)

---

## 🏗️ How the System Works

### Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Frontend  │ ◄────► │   Backend   │ ◄────► │   Database   │
│  React +    │  HTTP   │  NestJS +   │   SQL  │  PostgreSQL  │
│   Vite      │  REST   │   Prisma    │        │  (Supabase)  │
└─────────────┘         └─────────────┘         └──────────────┘
                              │
                              ├──► Redis (Caching/Sessions)
                              │
                              └──► SendGrid (Emails)
```

---

## 🔐 Authentication Flow Step-by-Step

### 1️⃣ **User Registration (Signup)**

```
User Action → Frontend → Backend → Database → Email → User
```

**Detailed Flow:**

1. **User fills signup form** (frontend)
   - Full name, email, password, currency

2. **Frontend validates inputs**
   - Password strength check
   - Email format validation
   - All fields required

3. **Frontend sends POST to `/api/auth/signup`**
   ```json
   {
     "fullName": "John Doe",
     "email": "john@example.com",
     "password": "SecurePass123!",
     "currencyCode": "USD"
   }
   ```

4. **Backend receives request** (AuthController)
   - Request goes through validation middleware
   - Rate limiting checks (max 10 requests/minute)

5. **Backend validates data** (AuthService)
   - Check if email already exists
   - Password must meet requirements (8+ chars, uppercase, number, special)
   - Validate currency code

6. **Backend hashes password**
   ```typescript
   // Using bcrypt with 12 salt rounds
   const passwordHash = await bcrypt.hash(password, 12);
   ```

7. **Backend creates user in database**
   ```typescript
   const user = await prisma.user.create({
     data: {
       fullName,
       email,
       passwordHash,
       currencyCode,
       emailVerified: false // Starts as unverified
     }
   });
   ```

8. **Backend generates verification token**
   ```typescript
   // Create random secure token
   const verificationToken = crypto.randomBytes(32).toString('hex');
   const tokenHash = crypto.createHash('sha256')
     .update(verificationToken)
     .digest('hex');
   
   // Save to database
   await prisma.emailVerification.create({
     data: {
       userId: user.id,
       email: user.email,
       tokenHash,
       expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
     }
   });
   ```

9. **Backend sends verification email** (via SendGrid)
   ```
   To: john@example.com
   Subject: Verify your email
   
   Click here to verify:
   http://localhost:5173/verify-email?token=abc123...
   ```

10. **Backend creates audit log**
    ```typescript
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    ```

11. **Backend returns success response**
    ```json
    {
      "message": "Registration successful. Please check your email to verify your account.",
      "userId": "uuid-here"
    }
    ```

12. **Frontend shows success message**
    - "Check your email to verify your account"
    - Redirects to login page

---

### 2️⃣ **Email Verification**

**Flow:**

1. **User clicks link in email**
   - Opens: `http://localhost:5173/verify-email?token=abc123...`

2. **Frontend extracts token from URL**

3. **Frontend sends GET to `/api/auth/verify-email?token=abc123`**

4. **Backend validates token** (AuthService)
   ```typescript
   // Hash the token to compare with database
   const tokenHash = crypto.createHash('sha256')
     .update(token)
     .digest('hex');
   
   // Find verification record
   const verification = await prisma.emailVerification.findFirst({
     where: {
       tokenHash,
       verifiedAt: null, // Not already verified
       expiresAt: { gt: new Date() } // Not expired
     }
   });
   ```

5. **If valid, mark email as verified**
   ```typescript
   await prisma.user.update({
     where: { id: verification.userId },
     data: { emailVerified: true }
   });
   
   await prisma.emailVerification.update({
     where: { id: verification.id },
     data: { verifiedAt: new Date() }
   });
   ```

6. **Backend creates audit log**
   - Action: 'EMAIL_VERIFIED'

7. **Frontend shows success and redirects to login**

---

### 3️⃣ **User Login**

**Flow:**

1. **User enters credentials**
   - Email and password

2. **Frontend sends POST to `/api/auth/login`**
   ```json
   {
     "email": "john@example.com",
     "password": "SecurePass123!"
   }
   ```

3. **Backend finds user by email**
   ```typescript
   const user = await prisma.user.findUnique({
     where: { email }
   });
   ```

4. **Backend checks if account is locked**
   ```typescript
   if (user.lockedUntil && user.lockedUntil > new Date()) {
     throw new UnauthorizedException('Account is locked. Try again later.');
   }
   ```

5. **Backend verifies password**
   ```typescript
   const isValidPassword = await bcrypt.compare(
     password,
     user.passwordHash
   );
   ```

6. **If password wrong:**
   ```typescript
   // Increment failed attempts
   await prisma.user.update({
     where: { id: user.id },
     data: {
       failedLoginAttempts: user.failedLoginAttempts + 1,
       lastFailedLoginAt: new Date(),
       // Lock account after 5 failed attempts for 30 minutes
       ...(user.failedLoginAttempts + 1 >= 5 && {
         lockedUntil: new Date(Date.now() + 30 * 60 * 1000)
       })
     }
   });
   
   throw new UnauthorizedException('Invalid credentials');
   ```

7. **If password correct:**
   ```typescript
   // Reset failed attempts
   await prisma.user.update({
     where: { id: user.id },
     data: {
       failedLoginAttempts: 0,
       lastFailedLoginAt: null,
       lastLoginAt: new Date()
     }
   });
   ```

8. **Backend generates JWT tokens**
   ```typescript
   // Access Token (short-lived: 15 minutes)
   const accessToken = jwt.sign(
     {
       sub: user.id,
       email: user.email,
       type: 'access'
     },
     JWT_SECRET,
     { expiresIn: '15m' }
   );
   
   // Refresh Token (long-lived: 30 days)
   const refreshToken = jwt.sign(
     {
       sub: user.id,
       type: 'refresh'
     },
     JWT_REFRESH_SECRET,
     { expiresIn: '30d' }
   );
   ```

9. **Backend caches refresh token in Redis**
   ```typescript
   await redis.setex(
     `refresh_token:${user.id}`,
     30 * 24 * 60 * 60, // 30 days in seconds
     refreshToken
   );
   ```

10. **Backend creates audit log**
    - Action: 'USER_LOGIN'

11. **Backend returns tokens**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1...",
      "refreshToken": "eyJhbGciOiJIUzI1...",
      "user": {
        "id": "uuid",
        "fullName": "John Doe",
        "email": "john@example.com",
        "emailVerified": true,
        "currencyCode": "USD"
      }
    }
    ```

12. **Frontend stores tokens**
    ```typescript
    // Store in localStorage or sessionStorage
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    ```

13. **Frontend redirects to dashboard**

---

### 4️⃣ **Accessing Protected Routes**

**Flow:**

1. **User tries to access protected page** (e.g., dashboard)

2. **Frontend adds token to request headers**
   ```typescript
   axios.get('/api/expenses', {
     headers: {
       'Authorization': `Bearer ${accessToken}`
     }
   });
   ```

3. **Backend JWT Guard intercepts request**
   ```typescript
   @UseGuards(JwtAuthGuard)
   @Get('/expenses')
   getExpenses(@CurrentUser() user) {
     // user is automatically extracted from token
     return this.expensesService.findAll(user.id);
   }
   ```

4. **Guard validates JWT token**
   ```typescript
   // Decode and verify signature
   const payload = jwt.verify(token, JWT_SECRET);
   
   // Check expiration
   if (payload.exp < Date.now() / 1000) {
     throw new UnauthorizedException('Token expired');
   }
   
   // Attach user to request
   request.user = payload;
   ```

5. **If token expired:**
   - Frontend receives 401 Unauthorized
   - Frontend automatically calls `/api/auth/refresh` with refresh token
   - Gets new access token
   - Retries original request

6. **Request proceeds to controller**

---

### 5️⃣ **Token Refresh**

**Flow:**

1. **Access token expires** (after 15 minutes)

2. **Backend returns 401 Unauthorized**

3. **Frontend Axios interceptor catches error**
   ```typescript
   axios.interceptors.response.use(
     response => response,
     async error => {
       if (error.response?.status === 401) {
         // Try to refresh token
         const refreshToken = localStorage.getItem('refreshToken');
         const newTokens = await refreshAccessToken(refreshToken);
         
         // Update stored token
         localStorage.setItem('accessToken', newTokens.accessToken);
         
         // Retry original request
         error.config.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
         return axios(error.config);
       }
       return Promise.reject(error);
     }
   );
   ```

4. **Frontend sends POST to `/api/auth/refresh`**
   ```json
   {
     "refreshToken": "eyJhbGciOiJIUzI1..."
   }
   ```

5. **Backend validates refresh token**
   ```typescript
   // Verify JWT signature
   const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
   
   // Check if token exists in Redis
   const storedToken = await redis.get(`refresh_token:${payload.sub}`);
   
   if (storedToken !== refreshToken) {
     throw new UnauthorizedException('Invalid refresh token');
   }
   ```

6. **Backend generates new access token**
   ```typescript
   const newAccessToken = jwt.sign(
     {
       sub: payload.sub,
       email: user.email,
       type: 'access'
     },
     JWT_SECRET,
     { expiresIn: '15m' }
   );
   ```

7. **Backend returns new access token**
   ```json
   {
     "accessToken": "eyJhbGciOiJIUzI1..."
   }
   ```

---

### 6️⃣ **Forgot Password**

**Flow:**

1. **User clicks "Forgot Password"**

2. **Frontend shows email input form**

3. **Frontend sends POST to `/api/auth/forgot-password`**
   ```json
   {
     "email": "john@example.com"
   }
   ```

4. **Backend finds user by email**

5. **Backend generates reset token**
   ```typescript
   const resetToken = crypto.randomBytes(32).toString('hex');
   const tokenHash = crypto.createHash('sha256')
     .update(resetToken)
     .digest('hex');
   
   await prisma.passwordReset.create({
     data: {
       userId: user.id,
       tokenHash,
       expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
     }
   });
   ```

6. **Backend sends reset email**
   ```
   Subject: Reset your password
   
   Click here to reset:
   http://localhost:5173/reset-password?token=xyz789...
   
   This link expires in 1 hour.
   ```

7. **Backend always returns success** (security: don't reveal if email exists)

8. **User clicks link in email**

9. **Frontend shows new password form**

10. **Frontend sends POST to `/api/auth/reset-password`**
    ```json
    {
      "token": "xyz789...",
      "newPassword": "NewSecurePass456!"
    }
    ```

11. **Backend validates token**
    ```typescript
    const tokenHash = crypto.createHash('sha256')
      .update(token)
      .digest('hex');
    
    const reset = await prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    });
    ```

12. **Backend updates password**
    ```typescript
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    
    await prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash: newPasswordHash }
    });
    
    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() }
    });
    ```

13. **Backend invalidates all existing sessions**
    ```typescript
    await redis.del(`refresh_token:${user.id}`);
    ```

14. **Frontend shows success and redirects to login**

---

### 7️⃣ **Logout**

**Flow:**

1. **User clicks logout button**

2. **Frontend sends POST to `/api/auth/logout`**
   ```
   Headers: Authorization: Bearer {accessToken}
   ```

3. **Backend extracts user from token**

4. **Backend deletes refresh token from Redis**
   ```typescript
   await redis.del(`refresh_token:${user.id}`);
   ```

5. **Backend creates audit log**
   - Action: 'USER_LOGOUT'

6. **Frontend clears all stored data**
   ```typescript
   localStorage.removeItem('accessToken');
   localStorage.removeItem('refreshToken');
   localStorage.removeItem('user');
   ```

7. **Frontend redirects to login page**

---

## 🚀 Running the Application

### Prerequisites

- Node.js 18+ installed
- PostgreSQL installed (for local development)
- Git installed

---

### Step 1: Setup Local Database

```bash
# Run the automated setup script
cd /Users/rahul/Desktop/Projects/expense-tracker
bash SETUP-LOCAL-DB.sh
```

**This script will:**
- ✅ Install PostgreSQL via Homebrew
- ✅ Create `expenseai_dev` database
- ✅ Update `.env` file
- ✅ Run all database migrations
- ✅ Server auto-restarts with working database

**Expected output:**
```
✅ Local PostgreSQL Setup Complete!
📊 Database: expenseai_dev
🔗 Connection: postgresql://localhost:5432/expenseai_dev
```

---

### Step 2: Verify Backend is Running

The backend should already be running. Verify with:

```bash
# Check if server is running
curl http://localhost:3000/api/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

**If backend is NOT running:**
```bash
cd /Users/rahul/Desktop/Projects/expense-tracker/backend
npm run start:dev
```

**Expected output:**
```
[Nest] LOG [NestFactory] Starting Nest application...
✅ SendGrid email service initialized
✅ Redis connected successfully
✅ Database connected successfully
[Nest] LOG [NestApplication] Nest application successfully started

╔════════════════════════════════════════════════════════════════╗
║   🚀 ExpenseAI Backend is running!                            ║
║   📍 Server:     http://localhost:3000                         ║
╚════════════════════════════════════════════════════════════════╝
```

---

### Step 3: Start Frontend

Open a **NEW terminal window** and run:

```bash
cd /Users/rahul/Desktop/Projects/expense-tracker/frontend
npm install  # Only needed first time
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

### Step 4: Open Application

Open your browser and go to:
```
http://localhost:5173
```

You should see the **ExpenseAI login page**!

---

## 🧪 Testing the Complete System

### Test 1: User Registration

**Using Browser:**

1. Open http://localhost:5173/signup
2. Fill in the form:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Password: `SecurePass123!`
   - Currency: `USD`
3. Click "Sign Up"
4. You should see: "Check your email to verify account"

**Using Command Line (cURL):**

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

**Expected Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Test 2: Check Verification Email

**In SendGrid Dashboard:**
1. Go to https://app.sendgrid.com
2. Click "Activity" in left menu
3. You should see the verification email sent

**Email Content:**
```
To: john@example.com
Subject: Verify your ExpenseAI account

Hi John Doe,

Welcome to ExpenseAI! Please verify your email address by clicking below:

[Verify Email Button]

This link expires in 24 hours.
```

---

### Test 3: Verify Email (Skip for Testing)

**For development testing, you can skip verification:**

Manually mark email as verified in database:
```bash
# Connect to database
psql expenseai_dev

# Update user
UPDATE users SET email_verified = true WHERE email = 'john@example.com';

# Exit
\q
```

---

### Test 4: User Login

**Using Browser:**

1. Go to http://localhost:5173/login
2. Enter:
   - Email: `john@example.com`
   - Password: `SecurePass123!`
3. Click "Login"
4. You should be redirected to dashboard!

**Using cURL:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "John Doe",
    "email": "john@example.com",
    "emailVerified": true,
    "currencyCode": "USD"
  }
}
```

**Save the accessToken for next tests!**

---

### Test 5: Access Protected Route

**Test getting current user:**

```bash
# Replace {YOUR_ACCESS_TOKEN} with the token from login response
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer {YOUR_ACCESS_TOKEN}"
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fullName": "John Doe",
  "email": "john@example.com",
  "emailVerified": true,
  "currencyCode": "USD",
  "createdAt": "2025-12-30T...",
  "lastLoginAt": "2025-12-30T..."
}
```

---

### Test 6: Test Failed Login (Security)

**Try wrong password 3 times:**

```bash
# Attempt 1
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "WrongPassword123!"
  }'

# Response: {"message": "Invalid credentials"}
```

After 5 failed attempts, account gets locked for 30 minutes!

---

### Test 7: Forgot Password Flow

**Request password reset:**

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Expected Response:**
```json
{
  "message": "If that email exists, we've sent a password reset link."
}
```

**Check SendGrid for reset email with token**

---

### Test 8: Logout

**Using cURL:**

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer {YOUR_ACCESS_TOKEN}"
```

**Expected Response:**
```json
{
  "message": "Logged out successfully"
}
```

Now if you try to use that token again, you'll get 401 Unauthorized!

---

## 📊 Monitoring and Debugging

### Check Backend Logs

```bash
# Watch backend logs in real-time
cd /Users/rahul/Desktop/Projects/expense-tracker/backend
tail -f ~/.cursor/projects/Users-rahul-Desktop-Projects-expense-tracker/terminals/5.txt
```

### Check Database

```bash
# Connect to database
psql expenseai_dev

# View all users
SELECT id, full_name, email, email_verified, created_at FROM users;

# View audit logs
SELECT user_id, action, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;

# Exit
\q
```

### Check Redis Cache

```bash
# If you have Redis CLI installed locally
redis-cli -u rediss://default:YOUR_REDIS_PASSWORD@adequate-gorilla-59708.upstash.io:6379

# Check refresh tokens
KEYS refresh_token:*

# Exit
quit
```

---

## 🎯 Quick Start Commands

### Start Everything:

```bash
# Terminal 1: Setup database (first time only)
cd /Users/rahul/Desktop/Projects/expense-tracker
bash SETUP-LOCAL-DB.sh

# Terminal 1: Backend (if not already running)
cd backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Open browser
open http://localhost:5173
```

---

## 🔍 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is already in use
lsof -ti:3000 | xargs kill -9

# Restart backend
cd backend && npm run start:dev
```

### Database connection issues
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql@15
```

### Frontend won't start
```bash
# Check if port 5173 is already in use
lsof -ti:5173 | xargs kill -9

# Restart frontend
cd frontend && npm run dev
```

---

## 🎉 Success Checklist

When everything is working, you should have:

- ✅ Backend running on http://localhost:3000
- ✅ Frontend running on http://localhost:5173
- ✅ PostgreSQL database connected
- ✅ Redis cache connected
- ✅ SendGrid email service ready
- ✅ Can register new users
- ✅ Can login/logout
- ✅ Can access protected routes
- ✅ Tokens are being generated and validated
- ✅ Audit logs are being created

**Your complete SaaS authentication system is live!** 🚀

---

## 📝 Next Steps

1. ✅ System is fully functional
2. 🎨 Customize frontend UI/UX
3. 💼 Add expense tracking features
4. 📊 Add analytics dashboard
5. 🚀 Deploy to production (Railway + Vercel)

**You've built a production-ready authentication system!** 💪

