# 📚 Complete API Documentation

## Base URL

```
Development: http://localhost:3001
Production: https://your-app.railway.app
```

---

## Authentication Endpoints

### 1. POST /auth/signup

Create a new user account.

**Request:**
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "MySecure123@",
  "fullName": "John Doe"
}
```

**Validation Rules:**
- `email`: Must be valid email format
- `password`: Minimum 8 characters, must contain uppercase, lowercase, number, and special character (@$!%*?&)
- `fullName`: Required, cannot be empty

**Success Response (201 Created):**
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

**Error Responses:**

**400 Bad Request** - Validation failed
```json
{
  "statusCode": 400,
  "message": [
    "Please provide a valid email address",
    "Password must be at least 8 characters long"
  ],
  "error": "Bad Request"
}
```

**409 Conflict** - Email already exists
```json
{
  "statusCode": 409,
  "message": "Email already registered. Please login or use a different email.",
  "error": "Conflict"
}
```

---

### 2. POST /auth/login

Authenticate an existing user.

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "MySecure123@"
}
```

**Success Response (200 OK):**
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

**Error Responses:**

**400 Bad Request** - Invalid input
```json
{
  "statusCode": 400,
  "message": ["Email is required", "Password is required"],
  "error": "Bad Request"
}
```

**401 Unauthorized** - Invalid credentials
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**401 Unauthorized** - Account locked
```json
{
  "statusCode": 401,
  "message": "Account locked due to too many failed login attempts. Please try again in 14 minutes or reset your password.",
  "error": "Unauthorized"
}
```

**Backend Logic:**
- Failed attempts are tracked
- After 5 failed attempts, account is locked for 15 minutes
- Successful login resets failed attempt counter
- Error message is intentionally vague (doesn't reveal if email exists)

---

### 3. POST /auth/refresh

Get a new access token using refresh token.

**Request:**
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

**400 Bad Request** - Missing token
```json
{
  "statusCode": 400,
  "message": ["Refresh token is required"],
  "error": "Bad Request"
}
```

**401 Unauthorized** - Invalid or expired token
```json
{
  "statusCode": 401,
  "message": "Invalid or expired refresh token. Please login again.",
  "error": "Unauthorized"
}
```

**Backend Logic:**
1. Verify refresh token signature (JWT_SECRET)
2. Check if token expired
3. Verify user still exists in database
4. Generate new access token (15 min expiry)
5. Return new access token (keep same refresh token)

**When to use:**
- Access token expires after 15 minutes
- Frontend automatically calls this when getting 401 on protected routes
- Refresh token lasts 7 days
- After 7 days, user must login again

---

## Example: Complete Authentication Flow

### Frontend Implementation

```javascript
// authService.js

const API_URL = 'http://localhost:3001';

// 1. Signup
export const signup = async (email, password, fullName) => {
  console.log('📝 [AUTH] Starting signup for:', email);

  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ [AUTH] Signup failed:', data.message);
    throw new Error(data.message);
  }

  console.log('✅ [AUTH] Signup successful');
  console.log('💾 [AUTH] Storing tokens in localStorage');

  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
};

// 2. Login
export const login = async (email, password) => {
  console.log('🔐 [AUTH] Starting login for:', email);

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ [AUTH] Login failed:', data.message);
    throw new Error(data.message);
  }

  console.log('✅ [AUTH] Login successful');
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
};

// 3. Fetch with auto-refresh
export const fetchWithAuth = async (url, options = {}) => {
  console.log(`🔍 [API] Fetching: ${url}`);

  const token = localStorage.getItem('accessToken');

  let response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });

  // If token expired, refresh and retry
  if (response.status === 401) {
    console.log('⚠️  [AUTH] Access token expired, refreshing...');

    const refreshed = await refreshAccessToken();

    if (refreshed) {
      console.log('✅ [AUTH] Token refreshed, retrying request');
      const newToken = localStorage.getItem('accessToken');

      response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`
        }
      });
    } else {
      console.error('❌ [AUTH] Refresh failed, logging out');
      logout();
      throw new Error('Session expired');
    }
  }

  console.log(`✅ [API] Request completed: ${url}`);
  return response;
};

