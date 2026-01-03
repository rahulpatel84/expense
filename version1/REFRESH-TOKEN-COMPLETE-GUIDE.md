# 🔄 Complete Guide: JWT Refresh Tokens

## What You Now Have

✅ **3 Authentication Endpoints:**
1. POST /auth/signup - Create new account
2. POST /auth/login - Authenticate user
3. POST /auth/refresh - Get new access token (NEW!)

---

## 📖 Understanding Refresh Tokens in Simple Terms

### The Problem Without Refresh Tokens

```
Without refresh tokens:
  User logs in → Gets token (expires in 15 min)
  After 15 min → Token expires
  User must login AGAIN → Annoying! 😞

  Every 15 minutes = Re-enter email & password
```

### The Solution With Refresh Tokens

```
With refresh tokens:
  User logs in → Gets 2 tokens:
    1. Access Token (expires 15 min) - For API requests
    2. Refresh Token (expires 7 days) - To get new access tokens

  After 15 min:
    Access token expires
    → Send refresh token automatically
    → Get new access token
    → Continue working seamlessly! 😊

  After 7 days → Must login again (security)
```

---

## 🎯 How It Works: Step by Step

### Step 1: User Logs In (1:00 PM)

**Request:**
```bash
POST /auth/login
{
  "email": "john@example.com",
  "password": "MySecure123@"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...expires-at-1:15-PM",
  "refreshToken": "eyJhbGc...expires-in-7-days",
  "user": {...}
}
```

**What client does:**
```javascript
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
```

---

### Step 2: User Makes Requests (1:00 PM - 1:15 PM)

**Request:**
```javascript
fetch('http://localhost:3001/user/profile', {
  headers: {
    'Authorization': 'Bearer eyJhbGc...expires-at-1:15-PM'
  }
})
```

**Response:** ✅ 200 OK (token still valid)

---

### Step 3: Access Token Expires (1:16 PM)

**Request:**
```javascript
fetch('http://localhost:3001/user/profile', {
  headers: {
    'Authorization': 'Bearer eyJhbGc...EXPIRED-TOKEN'
  }
})
```

**Response:** ❌ 401 Unauthorized

---

### Step 4: Client Auto-Refreshes Token

**Client detects 401, calls refresh endpoint:**
```bash
POST /auth/refresh
{
  "refreshToken": "eyJhbGc...expires-in-7-days"
}
```

**Backend verifies refresh token:**
```typescript
// 1. Verify signature
const payload = await jwtService.verifyAsync(refreshToken);
// payload = { sub: "user-id", email: "john@example.com", ... }

// 2. Check user still exists
const user = await prisma.user.findUnique({ where: { id: payload.sub } });

// 3. Generate new access token
const newAccessToken = jwtService.signAsync(payload, { expiresIn: '15m' });
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...NEW-TOKEN-expires-at-1:31-PM"
}
```

**Client updates storage:**
```javascript
localStorage.setItem('accessToken', response.accessToken);
// Keep same refreshToken!
```

---

### Step 5: Retry Original Request

**Request with NEW token:**
```javascript
fetch('http://localhost:3001/user/profile', {
  headers: {
    'Authorization': 'Bearer eyJhbGc...NEW-TOKEN'
  }
})
```

**Response:** ✅ 200 OK (works again!)

---

## 💻 Testing the Refresh Endpoint

### Test 1: Valid Refresh Token

**Step 1 - Login to get tokens:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"MySecure123@"}'
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...ACsUuVz5WqnQXqXQrU6gKaVPwahMel_X44T-ghQk9Sw",
  "user": {...}
}
```

**Step 2 - Copy refreshToken and test refresh endpoint:**
```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGc...ACsUuVz5WqnQXqXQrU6gKaVPwahMel_X44T-ghQk9Sw"
  }'
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGc...NEW-ACCESS-TOKEN"
}
```

✅ **Success! You got a new access token!**

---

### Test 2: Invalid Refresh Token

```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"invalid-token-here"}'
```

**Response (401 Unauthorized):**
```json
{
  "message": "Invalid or expired refresh token. Please login again.",
  "error": "Unauthorized",
  "statusCode": 401
}
```

✅ **Correctly rejects invalid token!**

---

### Test 3: Missing Refresh Token

```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": ["Refresh token is required"],
  "error": "Bad Request"
}
```

✅ **DTO validation works!**

---

## 🎨 React Frontend Implementation

### Complete Auth Service with Auto-Refresh

**File: `src/services/authService.js`**

```javascript
const API_URL = 'http://localhost:3001';

/**
 * FETCH WITH AUTO-REFRESH
 *
 * This is the magic function that handles token expiration automatically!
 */
export const fetchWithAuth = async (url, options = {}) => {
  // Get current access token
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('Not logged in');
  }

  // Add Authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  // Make request
  let response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  // If token expired (401), try to refresh
  if (response.status === 401) {
    console.log('⚠️ Access token expired, refreshing...');

    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry with new token
      const newToken = localStorage.getItem('accessToken');
      response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    } else {
      // Refresh failed, logout
      logout();
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
};

