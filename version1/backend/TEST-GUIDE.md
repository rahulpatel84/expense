# 🧪 Testing Guide - What We've Built So Far

## Current Status

✅ **Backend Server**: Running on http://localhost:3001
✅ **Database**: PostgreSQL connected (expense_tracker_v1)
✅ **ORM**: Prisma configured
✅ **Tables**: users, password_resets, email_verifications, audit_logs

---

## Test 1: Backend Health Check

**What this tests:** Is the server running?

**Command:**
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "ExpenseAI Backend is running!",
  "timestamp": "2026-01-01T12:38:39.655Z",
  "uptime": 18.587726291
}
```

**What each field means:**
- `status`: "ok" means server is healthy
- `message`: Confirmation message
- `timestamp`: Current server time (UTC)
- `uptime`: How long server has been running (seconds)

---

## Test 2: API Information

**What this tests:** What endpoints are available?

**Command:**
```bash
curl http://localhost:3001/info
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
    "info": "GET /info - This endpoint"
  },
  "documentation": "See LEARNING-GUIDE.md for detailed explanations"
}
```

---

## Test 3: Welcome Message

**What this tests:** Basic routing

**Command:**
```bash
curl http://localhost:3001/
```

**Expected Response:**
```
🎉 Welcome to ExpenseAI Backend!

This is a learning project where we build a production-ready
expense tracker with authentication from scratch.

What you'll learn:
✅ NestJS backend framework
✅ PostgreSQL database with Prisma ORM
✅ JWT authentication (login/signup)
✅ Redis for sessions
✅ React frontend
✅ Full-stack deployment

Next steps:
1. Check /health - Verify server is running
2. Check /info - See available endpoints
3. Follow LEARNING-GUIDE.md for step-by-step tutorial

Happy coding! 🚀
```

---

## Test 4: Database Connection (Manual SQL)

**What this tests:** Can we query the database?

**Command:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "SELECT COUNT(*) FROM users;"
```

**Expected Response:**
```
 count
-------
     0
(1 row)
```

This shows:
- ✅ Database connection works
- ✅ Users table exists
- ✅ Currently 0 users (we haven't created signup yet)

---

## Test 5: View All Tables

**What this tests:** Are all tables created?

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

This confirms all 5 tables exist.

---

## Test 6: View Users Table Structure

**What this tests:** Is the schema correct?

**Command:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "\d users"
```

**Expected Response:**
```
                                       Table "public.users"
        Column         |              Type              | Collation | Nullable |      Default
-----------------------+--------------------------------+-----------+----------+-------------------
 id                    | text                           |           | not null |
 full_name             | text                           |           | not null |
 email                 | text                           |           | not null |
 password_hash         | text                           |           |          |
 avatar_url            | text                           |           |          |
 currency_code         | text                           |           | not null | 'USD'::text
 email_verified        | boolean                        |           | not null | false
 onboarding_completed  | boolean                        |           | not null | false
 locked_until          | timestamp(3) without time zone |           |          |
 failed_login_attempts | integer                        |           | not null | 0
 last_failed_login_at  | timestamp(3) without time zone |           |          |
 last_login_at         | timestamp(3) without time zone |           |          |
 created_at            | timestamp(3) without time zone |           | not null | CURRENT_TIMESTAMP
 updated_at            | timestamp(3) without time zone |           | not null |
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_email_key" UNIQUE, btree (email)
```

This shows:
- ✅ All 14 columns exist
- ✅ Primary key on `id`
- ✅ Unique constraint on `email`
- ✅ Default values set correctly

---

## Test 7: Check Prisma Migrations

**What this tests:** Migration history

**Command:**
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U rahul -d expense_tracker_v1 -c "SELECT * FROM _prisma_migrations;"
```

**Expected Response:**
```
                  id                  |        checksum         |         finished_at         | migration_name  | ...
--------------------------------------+-------------------------+-----------------------------+-----------------+
 [uuid]                               | [checksum]              | 2026-01-01 12:28:53.xxx     | 20260101122853_init
```

This shows:
- ✅ Initial migration applied successfully
- ✅ Timestamp of when migration ran
- ✅ Migration is complete

---

## Test 8: Test Prisma from Code (Advanced)

**What this tests:** Can our backend code query the database?

We can create a temporary test endpoint. Let me create one:

**File: `src/app.controller.ts`**

Add this method:
```typescript
@Get('test-db')
async testDatabase() {
  // Count users in database
  const userCount = await this.prisma.user.count();

  return {
    success: true,
    message: 'Database connection working!',
    data: {
      userCount,
      tables: ['users', 'password_resets', 'email_verifications', 'audit_logs']
    }
  };
}
```

Then test with:
```bash
curl http://localhost:3001/test-db
```

---

## What We CAN'T Test Yet

❌ **User Signup** - Not built yet (next step!)
❌ **User Login** - Not built yet
❌ **Password Hashing** - Not built yet
❌ **JWT Tokens** - Not built yet
❌ **Protected Routes** - Not built yet

These are coming next!

---

## Common Issues & Solutions

### Issue 1: "Connection refused"
**Symptom:** `curl: (7) Failed to connect to localhost port 3001`
**Solution:** Backend server not running. Start it:
```bash
cd /Users/rahul/Desktop/Projects/expense-tracker/version1/backend
npm run start:dev
```

### Issue 2: "Database connection failed"
**Symptom:** Error in server logs about PostgreSQL
**Solution:** Make sure PostgreSQL is running:
```bash
brew services start postgresql@15
```

### Issue 3: "Port already in use"
**Symptom:** `EADDRINUSE: address already in use :::3001`
**Solution:** Kill process using port 3001:
```bash
lsof -ti:3001 | xargs kill -9
```

---

## Next Steps

Once these tests pass, we're ready to build:
1. **Signup endpoint** - Create new users
2. **Login endpoint** - Authenticate users
3. **JWT tokens** - Secure authentication
4. **Password hashing** - Secure password storage

All the foundation is solid! 🎉
