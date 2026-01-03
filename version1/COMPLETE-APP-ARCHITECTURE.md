# 🏗️ Complete Application Architecture Guide

## Overview: What We're Building

A full-stack expense tracker with complete authentication:

```
Frontend (React + Vite + TailwindCSS)
├── Landing Page (public)
├── Login Page (public)
├── Signup Page (public)
├── Forgot Password (public)
├── Reset Password (public)
└── Dashboard (protected - requires login)

Backend (NestJS + PostgreSQL + Prisma)
├── POST /auth/signup - Create account
├── POST /auth/login - Authenticate
├── POST /auth/refresh - Refresh access token
├── POST /auth/forgot-password - Request password reset
├── POST /auth/reset-password - Reset password with token
└── GET /user/profile - Get user info (protected)
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                    (React + Vite)                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Landing Page → Login/Signup → Dashboard                    │
│       │            │              │                          │
│       │            │              │                          │
│       │            ▼              ▼                          │
│       │      AuthService    Protected Routes                │
│       │            │              │                          │
│       │            │              │                          │
│       └────────────┴──────────────┘                          │
│                    │                                         │
│                    │ HTTP Requests                           │
│                    ▼                                         │
└────────────────────┼─────────────────────────────────────────┘
                     │
                     │ CORS: localhost:5173
                     │
┌────────────────────▼─────────────────────────────────────────┐
│                         BACKEND                              │
│                    (NestJS + Prisma)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Controllers (HTTP Layer)                                   │
│  ├── AuthController                                         │
│  │   ├── POST /auth/signup                                  │
│  │   ├── POST /auth/login                                   │
│  │   ├── POST /auth/refresh                                 │
│  │   ├── POST /auth/forgot-password                         │
│  │   └── POST /auth/reset-password                          │
│  │                                                           │
│  └── UserController                                         │
│      └── GET /user/profile (JWT protected)                  │
│                                                              │
│  ──────────────────────────────────────────                 │
│                                                              │
│  Services (Business Logic)                                  │
│  ├── AuthService                                            │
│  │   ├── signup() - Hash password, create user             │
│  │   ├── login() - Verify password, generate tokens        │
│  │   ├── refreshToken() - Verify & generate new token      │
│  │   ├── forgotPassword() - Generate reset token           │
│  │   └── resetPassword() - Validate token, update password │
│  │                                                           │
│  └── UserService                                            │
│      └── getProfile() - Fetch user data                     │
│                                                              │
│  ──────────────────────────────────────────                 │
│                                                              │
│  Database Layer (Prisma ORM)                                │
│  └── PrismaService                                          │
│      └── Database connection + queries                      │
│                                                              │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ PostgreSQL Connection
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│                    (PostgreSQL)                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tables:                                                    │
│  ├── users (id, email, password_hash, full_name, ...)      │
│  ├── password_resets (id, user_id, token, expires_at)      │
│  ├── email_verifications (id, user_id, token, ...)         │
│  └── audit_logs (id, user_id, action, timestamp)           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Examples

### 1. Signup Flow

```
User fills signup form
  ↓
[Frontend]
  → Validates input (email format, password strength)
  → POST /auth/signup with {email, password, fullName}
  ↓
[Backend - Controller]
  → Receives request
  → DTO validates data again
  → Calls AuthService.signup()
  ↓
[Backend - Service]
  → Checks if email exists (409 if duplicate)
  → Hashes password with bcrypt (10 salt rounds)
  → Creates user in database
  → Generates JWT tokens (access + refresh)
  → Returns tokens + user info
  ↓
[Frontend]
  → Stores tokens in localStorage
  → Updates AuthContext state
  → Redirects to dashboard
  → User is logged in! ✅
```

### 2. Login Flow

```
User enters credentials
  ↓
[Frontend]
  → POST /auth/login with {email, password}
  ↓
[Backend - Controller]
  → DTO validates input
  → Calls AuthService.login()
  ↓
[Backend - Service]
  → Find user by email (404 if not found)
  → Check if account locked (429 if locked)
  → Verify password with bcrypt.compare()
  → If wrong: Increment failed attempts, maybe lock account
  → If correct: Reset failed attempts, generate tokens
  → Returns tokens + user info
  ↓
[Frontend]
  → Stores tokens
  → Redirects to dashboard
  → User logged in! ✅
```

### 3. Protected Route Access

```
User navigates to /dashboard
  ↓
[Frontend - ProtectedRoute]
  → Checks if accessToken exists
  → If not: Redirect to /login
  → If yes: Allow access
  ↓
