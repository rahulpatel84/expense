# 🧪 Authentication Testing Guide

## Overview

This guide shows you how to test the authentication endpoints we just built:
- POST /auth/signup - Create new user account
- POST /auth/login - Authenticate existing user

---

## ✅ What We've Built

### Backend Components:
1. **DTOs (Data Transfer Objects)**
   - [signup.dto.ts](src/auth/dto/signup.dto.ts) - Validates signup requests
   - [login.dto.ts](src/auth/dto/login.dto.ts) - Validates login requests

2. **Service (Business Logic)**
   - [auth.service.ts](src/auth/auth.service.ts) - Password hashing, JWT generation, login attempts tracking

3. **Controller (HTTP Endpoints)**
   - [auth.controller.ts](src/auth/auth.controller.ts) - POST /auth/signup and /auth/login

4. **Module (Configuration)**
   - [auth.module.ts](src/auth/auth.module.ts) - Wires everything together

### Database:
- Users table with:
  - Password hash (bcrypt with 10 salt rounds)
  - Failed login attempts tracking
  - Account lockout (after 5 failed attempts for 15 minutes)
  - Email verification status

---

## 🚀 Test 1: Valid Signup

**What this tests:** Creating a new user account with valid data

**Command:**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"MySecure123@","fullName":"John Doe"}'
```

**Expected Response (201 Created):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "c63e040b-265f-4734-b19f-25e07c0f64b1",
    "email": "john@example.com",
    "fullName": "John Doe",
    "emailVerified": false
  }
}
```

**What happens behind the scenes:**
1. ValidationPipe validates SignupDto
2. AuthService checks email doesn't exist
3. Password "MySecure123@" → bcrypt hash "$2b$10$..."
4. User created in database
5. JWT tokens generated (access: 15min, refresh: 7days)
6. Tokens and user info returned

**Check the database:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 \
  -c "SELECT id, email, full_name, email_verified, failed_login_attempts FROM users;"
```

You should see:
```
                  id                  |      email       | full_name | email_verified | failed_login_attempts
--------------------------------------+------------------+-----------+----------------+-----------------------
 c63e040b-265f-4734-b19f-25e07c0f64b1 | john@example.com | John Doe  | f              |                     0
```

---

## 🚀 Test 2: Valid Login

**What this tests:** Logging in with correct credentials

**Command:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"MySecure123@"}'
```

**Expected Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "c63e040b-265f-4734-b19f-25e07c0f64b1",
    "email": "john@example.com",
    "fullName": "John Doe",
    "emailVerified": false
  }
}
```

**What happens behind the scenes:**
1. ValidationPipe validates LoginDto
2. AuthService finds user by email
3. AuthService checks account not locked
4. bcrypt.compare() verifies password hash
5. Failed login attempts reset to 0
6. New JWT tokens generated
7. Tokens and user info returned

---

## ❌ Test 3: Signup with Duplicate Email

**What this tests:** Trying to signup with email that already exists

**Command:**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"MySecure123@","fullName":"Jane Doe"}'
```

**Expected Response (409 Conflict):**
```json
{
  "message": "Email already registered. Please login or use a different email.",
  "error": "Conflict",
  "statusCode": 409
}
```

This prevents duplicate accounts!

---

## ❌ Test 4: Signup with Invalid Email

**What this tests:** Email validation