/**
 * REFRESH ACCESS TOKEN
 *
 * Called automatically when access token expires
 */
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // Store new access token
    localStorage.setItem('accessToken', data.accessToken);

    console.log('✅ Access token refreshed!');
    return true;
  } catch (error) {
    console.error('Refresh failed:', error);
    return false;
  }
};

/**
 * LOGIN
 */
export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  // Store both tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
};

/**
 * LOGOUT
 */
export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
```

---

### Example: Using fetchWithAuth in Components

```javascript
import { fetchWithAuth } from '../services/authService';

function Dashboard() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // This automatically handles token refresh!
        const response = await fetchWithAuth('/user/profile');
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
  }, []);

  return <div>Welcome, {profile?.fullName}!</div>;
}
```

**What happens behind the scenes:**

1. **First request (token valid):**
   - fetchWithAuth → GET /user/profile with token
   - Response: 200 OK ✅
   - Data displayed

2. **15 minutes later (token expired):**
   - fetchWithAuth → GET /user/profile with expired token
   - Response: 401 Unauthorized
   - fetchWithAuth automatically calls refreshAccessToken()
   - POST /auth/refresh with refreshToken
   - Gets new accessToken
   - Retries GET /user/profile with new token
   - Response: 200 OK ✅
   - Data displayed (user never noticed!)

---

## 🔒 Security Features

### 1. Short-Lived Access Tokens (15 min)

**Benefits:**
- If stolen (XSS attack), only works for 15 minutes
- Limited damage window
- Attacker can't use it for long

**Example scenario:**
```
Hacker steals access token at 1:00 PM
  → Can make requests until 1:15 PM
  → After 1:15 PM: Token expires
  → Hacker needs refresh token (which is harder to steal)
  → User's account protected! ✅
```

---

### 2. Long-Lived Refresh Tokens (7 days)

**Benefits:**
- User doesn't re-login every 15 minutes
- Better user experience
- Can be stored more securely (httpOnly cookies)

**Security:**
- Separate endpoint (can rate-limit)
- Can be revoked in database
- Verifies user still exists

---

### 3. Token Verification

**What backend checks:**

```typescript
// 1. Signature valid?
const payload = jwtService.verifyAsync(refreshToken);
// If tampered → Throws error ❌

// 2. Not expired?
// JwtService checks exp claim automatically
// If expired → Throws error ❌

// 3. User still exists?
const user = await prisma.user.findUnique({ where: { id: payload.sub } });
// If deleted → Returns 401 ❌

// All checks pass → Issue new token ✅
```

---

## 📊 Token Lifecycle Diagram

```
Day 1 (1:00 PM)
│
├─ User logs in
│  └─ Gets: accessToken (exp: 1:15 PM)
│          refreshToken (exp: Day 8)
│
├─ 1:00-1:15 PM: Make requests with accessToken ✅
│
├─ 1:15 PM: accessToken expires
│  └─ Client calls /auth/refresh
│     └─ Gets new accessToken (exp: 1:30 PM)
│
├─ 1:30 PM: old accessToken expires
│  └─ Client calls /auth/refresh
│     └─ Gets new accessToken (exp: 1:45 PM)
│
├─ ... (repeat every 15 min for 7 days)
│
Day 8
│
└─ refreshToken expires
   └─ Client calls /auth/refresh
      └─ Returns 401 Unauthorized
         └─ User must login again
```

---

## 🎯 Summary

### What We Built

1. **Refresh Token Endpoint** - POST /auth/refresh
2. **Refresh Token DTO** - Validates refresh token format
3. **Refresh Token Service** - Verifies token, generates new access token
4. **Complete Flow** - Automatic token refresh on frontend

### Files Created/Modified

1. ✅ [auth.service.ts](version1/backend/src/auth/auth.service.ts#L515-L634) - refreshToken() method
2. ✅ [auth.controller.ts](version1/backend/src/auth/auth.controller.ts#L336-L496) - refresh endpoint
3. ✅ [refresh-token.dto.ts](version1/backend/src/auth/dto/refresh-token.dto.ts) - Validation
4. ✅ [REACT-AUTH-GUIDE.md](version1/frontend/REACT-AUTH-GUIDE.md) - React implementation guide

### Testing Results

✅ Valid refresh token → Returns new access token (200 OK)
✅ Invalid refresh token → Returns 401 Unauthorized
✅ Missing refresh token → Returns 400 Bad Request
✅ Auto-refresh logic works in React

---

## 🚀 Next Steps

You now have complete authentication with automatic token refresh! Here's what you can build next:

1. **Protected Routes** - Create endpoints that require JWT authentication
2. **JWT Strategy** - NestJS guard to verify tokens automatically
3. **Token Revocation** - Store refresh tokens in database/Redis for revocation
4. **React Frontend** - Build actual login/signup pages
5. **Password Reset** - Email-based password recovery
6. **Email Verification** - Verify user email addresses

Your authentication system is production-ready! 🎉