[Dashboard Component]
  → Calls fetchWithAuth('/user/profile')
  ↓
[Frontend - fetchWithAuth]
  → Adds header: Authorization: Bearer <accessToken>
  → Makes request
  ↓
[Backend - JwtAuthGuard]
  → Extracts token from header
  → Verifies signature with JWT_SECRET
  → Checks expiration
  → If valid: Extracts user ID, adds to request
  → If invalid: Returns 401 Unauthorized
  ↓
[Backend - Controller]
  → req.user contains authenticated user info
  → Calls UserService.getProfile(userId)
  ↓
[Backend - Service]
  → Queries database for user
  → Returns user data
  ↓
[Frontend]
  → Receives user data
  → Displays in dashboard
```

### 4. Token Refresh Flow

```
Access token expires (after 15 min)
  ↓
[Dashboard]
  → Tries to fetch data
  → GET /user/profile with expired token
  ↓
[Backend]
  → JWT verification fails
  → Returns 401 Unauthorized
  ↓
[Frontend - fetchWithAuth]
  → Detects 401 status
  → Automatically calls refreshAccessToken()
  ↓
[Frontend - refreshAccessToken]
  → POST /auth/refresh with refreshToken
  ↓
[Backend - AuthService]
  → Verifies refresh token signature
  → Checks expiration (7 days)
  → Verifies user still exists
  → Generates new access token
  → Returns new access token
  ↓
[Frontend]
  → Stores new access token
  → Retries original request with new token
  → Request succeeds! ✅
  → User never noticed! 😊
```

### 5. Forgot Password Flow

```
User clicks "Forgot Password"
  ↓
[Frontend - ForgotPassword Page]
  → User enters email
  → POST /auth/forgot-password with {email}
  ↓
[Backend - AuthService]
  → Find user by email
  → Generate random reset token (crypto.randomBytes)
  → Hash token and store in password_resets table
  → Set expiration (1 hour)
  → Send email with reset link:
    https://yourapp.com/reset-password?token=abc123
  → Returns success message
  ↓
[Frontend]
  → Shows "Check your email" message
  ↓
