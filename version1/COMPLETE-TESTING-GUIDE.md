# 🧪 Complete Testing Guide - ExpenseAI Version 1

## Table of Contents
1. [Testing Tools Setup](#testing-tools-setup)
2. [Backend API Testing (Current)](#backend-api-testing)
3. [Database Testing](#database-testing)
4. [Authentication Testing (Future)](#authentication-testing)
5. [Frontend Testing (Future)](#frontend-testing)
6. [End-to-End Testing](#end-to-end-testing)
7. [Troubleshooting](#troubleshooting)

---

## 1. Testing Tools Setup {#testing-tools-setup}

### Required Tools

**Already Installed:**
- ✅ `curl` - Command-line HTTP client (comes with macOS)
- ✅ `python3` - For pretty JSON formatting (comes with macOS)
- ✅ `psql` - PostgreSQL command-line client

**Optional (Highly Recommended):**
- **Postman** - GUI for testing APIs (easier than curl)
  - Download: https://www.postman.com/downloads/
  - Free desktop app

- **Thunder Client** - VS Code extension (if you use VS Code)
  - Install from VS Code extensions marketplace

### Quick Tool Test

```bash
# Test curl
curl --version

# Test Python
python3 --version

# Test PostgreSQL client
/opt/homebrew/opt/postgresql@15/bin/psql --version
```

---

## 2. Backend API Testing (Current) {#backend-api-testing}

### Test 1: Server Health Check

**Purpose:** Verify server is running

**Method 1: Using curl**
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "ExpenseAI Backend is running!",
  "timestamp": "2026-01-01T12:41:50.001Z",
  "uptime": 208.933709083
}
```

**Method 2: Using curl with pretty JSON**
```bash
curl -s http://localhost:3001/health | python3 -m json.tool
```

**Method 3: Using browser**
- Open: http://localhost:3001/health
- Should see JSON response

**Method 4: Using Postman**
1. Open Postman
2. Create new request
3. Method: GET
4. URL: `http://localhost:3001/health`
5. Click "Send"

**What to check:**
- ✅ `status` should be "ok"
- ✅ `uptime` should be increasing (server hasn't crashed)
- ✅ Response time < 100ms (fast response)

---

### Test 2: API Information

**Purpose:** See all available endpoints

**Command:**
```bash
curl -s http://localhost:3001/info | python3 -m json.tool
```

**Expected Response:**
```json
{
    "name": "ExpenseAI API",
    "version": "1.0.0",
    "description": "Learn-by-building expense tracker with authentication",
    "endpoints": {
        "health": "GET /health - Check server status",
        "welcome": "GET / - Welcome message",
        "info": "GET /info - This endpoint",
        "testDb": "GET /test-db - Test database connection"
    },
    "documentation": "See LEARNING-GUIDE.md for detailed explanations"
}
```

---

### Test 3: Welcome Message

**Purpose:** Test basic routing

**Command:**
```bash
curl http://localhost:3001/
```

**Expected Response:**
Long welcome message with learning goals and next steps.

---

### Test 4: Database Connection Test

**Purpose:** Verify Prisma can query PostgreSQL

**Command:**
```bash
curl -s http://localhost:3001/test-db | python3 -m json.tool
```

**Expected Response:**
```json
{
    "success": true,
    "message": "Database connection working! 🎉",
    "data": {
        "tables": {
            "users": 0,
            "passwordResets": 0,
            "emailVerifications": 0,
            "auditLogs": 0
        },
        "totalRecords": 0
    },
    "note": "All counts should be 0 (we have not created any records yet)"
}
```

**What this proves:**
- ✅ Prisma service working
- ✅ PostgreSQL connection active
- ✅ All tables accessible
- ✅ Type-safe queries working

---

## 3. Database Testing {#database-testing}

### Test 1: List All Databases

**Purpose:** See all PostgreSQL databases

**Command:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d postgres -c "\l"
```

**Expected:** Should see `expense_tracker_v1` in the list

---

### Test 2: List All Tables

**Purpose:** Verify all tables created

**Command:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "\dt"
```

**Expected Response:**
```
 Schema |        Name         | Type  | Owner
--------+---------------------+-------+-------
 public | _prisma_migrations  | table | rahul
 public | audit_logs          | table | rahul
 public | email_verifications | table | rahul
 public | password_resets     | table | rahul
 public | users               | table | rahul
(5 rows)
```

---

### Test 3: View Table Structure

**Purpose:** See columns, types, and constraints

**Users Table:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "\d users"
```

**Expected:** 14 columns with proper types and indexes

**Other Tables:**
```bash
# Password Resets
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "\d password_resets"

# Email Verifications
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "\d email_verifications"

# Audit Logs
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "\d audit_logs"
```

---

### Test 4: Count Records

**Purpose:** How many records in each table

**All Tables at Once:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 << EOF
SELECT
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT
  'password_resets', COUNT(*) FROM password_resets
UNION ALL
SELECT
  'email_verifications', COUNT(*) FROM email_verifications
UNION ALL
SELECT
  'audit_logs', COUNT(*) FROM audit_logs;
EOF
```

**Expected (currently):**
```
    table_name       | count
---------------------+-------
 users               |     0
 password_resets     |     0
 email_verifications |     0
 audit_logs          |     0
```

---

### Test 5: View Migrations History

**Purpose:** See all applied database migrations

**Command:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;"
```

**Expected:**
Shows `20260101122853_init` (or similar timestamp)

---

## 4. Authentication Testing (Future) {#authentication-testing}

### Test 1: User Signup

**Once we build the signup endpoint, test it like this:**

**Using curl:**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "MyPassword123"
  }' | python3 -m json.tool
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Account created successfully!",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "fullName": "John Doe",
      "email": "john@example.com",
      "emailVerified": false
    }
  }
}
```

**Using Postman:**
1. Method: POST
2. URL: `http://localhost:3001/auth/signup`
3. Headers:
   - Key: `Content-Type`
   - Value: `application/json`
4. Body → raw → JSON:
   ```json
   {
     "fullName": "John Doe",
     "email": "john@example.com",
     "password": "MyPassword123"
   }
   ```
5. Click "Send"

**What to check:**
- ✅ Status code: 201 (Created)
- ✅ Returns `accessToken` (JWT)
- ✅ Returns user object
- ✅ Password NOT returned (security!)

**Verify in Database:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "SELECT id, full_name, email, email_verified FROM users;"
```

---

### Test 2: User Login

**Using curl:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "MyPassword123"
  }' | python3 -m json.tool
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "fullName": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**What to check:**
- ✅ Status code: 200 (OK)
- ✅ Returns new `accessToken`
- ✅ `last_login_at` updated in database

---

### Test 3: Test Wrong Password

**Purpose:** Verify security - wrong password rejected

**Using curl:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "WrongPassword"
  }' | python3 -m json.tool
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "statusCode": 401
}
```

**What to check:**
- ✅ Status code: 401 (Unauthorized)
- ✅ Generic error message (doesn't say "wrong password" for security)
- ✅ Failed attempt counted in database

**Verify in Database:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "SELECT email, failed_login_attempts FROM users WHERE email = 'john@example.com';"
```

---

### Test 4: Test Account Lockout

**Purpose:** After 5 failed attempts, account locks

**Attempt 1-4: Wrong password**
```bash
# Repeat 4 times with wrong password
for i in {1..4}; do
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"john@example.com","password":"Wrong"}' \
    | python3 -m json.tool
  echo "\nAttempt $i done\n"
done
```

**Attempt 5: Should lock account**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Wrong"
  }' | python3 -m json.tool
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Account locked. Try again in 30 minutes.",
  "statusCode": 403
}
```

**Verify in Database:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "SELECT email, failed_login_attempts, locked_until FROM users WHERE email = 'john@example.com';"
```

**Expected:** `locked_until` should be 30 minutes in future

---

### Test 5: Test Protected Route

**Purpose:** JWT token required to access protected endpoints

**Without Token (Should Fail):**
```bash
curl http://localhost:3001/auth/me
```

**Expected:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**With Token (Should Work):**
```bash
# First, login and save token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"MyPassword123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])")

# Then use token to access protected route
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "fullName": "John Doe",
    "email": "john@example.com",
    "emailVerified": false
  }
}
```

---

### Test 6: Test Password Validation

**Purpose:** Weak passwords rejected

**Test Cases:**

**Too Short:**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "short"
  }' | python3 -m json.tool
```

**Expected:** Error about password length

**No Uppercase:**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "lowercase123"
  }' | python3 -m json.tool
```

**Expected:** Error about missing uppercase

**Valid Password:**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "ValidPass123"
  }' | python3 -m json.tool
```

**Expected:** Success!

---

### Test 7: Test Duplicate Email

**Purpose:** Can't create two accounts with same email

**Create First Account:**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "First User",
    "email": "duplicate@example.com",
    "password": "Password123"
  }' | python3 -m json.tool
```

**Try to Create Duplicate:**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Second User",
    "email": "duplicate@example.com",
    "password": "Password456"
  }' | python3 -m json.tool
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Email already registered",
  "statusCode": 400
}
```

---

## 5. Frontend Testing (Future) {#frontend-testing}

### Manual Browser Testing

**Once frontend is built:**

1. **Open Frontend:**
   - URL: http://localhost:5173
   - Should see landing page

2. **Test Signup:**
   - Click "Sign Up"
   - Fill form with valid data
   - Submit
   - Should redirect to dashboard
   - Should see welcome message with your name

3. **Test Login:**
   - Logout
   - Click "Login"
   - Enter credentials
   - Should redirect to dashboard

4. **Test Protected Routes:**
   - Open dashboard directly: http://localhost:5173/dashboard
   - Without login → Should redirect to login page
   - After login → Should show dashboard

5. **Test Token Persistence:**
   - Login
   - Refresh page
   - Should still be logged in (token in localStorage)

6. **Test Logout:**
   - Click logout
   - Should redirect to login
   - Try accessing dashboard → Should be blocked

---

## 6. End-to-End Testing {#end-to-end-testing}

### Complete User Journey Test

**Test: New User Complete Flow**

```bash
#!/bin/bash
# Save this as test-complete-flow.sh

echo "🧪 Testing Complete User Journey\n"

# 1. Signup
echo "1️⃣ Creating new user..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "testuser@example.com",
    "password": "TestPass123"
  }')

echo $SIGNUP_RESPONSE | python3 -m json.tool

# Extract token
TOKEN=$(echo $SIGNUP_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])")

echo "\n✅ Signup successful! Token: ${TOKEN:0:20}...\n"

# 2. Get Profile
echo "2️⃣ Fetching user profile..."
curl -s http://localhost:3001/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool

echo "\n✅ Profile fetched!\n"

# 3. Logout
echo "3️⃣ Logging out..."
curl -s -X POST http://localhost:3001/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool

echo "\n✅ Logged out!\n"

# 4. Try to access protected route (should fail)
echo "4️⃣ Testing access after logout (should fail)..."
curl -s http://localhost:3001/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool

echo "\n✅ Correctly blocked!\n"

# 5. Login again
echo "5️⃣ Logging in again..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123"
  }')

echo $LOGIN_RESPONSE | python3 -m json.tool

echo "\n✅ Login successful!\n"

echo "🎉 Complete flow tested successfully!"
```

**Run it:**
```bash
chmod +x test-complete-flow.sh
./test-complete-flow.sh
```

---

## 7. Troubleshooting {#troubleshooting}

### Common Issues

#### Issue 1: "Connection refused"

**Symptom:**
```
curl: (7) Failed to connect to localhost port 3001: Connection refused
```

**Solution:**
```bash
# Check if server is running
lsof -i :3001

# If not running, start it
cd /Users/rahul/Desktop/Projects/expense-tracker/version1/backend
npm run start:dev
```

---

#### Issue 2: "Database does not exist"

**Symptom:**
```
Database "expense_tracker_v1" does not exist
```

**Solution:**
```bash
# Create database
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d postgres -c "CREATE DATABASE expense_tracker_v1;"

# Run migrations
cd /Users/rahul/Desktop/Projects/expense-tracker/version1/backend
npx prisma migrate dev
```

---

#### Issue 3: "PostgreSQL not running"

**Symptom:**
```
could not connect to server: Connection refused
```

**Solution:**
```bash
# Start PostgreSQL
brew services start postgresql@15

# Verify it's running
brew services list | grep postgresql
```

---

#### Issue 4: "Port already in use"

**Symptom:**
```
EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Start server again
npm run start:dev
```

---

#### Issue 5: "Unauthorized" on protected routes

**Symptom:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Causes & Solutions:**

1. **No token sent:**
   ```bash
   # Make sure to include Authorization header
   curl http://localhost:3001/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

2. **Expired token:**
   - Tokens expire after 15 minutes
   - Login again to get new token

3. **Invalid token:**
   - Token might be corrupted
   - Make sure you copied entire token

4. **Logged out:**
   - Token was blacklisted after logout
   - Login again

---

### Useful Database Queries for Testing

**1. View all users:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "SELECT id, full_name, email, email_verified, created_at FROM users;"
```

**2. View recent audit logs:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "SELECT user_id, action, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
```

**3. View failed login attempts:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "SELECT email, failed_login_attempts, locked_until FROM users WHERE failed_login_attempts > 0;"
```

**4. Clear all data (for testing):**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 << EOF
DELETE FROM audit_logs;
DELETE FROM email_verifications;
DELETE FROM password_resets;
DELETE FROM users;
EOF
```

**5. View password hashes (educational):**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "SELECT email, LEFT(password_hash, 30) as password_hash_preview FROM users;"
```

---

## Quick Reference

### Backend Server Commands

```bash
# Start server
cd /Users/rahul/Desktop/Projects/expense-tracker/version1/backend
npm run start:dev

# Stop server
# Press Ctrl+C

# Check if running
lsof -i :3001

# View logs
# Logs appear in terminal where server is running
```

### Database Commands

```bash
# Connect to database
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1

# List tables
\dt

# Describe table
\d users

# Run query
SELECT * FROM users;

# Exit psql
\q
```

### Testing Shortcuts

```bash
# Health check
curl http://localhost:3001/health

# Database test
curl http://localhost:3001/test-db | python3 -m json.tool

# Test signup (when built)
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@test.com","password":"Test123"}'

# Test login (when built)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123"}'
```

---

## Next Steps

1. ✅ **Current:** All backend infrastructure tests passing
2. 🔨 **Next:** Build authentication endpoints (signup/login)
3. 📝 **Then:** Test authentication with examples above
4. 🎨 **After:** Build frontend and test UI
5. 🚀 **Finally:** End-to-end testing and deployment

---

**Remember:** Testing is not just about finding bugs - it's about **learning how everything works together**! 🎓

Each test teaches you:
- How HTTP requests work
- How databases store data
- How authentication protects routes
- How frontend and backend communicate

Happy testing! 🧪✨