// 4. Refresh access token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    console.error('❌ [AUTH] No refresh token found');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      console.error('❌ [AUTH] Refresh token invalid/expired');
      return false;
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);

    console.log('✅ [AUTH] Access token refreshed successfully');
    return true;
  } catch (error) {
    console.error('❌ [AUTH] Refresh error:', error);
    return false;
  }
};

// 5. Logout
export const logout = () => {
  console.log('👋 [AUTH] Logging out user');

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  window.location.href = '/login';
};
```

---

## Backend Implementation Details

### Password Hashing (bcrypt)

**How it works:**

```typescript
// Signup - Hash password
const saltRounds = 10; // 2^10 iterations
const passwordHash = await bcrypt.hash(password, saltRounds);

// Result stored in database:
// "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
//  │  │  │  │                                                      │
//  │  │  │  │                                                      └─ Hash (31 chars)
//  │  │  │  └─ Salt (22 chars, randomly generated)
//  │  │  └─ Cost factor (10 = 1024 iterations)
//  │  └─ Minor version
//  └─ Algorithm (2b = bcrypt)

// Login - Verify password
const isValid = await bcrypt.compare(plainPassword, passwordHash);
// Returns: true or false

// Why secure:
// - Original password cannot be recovered
// - Each hash is unique (random salt)
// - Slow to compute (~100ms) prevents brute force
// - Industry standard (used by banks)
```

**Example:**
```
Password: "MySecure123@"
Hash 1:   "$2b$10$abc...123" (generated today)
Hash 2:   "$2b$10$xyz...789" (generated tomorrow)

Same password → Different hashes! (due to different salts)
Attacker cannot tell if two users have same password.
```

---

### JWT Token Generation

**How it works:**

```typescript
// 1. Create payload
const payload = {
  sub: userId,           // Subject (user ID)
  email: userEmail,
  iat: currentTimestamp, // Issued at
  exp: expirationTimestamp // Expires at
};

// 2. Sign with secret
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

// 3. Result (3 parts separated by dots):
// eyJhbGc...         ← Header (algorithm info)
// .
// eyJzdWI...         ← Payload (user data, base64)
// .
// SflKxwR...         ← Signature (HMAC-SHA256)

// Signature calculation:
signature = HMAC_SHA256(
  base64(header) + "." + base64(payload),
  JWT_SECRET
);

// Verification (when token is used):
const decoded = jwt.verify(token, JWT_SECRET);
// If signature doesn't match → Throws error
// If expired → Throws error
// If valid → Returns payload
```

**Security:**
```
Attacker steals token and tries to modify:

Original payload:
{
  "sub": "user-123",
  "email": "john@example.com"
}

Modified payload:
{
  "sub": "admin-456",      ← Changed user ID
  "email": "admin@example.com"
}

Server verification:
1. Recalculates signature with modified payload
2. Compares with original signature
3. Signatures don't match!
4. Token rejected ❌

Only someone with JWT_SECRET can create valid tokens.
```

---

### Account Lockout Mechanism

**Implementation:**

```typescript
// Database columns:
// - failedLoginAttempts: number (default 0)
// - lastFailedLoginAt: timestamp
// - lockedUntil: timestamp

// On failed login:
async handleFailedLogin(userId, currentAttempts) {
  const newAttempts = currentAttempts + 1;

  // Lock after 5 attempts
  const shouldLock = newAttempts >= 5;
  const lockedUntil = shouldLock
    ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: newAttempts,
      lastFailedLoginAt: new Date(),
      lockedUntil: lockedUntil
    }
  });

  if (shouldLock) {
    console.log('🔒 Account locked until:', lockedUntil);
  }
}

