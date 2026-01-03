# 🔐 Authentication System - Complete Explanation

## What is Authentication?

**Simple Definition:** Proving you are who you say you are.

**Real World Analogy:**
- **Signup** = Creating a bank account (provide ID, choose password)
- **Login** = Using ATM (enter card + PIN to prove it's you)
- **JWT Token** = ATM receipt (proves you withdrew money, expires after time)

---

## 🔑 Password Hashing - Why We Never Store Passwords

### ❌ WRONG WAY (Never do this!):
```
User signs up with password: "MyPassword123"
Database stores: "MyPassword123"

Problem:
- If database hacked, attacker has everyone's passwords
- Employees can see passwords
- User uses same password on other sites = disaster
```

### ✅ RIGHT WAY (Hashing):
```
User signs up with password: "MyPassword123"
bcrypt hashes it: "$2b$12$abcd1234...xyz789" (60 random characters)
Database stores: "$2b$12$abcd1234...xyz789"

Benefits:
- Can't reverse the hash to get original password
- Every user's hash is different (even if same password)
- If database hacked, attacker gets useless gibberish
```

### How Bcrypt Works:

**Signup (Hashing):**
```javascript
Input: "MyPassword123"
↓
Bcrypt generates random "salt": "abcd1234"
↓
Combines: "MyPassword123" + "abcd1234"
↓
Hashes 4096 times (2^12 rounds)
↓
Output: "$2b$12$abcd1234...xyz789"
```

**Login (Verification):**
```javascript
User enters: "MyPassword123"
Database has: "$2b$12$abcd1234...xyz789"
↓
Extract salt from hash: "abcd1234"
↓
Hash input with same salt and rounds
↓
Compare: New hash === Stored hash?
↓
If match → Password correct!
If different → Password wrong!
```

**Why bcrypt is slow (on purpose!):**
- Takes ~200ms to hash one password
- Attacker trying 1 million passwords = 200,000 seconds = 55 hours
- Regular login = 200ms (fine for user)
- Brute force attack = impossibly slow

---

## 🎫 JWT (JSON Web Tokens) - Explained Simply

### What is a JWT?

A **JWT** is like a **concert ticket**:
- Has your name (user ID)
- Has what you can do (permissions)
- Has expiration time
- Has venue signature (can't be faked)

### JWT Structure:

A JWT looks like this:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6ImpvaG5AZW1haWwuY29tIiwiaWF0IjoxNzAzNzc3MDAwLCJleHAiOjE3MDM3Nzc5MDB9.XYZ789abc
```

It has **3 parts** separated by dots (`.`):

**Part 1: Header**
```json
{
  "alg": "HS256",      // Algorithm used to sign
  "typ": "JWT"         // Type of token
}
```

**Part 2: Payload (Data)**
```json
{
  "userId": "uuid-123",
  "email": "john@email.com",
  "iat": 1703777000,   // Issued at timestamp
  "exp": 1703777900    // Expires at timestamp (15 min later)
}
```

**Part 3: Signature**
```
HMAC-SHA256(
  base64(header) + "." + base64(payload),
  SECRET_KEY
)
```

### Why JWT is Secure:

**Scenario 1: Hacker tries to change user ID**
```
Original token payload:
{ "userId": "user-123", "email": "john@email.com" }

Hacker changes to:
{ "userId": "admin-999", "email": "admin@email.com" }

When server verifies:
- Server re-calculates signature with SECRET_KEY
- Signature doesn't match!
- Token rejected ❌
```

**Scenario 2: Hacker tries to create fake token**
```
Hacker creates token:
{ "userId": "admin-999" }

Problem: Hacker doesn't know SECRET_KEY
↓
Can't create valid signature
↓
Server rejects token ❌
```

**Only way to create valid token:**
- Must have SECRET_KEY
- Only our backend server has it
- SECRET_KEY never leaves server

---

## 🔄 Complete Authentication Flow

### 1️⃣ SIGNUP FLOW

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: User Fills Signup Form                          │
└─────────────────────────────────────────────────────────┘
User enters:
- Full Name: "John Doe"
- Email: "john@email.com"
- Password: "MySecurePass123"

↓ Frontend validates (basic checks)

┌─────────────────────────────────────────────────────────┐
│ Step 2: Frontend Sends Request                          │
└─────────────────────────────────────────────────────────┘
POST /auth/signup
Body: {
  "fullName": "John Doe",
  "email": "john@email.com",
  "password": "MySecurePass123"
}

↓ Request arrives at backend

┌─────────────────────────────────────────────────────────┐
│ Step 3: Backend Validates Data                          │
└─────────────────────────────────────────────────────────┘
Checks:
✓ Is email format valid? (has @, has domain)
✓ Is password strong enough? (8+ chars, uppercase, lowercase, number)
✓ Does email already exist in database?

If any check fails → Return 400 Bad Request

↓ All checks pass

┌─────────────────────────────────────────────────────────┐
│ Step 4: Hash Password                                   │
└─────────────────────────────────────────────────────────┘
bcrypt.hash("MySecurePass123", 12)
↓ Takes ~200ms
Result: "$2b$12$abcd1234...xyz789"

↓

┌─────────────────────────────────────────────────────────┐
│ Step 5: Create User in Database                         │
└─────────────────────────────────────────────────────────┘
INSERT INTO users (
  id,
  full_name,
  email,
  password_hash,
  created_at
) VALUES (
  'uuid-generated',
  'John Doe',
  'john@email.com',
  '$2b$12$abcd1234...xyz789',
  '2024-01-15 10:30:00'
)

↓ User created

┌─────────────────────────────────────────────────────────┐
│ Step 6: Generate JWT Token                              │
└─────────────────────────────────────────────────────────┘
jwt.sign(
  { userId: "uuid-generated", email: "john@email.com" },
  SECRET_KEY,
  { expiresIn: "15m" }
)
↓
Result: "eyJhbGci...XYZ789abc"

↓

┌─────────────────────────────────────────────────────────┐
│ Step 7: Send Response                                   │
└─────────────────────────────────────────────────────────┘
Response: {
  "success": true,
  "message": "Account created successfully!",
  "data": {
    "accessToken": "eyJhbGci...XYZ789abc",
    "user": {
      "id": "uuid-generated",
      "fullName": "John Doe",
      "email": "john@email.com",
      "emailVerified": false
    }
  }
}

↓ Frontend receives response

┌─────────────────────────────────────────────────────────┐
│ Step 8: Frontend Stores Token                           │
└─────────────────────────────────────────────────────────┘
localStorage.setItem('accessToken', 'eyJhbGci...XYZ789abc')
localStorage.setItem('user', JSON.stringify(user))

↓

┌─────────────────────────────────────────────────────────┐
│ Step 9: Redirect to Dashboard                           │
└─────────────────────────────────────────────────────────┘
User is now logged in! 🎉
```

---

### 2️⃣ LOGIN FLOW

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: User Enters Credentials                         │
└─────────────────────────────────────────────────────────┘
Email: "john@email.com"
Password: "MySecurePass123"

↓

┌─────────────────────────────────────────────────────────┐
│ Step 2: Frontend Sends Request                          │
└─────────────────────────────────────────────────────────┘
POST /auth/login
Body: {
  "email": "john@email.com",
  "password": "MySecurePass123"
}

↓

┌─────────────────────────────────────────────────────────┐
│ Step 3: Find User in Database                           │
└─────────────────────────────────────────────────────────┘
SELECT * FROM users WHERE email = 'john@email.com'

If not found → Return "Invalid credentials"
(Don't say "email not found" - security best practice)

↓ User found

┌─────────────────────────────────────────────────────────┐
│ Step 4: Check Account Status                            │
└─────────────────────────────────────────────────────────┘
Checks:
- Is account locked? (locked_until > now)
  If yes → Return "Account locked. Try again in X minutes"

↓ Account not locked

┌─────────────────────────────────────────────────────────┐
│ Step 5: Verify Password                                 │
└─────────────────────────────────────────────────────────┘
bcrypt.compare(
  "MySecurePass123",              // User input
  "$2b$12$abcd1234...xyz789"     // Hash from database
)
↓ Takes ~200ms
Result: true or false

If FALSE:
  ↓
  ┌────────────────────────────────────────────────────┐
  │ Increment failed login attempts                    │
  └────────────────────────────────────────────────────┘
  failed_login_attempts = failed_login_attempts + 1

  If failed_login_attempts >= 5:
    → Lock account for 30 minutes
    → locked_until = now + 30 minutes

  Return "Invalid credentials"

If TRUE:
  ↓ Password correct!

┌─────────────────────────────────────────────────────────┐
│ Step 6: Reset Failed Attempts                           │
└─────────────────────────────────────────────────────────┘
UPDATE users SET
  failed_login_attempts = 0,
  last_login_at = NOW()
WHERE id = 'user-id'

↓

┌─────────────────────────────────────────────────────────┐
│ Step 7: Generate JWT Token                              │
└─────────────────────────────────────────────────────────┘
jwt.sign(
  { userId: "uuid", email: "john@email.com" },
  SECRET_KEY,
  { expiresIn: "15m" }
)

↓

┌─────────────────────────────────────────────────────────┐
│ Step 8: Log Audit Event                                 │
└─────────────────────────────────────────────────────────┘
INSERT INTO audit_logs (
  user_id,
  action,
  ip_address,
  created_at
) VALUES (
  'user-id',
  'USER_LOGIN',
  '192.168.1.1',
  NOW()
)

↓

┌─────────────────────────────────────────────────────────┐
│ Step 9: Send Response                                   │
└─────────────────────────────────────────────────────────┘
Response: {
  "success": true,
  "message": "Login successful!",
  "data": {
    "accessToken": "eyJhbGci...XYZ789abc",
    "user": { ... }
  }
}

↓

User logged in! 🎉
```

---

### 3️⃣ MAKING AUTHENTICATED REQUESTS

```
┌─────────────────────────────────────────────────────────┐
│ User wants to view expenses                             │
└─────────────────────────────────────────────────────────┘

↓

┌─────────────────────────────────────────────────────────┐
│ Frontend Sends Request with Token                       │
└─────────────────────────────────────────────────────────┘
GET /api/expenses
Headers:
  Authorization: Bearer eyJhbGci...XYZ789abc

↓

┌─────────────────────────────────────────────────────────┐
│ Backend JWT Guard Intercepts                            │
└─────────────────────────────────────────────────────────┘

Step 1: Extract token from header
  "Bearer eyJhbGci...XYZ789abc" → "eyJhbGci...XYZ789abc"

Step 2: Verify signature
  jwt.verify(token, SECRET_KEY)
  ↓
  If invalid signature → Reject ❌
  If expired → Reject ❌

Step 3: Decode payload
  {
    "userId": "uuid-123",
    "email": "john@email.com",
    "iat": 1703777000,
    "exp": 1703777900
  }

Step 4: Attach user to request
  request.user = { userId: "uuid-123", email: "john@email.com" }

↓ Token valid

┌─────────────────────────────────────────────────────────┐
│ Controller Processes Request                            │
└─────────────────────────────────────────────────────────┘
Controller can now access:
  request.user.userId → "uuid-123"

Query database:
  SELECT * FROM expenses WHERE user_id = 'uuid-123'

Return only THIS user's expenses (security!)

↓

Response sent 🎉
```

---

## 🔒 Security Measures

### 1. Password Requirements
```
✓ Minimum 8 characters
✓ At least 1 uppercase letter (A-Z)
✓ At least 1 lowercase letter (a-z)
✓ At least 1 number (0-9)
✗ Weak: "password" → Rejected
✗ Weak: "12345678" → Rejected
✓ Strong: "MyPass123" → Accepted
```

### 2. Account Lockout
```
Attempt 1: Wrong password → failed_attempts = 1
Attempt 2: Wrong password → failed_attempts = 2
Attempt 3: Wrong password → failed_attempts = 3
Attempt 4: Wrong password → failed_attempts = 4
Attempt 5: Wrong password → LOCKED for 30 minutes

After 30 minutes:
  locked_until expires → User can try again
```

### 3. Audit Logging
```
Every security event is logged:
- User signup
- User login (success)
- Failed login attempts
- Password changes
- Account lockouts

Why? Security, debugging, compliance
```

### 4. JWT Expiration
```
Access Token: 15 minutes
  → Short expiry = Less damage if stolen
  → User stays logged in via refresh token

Refresh Token: 30 days (we'll add this later)
  → Long expiry for convenience
  → Stored securely in httpOnly cookie
```

---

## 📝 Code We'll Write

### Files to Create:

1. **auth.module.ts** - Organizes auth-related code
2. **auth.controller.ts** - HTTP endpoints (POST /signup, POST /login)
3. **auth.service.ts** - Business logic (hashing, validation, tokens)
4. **dto/signup.dto.ts** - Validation rules for signup
5. **dto/login.dto.ts** - Validation rules for login
6. **prisma.service.ts** - Database connection
7. **jwt.strategy.ts** - JWT verification (later)
8. **jwt-auth.guard.ts** - Protect routes (later)

---

Ready to start coding! 🚀