**Command:**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"MySecure123@","fullName":"John Doe"}'
```

**Expected Response (400 Bad Request):**
```json
{
  "message": [
    "Please provide a valid email address (e.g., user@example.com)"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Other invalid emails to try:**
```bash
# Missing @ symbol
'{"email":"userexample.com","password":"MySecure123@","fullName":"John Doe"}'

# Missing domain
'{"email":"user@","password":"MySecure123@","fullName":"John Doe"}'

# Missing local part
'{"email":"@example.com","password":"MySecure123@","fullName":"John Doe"}'
```

All should return 400 Bad Request!

---

## ❌ Test 5: Signup with Weak Password

**What this tests:** Password strength validation

**Test 5a: Too short (less than 8 characters)**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Short1@","fullName":"Test User"}'
```

**Expected Response:**
```json
{
  "message": [
    "Password must be at least 8 characters long"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Test 5b: No uppercase letter**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"lowercase123@","fullName":"Test User"}'
```

**Expected Response:**
```json
{
  "message": [
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Test 5c: No lowercase letter**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"UPPERCASE123@","fullName":"Test User"}'
```

**Test 5d: No number**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"NoNumber@@@","fullName":"Test User"}'
```

**Test 5e: No special character**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"NoSpecial123","fullName":"Test User"}'
```

All should return 400 Bad Request explaining what's missing!

---

## ❌ Test 6: Signup with Missing Fields

**Test 6a: Missing email**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"password":"MySecure123@","fullName":"Test User"}'
```

**Test 6b: Missing password**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","fullName":"Test User"}'
```

**Test 6c: Missing fullName**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"MySecure123@"}'
```

**Expected Response (for each):**
```json
{
  "message": [
    "Please provide a valid email address (e.g., user@example.com)"
    // OR
    "Password is required"
    // OR
    "Full name is required"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## ❌ Test 7: Login with Wrong Password

**What this tests:** Failed login tracking

**Command:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"WrongPassword123@"}'
```

**Expected Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**Important:** Notice it doesn't say "wrong password" - just "Invalid credentials"
This is for security (prevents email enumeration)

**Check database after failed attempt:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 \
  -c "SELECT email, failed_login_attempts, last_failed_login_at FROM users WHERE email='john@example.com';"
```

You should see:
```
      email       | failed_login_attempts |   last_failed_login_at
------------------+-----------------------+---------------------------
 john@example.com |                     1 | 2026-01-01 13:05:00.123
```

Failed attempts counter increased!

---

## ❌ Test 8: Account Lockout (5 Failed Attempts)

**What this tests:** Brute force protection

**Try 4 more wrong passwords:**
```bash
# Attempt 2
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Wrong2@"}'

# Attempt 3
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Wrong3@"}'

# Attempt 4
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Wrong4@"}'

# Attempt 5 (this will lock the account!)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Wrong5@"}'
```

**After 5th attempt, expected response:**
```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**Now try with CORRECT password:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"MySecure123@"}'
```

**Expected Response (401 Unauthorized):**
```json
{
  "message": "Account locked due to too many failed login attempts. Please try again in 15 minutes or reset your password.",
  "error": "Unauthorized",
  "statusCode": 401
}
```

Even with correct password, account is locked!

**Check database:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 \
  -c "SELECT email, failed_login_attempts, locked_until FROM users WHERE email='john@example.com';"
```

```
      email       | failed_login_attempts |       locked_until
------------------+-----------------------+---------------------------
 john@example.com |                     5 | 2026-01-01 13:20:00.123
```

Account locked for 15 minutes!

---

## ✅ Test 9: Successful Login After Failed Attempts

**Wait 15 minutes** (or manually unlock account in database for testing)

**To manually unlock for testing:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 \
  -c "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email='john@example.com';"
```

**Now try login again:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"MySecure123@"}'
```

**Expected Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

Success! Failed attempts reset to 0!

---

## 🔍 Decoding JWT Tokens

JWT tokens contain 3 parts separated by dots: `header.payload.signature`

**Copy an access token from a successful signup/login response**

**Decode it at:** https://jwt.io

You'll see:
```json
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "c63e040b-265f-4734-b19f-25e07c0f64b1",  // User ID
  "email": "john@example.com",                    // User email
  "iat": 1767272721,                              // Issued at (Unix timestamp)
  "exp": 1767273621                               // Expires at (Unix timestamp)
}

// Signature (verified by server)
```

**Important Notes:**
- Anyone can decode the token (it's BASE64, not encrypted!)
- Never put sensitive data in JWT payload
- Signature proves token wasn't tampered with
- Only server can verify signature (requires JWT_SECRET)

**Token Expiration:**
- Access Token: 15 minutes (900 seconds)
- Refresh Token: 7 days (604800 seconds)

---

## 📊 Database Queries for Testing

### View all users:
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 \
  -c "SELECT id, email, full_name, email_verified, failed_login_attempts, locked_until FROM users;"
```

### View password hash (educational purposes):
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 \
  -c "SELECT email, password_hash FROM users WHERE email='john@example.com';"
```

You'll see something like:
```
      email       |                         password_hash
------------------+----------------------------------------------------------------
 john@example.com | $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

This is the bcrypt hash - original password can't be recovered!

### Delete a user (for retesting signup):
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 \
  -c "DELETE FROM users WHERE email='john@example.com';"
```

### Reset failed attempts:
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 \
  -c "UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_failed_login_at = NULL WHERE email='john@example.com';"
```

---

## 🎯 Summary of What Works

✅ **Signup:**
- Email validation (format check)
- Password strength validation (8+ chars, uppercase, lowercase, number, special char)
- Full name required
- Duplicate email prevention
- Password hashing with bcrypt
- JWT token generation
- User creation in database

✅ **Login:**
- Email and password validation
- Password verification with bcrypt
- Failed attempt tracking
- Account lockout after 5 failed attempts
- 15-minute lockout duration
- JWT token generation
- Generic error messages (security)

✅ **Security Features:**
- Passwords never stored in plain text
- bcrypt salt rounds: 10 (industry standard)
- JWT tokens signed with secret key
- Vague error messages (no email enumeration)
- Account lockout (brute force protection)
- CORS enabled for frontend only
- Validation at multiple layers (DTO, business logic)

---

## 🚀 Next Steps

What we've completed:
1. ✅ Authentication backend (signup, login)
2. ✅ Password hashing and verification
3. ✅ JWT token generation
4. ✅ Input validation
5. ✅ Security features (lockout, failed attempts)

What's next:
1. **JWT Strategy** - Verify tokens on protected routes
2. **Protected Endpoints** - Create endpoints that require authentication
3. **Refresh Token Endpoint** - Get new access token when it expires
4. **Frontend** - Build React login/signup pages
5. **Deploy to Production** - Move to cloud (Supabase, Railway)

Congratulations! You now have a fully functional authentication system! 🎉