// On successful login:
await prisma.user.update({
  where: { id: userId },
  data: {
    failedLoginAttempts: 0,      // Reset counter
    lastFailedLoginAt: null,
    lockedUntil: null,           // Unlock account
    lastLoginAt: new Date()
  }
});
```

**Timeline example:**
```
1:00 PM - Wrong password #1 (attempts: 1)
1:01 PM - Wrong password #2 (attempts: 2)
1:02 PM - Wrong password #3 (attempts: 3)
1:03 PM - Wrong password #4 (attempts: 4)
1:04 PM - Wrong password #5 (attempts: 5)
  └─ Account locked until 1:19 PM

1:05 PM - Correct password
  └─ Still locked! ❌ Returns 401

1:19 PM - Lock expires
1:20 PM - Correct password
  └─ Login succeeds! ✅
  └─ Attempts reset to 0
```

---

## Token Lifecycle

### Access Token (15 minutes)

```
Created at:   1:00 PM
Expires at:   1:15 PM

Timeline:
1:00-1:14 PM: Token valid, all requests work ✅
1:15 PM:      Token expires
1:16 PM:      Requests return 401 ❌
              Frontend auto-calls /auth/refresh
              Gets new token (expires 1:31 PM)
              Retries request → Works! ✅
```

### Refresh Token (7 days)

```
Created at:   Monday 1:00 PM
Expires at:   Next Monday 1:00 PM

During 7 days:
- Access token refreshed ~672 times (every 15 min)
- User never has to login again
- Seamless experience

After 7 days:
- Refresh token expires
- /auth/refresh returns 401
- User must login again
```

---

## Error Handling Best Practices

### Vague Error Messages (Security)

**❌ Bad (reveals too much):**
```json
{
  "message": "Email not found"  // Tells attacker email doesn't exist
}

{
  "message": "Wrong password"   // Tells attacker email exists!
}
```

**✅ Good (vague):**
```json
{
  "message": "Invalid credentials"  // Doesn't reveal which field is wrong
}
```

**Why vague is better:**
- Prevents user enumeration attacks
- Attacker can't build list of valid emails
- Forces attacker to guess both email AND password

---

### Logging Strategy

**Backend logs (server-side only):**
```typescript
// Detailed logs for debugging
console.log('❌ Login failed: User not found');
console.log('❌ Login failed: Invalid password');
console.log('🔒 Account locked for 14 more minutes');

// But client only sees:
throw new UnauthorizedException('Invalid credentials');
```

**Frontend logs (visible in browser console):**
```javascript
console.log('🔐 [AUTH] Login attempt:', email);
console.log('✅ [AUTH] Login successful');
console.error('❌ [AUTH] Login failed:', error.message);
```

---

## Quick Reference

### HTTP Status Codes

| Code | Meaning | When to use |
|------|---------|-------------|
| 200 | OK | Successful GET, login, refresh |
| 201 | Created | Successful signup |
| 400 | Bad Request | Validation failed, missing fields |
| 401 | Unauthorized | Invalid credentials, expired token |
| 403 | Forbidden | Logged in but not allowed |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already registered |
| 500 | Server Error | Database error, unexpected error |

### Token Storage

| Method | Security | Survives Refresh | Best For |
|--------|----------|------------------|----------|
| localStorage | ⚠️ Medium | ✅ Yes | Learning, simple apps |
| Memory | ✅ High | ❌ No | Production with refresh |
| HttpOnly Cookie | ✅✅ Highest | ✅ Yes | Banking apps |

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&)

**Valid examples:**
- `MySecure123@`
- `Pass@word1`
- `Admin2024!`

**Invalid examples:**
- `password` (no uppercase, number, or special char)
- `PASSWORD123` (no lowercase or special char)
- `Pass@word` (no number)
- `Short1@` (too short, less than 8 chars)

---

## Testing Guide

### Using cURL

**1. Signup:**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123@",
    "fullName": "Test User"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123@"
  }'
```

**3. Refresh:**
```bash
# First, save tokens from login response
ACCESS_TOKEN="eyJhbGc..."
REFRESH_TOKEN="eyJhbGc..."

# Then refresh
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

---

This documentation will continue to grow as we add more endpoints (forgot password, reset password, user profile, etc.)!