[User's Email]
  → Receives email with reset link
  → Clicks link
  ↓
[Frontend - ResetPassword Page]
  → Extracts token from URL
  → Shows "Enter new password" form
  → User enters new password
  → POST /auth/reset-password with {token, newPassword}
  ↓
[Backend - AuthService]
  → Find password reset by token hash
  → Check if expired (401 if expired)
  → Verify token is valid
  → Hash new password
  → Update user's password
  → Delete password reset token
  → Returns success
  ↓
[Frontend]
  → Shows "Password reset successful"
  → Redirects to login
  → User can login with new password! ✅
```

---

## Security Measures Explained

### 1. Password Security

**Hashing with bcrypt:**
```typescript
// Signup: Store hash, not password
const hash = await bcrypt.hash(password, 10);
// Stores: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

// Login: Compare hash
const valid = await bcrypt.compare(password, hash);
// Returns: true or false
```

**Why secure:**
- Original password can't be recovered
- Each hash is unique (due to salt)
- Slow to compute (prevents brute force)
- Industry standard (banks use it)

---

### 2. JWT Token Security

**Token Structure:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9     ← Header (base64)
.
eyJzdWIiOiJ1c2VyLWlkIiwiZW1haWwiOiIuLi4ifQ ← Payload (base64)
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c   ← Signature (HMAC-SHA256)
```

**How signing works:**
```typescript
// Server creates signature
const signature = HMAC_SHA256(
  base64(header) + "." + base64(payload),
  JWT_SECRET // Only server knows this!
);

// Attacker tries to modify payload:
Modified payload: {"sub": "admin-id", "email": "hacker@evil.com"}

// But signature won't match!
Server recalculates: HMAC_SHA256(modified_payload, JWT_SECRET)
Result: Different signature → Token rejected! ❌
```

---

### 3. Account Lockout

**Prevents brute force attacks:**
```typescript
Failed attempts tracking:
  Attempt 1: Wrong password → failed_attempts = 1
  Attempt 2: Wrong password → failed_attempts = 2
  Attempt 3: Wrong password → failed_attempts = 3
  Attempt 4: Wrong password → failed_attempts = 4
  Attempt 5: Wrong password → failed_attempts = 5
    └─ Account locked for 15 minutes!

Even correct password won't work until lock expires.

After 15 minutes:
  → Lock expires
  → User can try again
  → Successful login resets counter to 0
```

---

### 4. CORS Protection

**What CORS does:**
```
Allowed origin: http://localhost:5173 (our frontend)

Request from localhost:5173:
  Browser: "Can I access localhost:3001?"
  Server: "Yes, localhost:5173 is allowed"
  → Request succeeds ✅

Request from evil.com:
  Browser: "Can I access localhost:3001?"
  Server: "No, evil.com is not allowed"
  → Browser blocks request ❌
```

---

### 5. Input Validation (Multi-Layer)

**Layer 1 - Frontend:**
```jsx
// Client-side validation (UX)
if (!email.includes('@')) {
  setError('Invalid email');
  return; // Don't send request
}
```

**Layer 2 - DTO:**
```typescript
// Server-side validation (security)
@IsEmail()
email: string; // Validates format

// Client can bypass frontend, but NOT this!
```

**Layer 3 - Business Logic:**
```typescript
// Database/logic validation
const existing = await prisma.user.findUnique({
  where: { email }
});

if (existing) {
  throw new ConflictException('Email exists');
}
```

**Layer 4 - Database:**
```sql
-- Database constraints (last defense)
CREATE UNIQUE INDEX ON users(email);
-- Prevents duplicate emails even in race conditions
```

---

## Frontend Architecture

### Component Hierarchy

```
App
├── AuthProvider (global auth state)
│   ├── Landing Page (/)
│   ├── Login Page (/login)
│   ├── Signup Page (/signup)
│   ├── Forgot Password (/forgot-password)
│   ├── Reset Password (/reset-password)
│   └── Protected Routes
│       └── Dashboard (/dashboard)
│
└── Services
    ├── authService.js (API calls)
    └── logger.js (detailed logging)
```

### State Management

**AuthContext provides:**
```javascript
{
  user: { id, email, fullName } | null,
  isLoggedIn: boolean,
  loading: boolean,
  login: (email, password) => Promise,
  signup: (email, password, fullName) => Promise,
  logout: () => void,
  forgotPassword: (email) => Promise,
  resetPassword: (token, newPassword) => Promise
}
```

---

## Backend Architecture

### Module Structure

```
AppModule (root)
├── PrismaModule (database)
│   └── PrismaService
│
└── AuthModule (authentication)
    ├── AuthController (HTTP endpoints)
    ├── AuthService (business logic)
    ├── DTOs (validation)
    │   ├── SignupDto
    │   ├── LoginDto
    │   ├── RefreshTokenDto
    │   ├── ForgotPasswordDto
    │   └── ResetPasswordDto
    └── Guards
        └── JwtAuthGuard (protect routes)
```

---

## Database Schema

```prisma
model User {
  id                  String    @id @default(uuid())
  email               String    @unique
  passwordHash        String?
  fullName            String
  emailVerified       Boolean   @default(false)
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  lastLoginAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  passwordResets      PasswordReset[]
  emailVerifications  EmailVerification[]
  auditLogs           AuditLog[]
}

model PasswordReset {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique  // Hashed reset token
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}
```

---

## Logging Strategy

### Frontend Logging

```javascript
// Every action is logged with:
// - Timestamp
// - Action type
// - Result (success/failure)
// - Error details (if failed)

console.log('🔐 [AUTH] Login attempt:', email);
console.log('✅ [AUTH] Login successful');
console.error('❌ [AUTH] Login failed:', error.message);
```

### Backend Logging

```typescript
// NestJS built-in logger + custom logs

console.log('📝 POST /auth/signup - New signup request');
console.log('✅ Email is available');
console.log('🔒 Hashing password...');
console.log('✅ Password hashed successfully');
console.log('💾 Creating user in database...');
console.log('✅ User created with ID:', user.id);
console.log('🎉 Signup successful for:', user.email);
```

---

## API Endpoints Summary

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| /auth/signup | POST | No | Create new account |
| /auth/login | POST | No | Authenticate user |
| /auth/refresh | POST | No | Get new access token |
| /auth/forgot-password | POST | No | Request password reset |
| /auth/reset-password | POST | No | Reset password with token |
| /user/profile | GET | Yes (JWT) | Get user profile |
| /user/profile | PATCH | Yes (JWT) | Update profile |

---

## Next Steps

I'll now build:
1. ✅ Complete frontend with all pages
2. ✅ Backend password reset endpoints
3. ✅ Comprehensive API documentation
4. ✅ Detailed logging throughout
5. ✅ Testing guide

Let's start building! 🚀
