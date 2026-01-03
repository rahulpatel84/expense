# 📚 Complete Learning Guide - Building ExpenseAI from Scratch

## Table of Contents
1. [What is PostgreSQL and Why Do We Need It?](#postgresql)
2. [What is JWT and How Authentication Works](#jwt)
3. [What is Prisma and Why We Use It](#prisma)
4. [What is Redis and Its Role](#redis)
5. [Understanding the Full Architecture](#architecture)
6. [How Everything Fits Together](#integration)
7. [Step-by-Step Build Process](#build-process)
8. [Server Deployment Guide](#deployment)

---

## 1. What is PostgreSQL and Why Do We Need It? {#postgresql}

### What is PostgreSQL?

**PostgreSQL** (often called "Postgres") is a **database** - think of it as an Excel spreadsheet on steroids that runs on a server.

**Simple Analogy:**
```
Excel Spreadsheet          →  PostgreSQL Database
- Sheet 1 (Users)          →  Table: users
- Sheet 2 (Expenses)       →  Table: expenses
- Rows with data           →  Records/Rows
- Columns (Name, Email)    →  Columns/Fields
```

### Why Do We Need a Database?

**Without a database:**
- When you restart your app, all data disappears 💥
- Can't handle multiple users at once
- No way to search or filter data efficiently
- Can't ensure data consistency

**With PostgreSQL:**
- ✅ Data persists forever (even after restart)
- ✅ Millions of users can access simultaneously
- ✅ Lightning-fast searches and queries
- ✅ Data integrity and transactions
- ✅ Relationships between data (users have many expenses)

### Example: How Data is Stored

**Your Users Table:**
```
id          | full_name  | email              | password_hash              | created_at
------------|------------|--------------------|-----------------------------|-------------
uuid-123    | John Doe   | john@email.com     | $2b$10$abcd1234...        | 2024-01-15
uuid-456    | Jane Smith | jane@email.com     | $2b$10$xyz789...          | 2024-01-16
```

**Your Expenses Table (Future):**
```
id       | user_id  | amount | category   | description        | date
---------|----------|--------|------------|--------------------|------------
exp-1    | uuid-123 | 50.00  | Food       | Lunch at cafe      | 2024-01-20
exp-2    | uuid-123 | 25.00  | Transport  | Uber ride          | 2024-01-21
exp-3    | uuid-456 | 100.00 | Shopping   | New shoes          | 2024-01-21
```

### PostgreSQL vs Other Databases

| Database | Type | Best For | Our Use Case |
|----------|------|----------|--------------|
| **PostgreSQL** | Relational (SQL) | Complex data, relationships | ✅ Perfect - we have users, expenses, budgets with relationships |
| MongoDB | Document (NoSQL) | Flexible schemas, rapid prototyping | ❌ Too flexible, we need strict structure |
| MySQL | Relational (SQL) | Simple web apps | ✅ Would work, but Postgres is more powerful |
| SQLite | File-based | Small apps, mobile | ❌ Can't handle multiple users well |

### Why PostgreSQL Specifically?

1. **ACID Compliant** - Your money data is safe
   - **A**tomicity: All or nothing (transaction succeeds completely or fails completely)
   - **C**onsistency: Data always valid
   - **I**solation: Multiple users don't interfere with each other
   - **D**urability: Once saved, never lost

2. **Advanced Features:**
   - JSON data types (flexible when needed)
   - Full-text search (search through expenses)
   - Triggers and functions (automated actions)
   - Foreign keys (enforce relationships)

3. **Industry Standard:**
   - Used by Instagram, Spotify, Apple
   - Massive community support
   - Free and open-source

### How We Connect to PostgreSQL

**Option 1: Local (Development)**
```bash
# Install PostgreSQL on your computer
brew install postgresql@15          # macOS
sudo apt install postgresql         # Linux
# Download installer from postgresql.org (Windows)

# Start PostgreSQL
brew services start postgresql@15
```

**Option 2: Cloud (Production) - Supabase**
```
✅ We're using this!
- No installation needed
- Automatic backups
- Web interface to view data
- Free tier: 500MB database
- Connection string provided
```

### Example SQL Queries

**Create a user:**
```sql
INSERT INTO users (id, full_name, email, password_hash, created_at)
VALUES (
  'uuid-123',
  'John Doe',
  'john@email.com',
  '$2b$10$abcd1234...',
  NOW()
);
```

**Find a user by email:**
```sql
SELECT * FROM users WHERE email = 'john@email.com';
```

**Get all expenses for a user:**
```sql
SELECT * FROM expenses
WHERE user_id = 'uuid-123'
ORDER BY date DESC;
```

**But wait!** We don't write SQL directly. That's where **Prisma** comes in (explained later).

---

## 2. What is JWT and How Authentication Works {#jwt}

### What is Authentication?

**Authentication** = Proving you are who you say you are

**Real-world analogy:**
- Your **driver's license** proves your identity
- A **passport** lets you cross borders
- A **ticket** lets you enter a concert

**In web apps:**
- **JWT token** = Digital passport that proves you're logged in

### The Old Way (Sessions with Cookies)

**How it worked:**
```
1. User logs in with password
2. Server creates a session ID: "session-abc123"
3. Server stores session in database: "session-abc123 → user_id: 456"
4. Server sends session ID to browser as cookie
5. Browser sends cookie with every request
6. Server looks up session in database each time
```

**Problems:**
- ❌ Server must store every session (millions of users = millions of sessions)
- ❌ Database lookup on every request (slow)
- ❌ Doesn't work well with multiple servers (session on server A, but request goes to server B)

### The New Way (JWT Tokens)

**JWT = JSON Web Token**

A JWT is a **self-contained** token that includes:
- Who you are (user ID, email)
- What you can do (permissions)
- When it expires
- Digital signature to prevent tampering

**Structure of a JWT:**
```
Header.Payload.Signature

Example:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1dWlkLTEyMyIsImVtYWlsIjoiam9obkBlbWFpbC5jb20iLCJpYXQiOjE3MDM3NzcwMDAsImV4cCI6MTcwMzc3NzkwMH0.XYZ789...
```

**Decoded JWT:**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "uuid-123",
    "email": "john@email.com",
    "iat": 1703777000,  // Issued at timestamp
    "exp": 1703777900   // Expires at timestamp (15 min later)
  },
  "signature": "XYZ789..."  // Cryptographic signature
}
```

### How JWT Authentication Works

**Step 1: User Logs In**
```
User → POST /auth/login
Body: { email: "john@email.com", password: "MyPassword123" }

Backend:
1. Find user in database by email
2. Compare password with stored hash
3. If match:
   - Generate JWT with user info
   - Sign it with secret key
   - Return token to user
```

**Step 2: User Makes Request**
```
User → GET /api/expenses
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Backend:
1. Extract token from Authorization header
2. Verify signature with secret key
3. Check expiration
4. If valid: Extract user ID from payload
5. Process request as that user
```

**Step 3: Token Expires**
```
After 15 minutes:
User → GET /api/expenses
Headers: Authorization: Bearer (expired token)

Backend: Returns 401 Unauthorized

Frontend: Automatically requests new token using refresh token
```

### Two-Token System

We use **TWO** types of tokens:

**Access Token (Short-lived - 15 minutes):**
```json
{
  "userId": "uuid-123",
  "email": "john@email.com",
  "exp": 1703777900  // 15 min from now
}
```
- Sent with every API request
- Stored in memory (React state)
- If stolen, only valid for 15 minutes

**Refresh Token (Long-lived - 30 days):**
```json
{
  "userId": "uuid-123",
  "sessionId": "session-abc",
  "exp": 1706369900  // 30 days from now
}
```
- Used ONLY to get new access tokens
- Stored in httpOnly cookie (JavaScript can't access it)
- Also stored in Redis for validation
- If stolen, can be revoked from database

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER LOGIN FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. User enters email + password
   ↓
2. POST /auth/login
   ↓
3. Backend validates credentials
   ↓
4. Backend generates:
   - Access Token (JWT, 15 min)
   - Refresh Token (JWT, 30 days)
   ↓
5. Backend stores refresh token in Redis:
   Key: "session:uuid-123:abc"
   Value: { refreshToken, deviceInfo, ipAddress }
   TTL: 30 days
   ↓
6. Backend returns:
   Body: { accessToken: "eyJ...", refreshToken: "eyJ..." }
   Cookie: refreshToken=eyJ... (httpOnly, secure)
   ↓
7. Frontend stores:
   - accessToken in memory (React state)
   - user data in localStorage
   - refreshToken automatically in cookie
   ↓
8. User is logged in! 🎉

┌─────────────────────────────────────────────────────────────┐
│                  MAKING API REQUESTS                         │
└─────────────────────────────────────────────────────────────┘

User wants to view expenses:
   ↓
Frontend → GET /api/expenses
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↓
Backend Middleware (JWT Guard):
  1. Extract token from "Authorization: Bearer {token}"
  2. Verify signature: jwt.verify(token, SECRET_KEY)
  3. Check expiration: if (payload.exp < now) throw Error
  4. Attach user to request: req.user = payload
   ↓
Backend Controller:
  - Access user info: req.user.userId
  - Query expenses for this user
  - Return data
   ↓
Frontend receives expenses and displays them

┌─────────────────────────────────────────────────────────────┐
│                TOKEN REFRESH FLOW (Automatic)                │
└─────────────────────────────────────────────────────────────┘

After 13 minutes (access token expires in 2 min):
   ↓
Frontend Axios Interceptor detects token expiring soon
   ↓
POST /auth/refresh
Cookie: refreshToken=eyJ... (sent automatically)
   ↓
Backend:
  1. Extract refresh token from cookie
  2. Verify signature
  3. Check in Redis: EXISTS session:uuid-123:abc
  4. If valid:
     - Generate NEW access token (15 min)
     - Optionally generate NEW refresh token (rotation)
     - Update Redis with new refresh token
     - Return new access token
   ↓
Frontend:
  - Receives new access token
  - Updates token in memory
  - Retries original request
   ↓
User never notices! Seamless experience 🎉

┌─────────────────────────────────────────────────────────────┐
│                    LOGOUT FLOW                               │
└─────────────────────────────────────────────────────────────┘

User clicks "Logout":
   ↓
POST /auth/logout
Headers: Authorization: Bearer {access token}
   ↓
Backend:
  1. Extract user ID from access token
  2. Delete session from Redis:
     DEL session:uuid-123:abc
  3. Add access token to blacklist (Redis):
     SET blacklist:{token} true EX 900  // 15 min (remaining life)
  4. Return success
   ↓
Frontend:
  - Clear access token from memory
  - Clear user data from localStorage
  - Clear refresh token cookie
  - Redirect to login page
   ↓
User is logged out! 🚪
```

### Why This is Secure

1. **Access tokens expire quickly** (15 min) - Limited damage if stolen
2. **Refresh tokens in httpOnly cookies** - JavaScript can't access them (prevents XSS attacks)
3. **Refresh tokens validated in Redis** - Can be instantly revoked
4. **Tokens are signed** - Can't be tampered with
5. **Secret key never exposed** - Only server knows it
6. **Token blacklisting** - Logged out tokens can't be reused

### What is the Secret Key?

The **secret key** is a long random string used to sign tokens:

```env
JWT_SECRET=5f3a8b9c2d1e4f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
```

**How it works:**
```javascript
// Signing a token (backend only)
const token = jwt.sign(
  { userId: "uuid-123", email: "john@email.com" },
  JWT_SECRET,  // Secret key (never share this!)
  { expiresIn: "15m" }
);

// Verifying a token (backend only)
const payload = jwt.verify(token, JWT_SECRET);
// If signature is invalid, this throws an error
```

**Think of it like:**
- A wax seal on a letter (proves it wasn't opened)
- A signature that only you can create
- A lock that only your key can open

---

## 3. What is Prisma and Why We Use It? {#prisma}

### What is an ORM?

**ORM = Object-Relational Mapping**

It translates between:
- **Objects** (JavaScript/TypeScript code)
- **Relations** (Database tables)

**Without an ORM (Raw SQL):**
```javascript
// Have to write SQL manually
const user = await db.query(
  "INSERT INTO users (id, full_name, email, password_hash, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
  [uuid(), "John Doe", "john@email.com", hashedPassword, new Date()]
);

// Prone to:
// - SQL injection attacks
// - Typos in column names
// - No type checking
// - Lots of boilerplate code
```

**With Prisma (ORM):**
```javascript
// Write JavaScript/TypeScript
const user = await prisma.user.create({
  data: {
    fullName: "John Doe",
    email: "john@email.com",
    passwordHash: hashedPassword,
  }
});

// Benefits:
// ✅ Type-safe (TypeScript knows all fields)
// ✅ Auto-completion in your editor
// ✅ SQL injection prevention
// ✅ Clean, readable code
```

### What is Prisma Specifically?

**Prisma** is a modern ORM for Node.js and TypeScript that includes:

1. **Prisma Schema** - Define your database structure in a simple file
2. **Prisma Client** - Auto-generated query builder for your database
3. **Prisma Migrate** - Version control for your database (like Git for databases)
4. **Prisma Studio** - Visual editor to view/edit data

### The Prisma Schema File

**Location:** `backend/prisma/schema.prisma`

```prisma
// Database connection
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Code generation settings
generator client {
  provider = "prisma-client-js"
}

// Define a User table
model User {
  id                  String   @id @default(uuid())
  fullName            String   @map("full_name")
  email               String   @unique
  passwordHash        String   @map("password_hash")
  emailVerified       Boolean  @default(false) @map("email_verified")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  // Relationships
  expenses            Expense[]  // One user has many expenses

  @@map("users")  // Actual table name in database
}

// Define an Expense table
model Expense {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  amount      Float
  category    String
  description String?
  date        DateTime
  createdAt   DateTime @default(now()) @map("created_at")

  // Relationship
  user        User     @relation(fields: [userId], references: [id])

  @@map("expenses")
}
```

**What this creates in PostgreSQL:**

```sql
-- users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- expenses table
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Prisma Client - Query Examples

**After defining schema, generate client:**
```bash
npx prisma generate
```

This creates a type-safe client you can use in your code:

**Create a user:**
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const user = await prisma.user.create({
  data: {
    fullName: "John Doe",
    email: "john@email.com",
    passwordHash: hashedPassword,
  }
});

// user is fully typed! Your editor knows all fields:
console.log(user.id);        // ✅ TypeScript knows this exists
console.log(user.fullName);  // ✅ TypeScript knows this exists
console.log(user.invalid);   // ❌ TypeScript error!
```

**Find a user:**
```typescript
const user = await prisma.user.findUnique({
  where: { email: "john@email.com" }
});

if (!user) {
  throw new Error("User not found");
}
```

**Update a user:**
```typescript
const updatedUser = await prisma.user.update({
  where: { id: "uuid-123" },
  data: { emailVerified: true }
});
```

**Create expense with relationship:**
```typescript
const expense = await prisma.expense.create({
  data: {
    amount: 50.00,
    category: "Food",
    description: "Lunch",
    date: new Date(),
    userId: "uuid-123"  // Links to user
  }
});
```

**Get user with all their expenses:**
```typescript
const userWithExpenses = await prisma.user.findUnique({
  where: { id: "uuid-123" },
  include: {
    expenses: {
      orderBy: { date: 'desc' },
      take: 10  // Last 10 expenses
    }
  }
});

console.log(userWithExpenses.fullName);
console.log(userWithExpenses.expenses);  // Array of expenses
```

**Complex query with filters:**
```typescript
const expenses = await prisma.expense.findMany({
  where: {
    userId: "uuid-123",
    category: "Food",
    amount: {
      gte: 20.00,  // Greater than or equal
      lte: 100.00  // Less than or equal
    },
    date: {
      gte: new Date("2024-01-01"),
      lte: new Date("2024-12-31")
    }
  },
  orderBy: {
    date: 'desc'
  },
  take: 20,  // Limit
  skip: 0    // Offset (for pagination)
});
```

### Prisma Migrate - Database Migrations

**Migrations** = Version control for your database schema

**Why needed:**
- Track database changes over time
- Apply changes safely in production
- Rollback if something goes wrong
- Share database structure with team

**Example workflow:**

**1. Define your schema:**
```prisma
model User {
  id String @id @default(uuid())
  fullName String
  email String @unique
}
```

**2. Create migration:**
```bash
npx prisma migrate dev --name init
```

This creates:
```
prisma/migrations/
  20240115_init/
    migration.sql
```

**migration.sql:**
```sql
-- CreateTable
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL
);
```

**3. Later, add a field:**
```prisma
model User {
  id String @id @default(uuid())
  fullName String
  email String @unique
  phoneNumber String?  // NEW FIELD
}
```

**4. Create new migration:**
```bash
npx prisma migrate dev --name add_phone_number
```

**New migration created:**
```sql
-- AlterTable
ALTER TABLE "users" ADD COLUMN "phoneNumber" TEXT;
```

**5. Deploy to production:**
```bash
npx prisma migrate deploy
```

This applies all migrations in order, safely.

### Prisma Studio - Visual Database Editor

```bash
npx prisma studio
```

Opens a web interface at `http://localhost:5555` where you can:
- View all tables
- Edit records
- Add new data
- Delete records
- No SQL required!

### Why Prisma vs Other ORMs?

| Feature | Prisma | TypeORM | Sequelize |
|---------|--------|---------|-----------|
| Type Safety | ✅ Excellent | ⚠️ Good | ❌ Poor |
| Auto-completion | ✅ Yes | ⚠️ Partial | ❌ No |
| Migrations | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| Learning Curve | ✅ Easy | ⚠️ Medium | ⚠️ Medium |
| Performance | ✅ Fast | ✅ Fast | ⚠️ Slower |
| Modern | ✅ 2019+ | ⚠️ 2016+ | ❌ 2014+ |

---

## 4. What is Redis and Its Role {#redis}

### What is Redis?

**Redis** = **RE**mote **DI**ctionary **S**erver

It's an **in-memory database** - think of it as a super-fast key-value store in RAM.

**Simple Analogy:**
```
PostgreSQL = Filing cabinet with folders (organized, permanent)
Redis = Sticky notes on your desk (quick access, temporary)
```

### PostgreSQL vs Redis

| Feature | PostgreSQL | Redis |
|---------|------------|-------|
| **Storage** | Hard disk (persistent) | RAM (memory) |
| **Speed** | ~10-50ms per query | ~0.1-1ms per query |
| **Data Loss** | Never | If server crashes (unless configured) |
| **Data Types** | Tables, rows, columns | Key-value pairs |
| **Size Limit** | Terabytes | Limited by RAM |
| **Best For** | Permanent data | Temporary data, caching |

### Why Do We Need Both?

**PostgreSQL (Long-term storage):**
- User accounts (permanent)
- Expense history (permanent)
- All important data

**Redis (Short-term storage):**
- User sessions (temporary, 30 days)
- Rate limiting (temporary, 15 minutes)
- Cache (temporary, improves speed)
- Token blacklist (temporary, until expiration)

### How Redis Works - Key-Value Store

**Redis stores data as simple key-value pairs:**

```
Key: "session:uuid-123:abc456"
Value: '{"userId":"uuid-123","deviceName":"Chrome","ipAddress":"192.168.1.1"}'
```

**Basic Redis Commands:**

```javascript
// SET a value (with expiration)
await redis.set("session:uuid-123:abc", JSON.stringify(sessionData), 'EX', 2592000);
// EX 2592000 = Expire in 2,592,000 seconds (30 days)

// GET a value
const sessionData = await redis.get("session:uuid-123:abc");
const session = JSON.parse(sessionData);

// CHECK if key exists
const exists = await redis.exists("session:uuid-123:abc");

// DELETE a key
await redis.del("session:uuid-123:abc");

// INCREMENT a counter (atomic operation)
await redis.incr("rate_limit:192.168.1.1");

// SET with expiration
await redis.setex("verification_code:john@email.com", 600, "123456");
// Expires in 600 seconds (10 minutes)
```

### Our Use Cases for Redis

#### 1. Session Management

**Without Redis:**
```javascript
// Bad: Store sessions in PostgreSQL
await prisma.session.create({
  data: {
    userId: "uuid-123",
    refreshToken: "abc456",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
});

// Every API request:
const session = await prisma.session.findUnique({
  where: { refreshToken: "abc456" }
});
// Problem: Database query on EVERY request (slow! 50ms each time)
```

**With Redis:**
```javascript
// Store session in Redis
await redis.set(
  `session:uuid-123:abc456`,
  JSON.stringify({
    userId: "uuid-123",
    refreshToken: "abc456",
    deviceName: "Chrome on MacBook",
    ipAddress: "192.168.1.1",
    lastAccessed: new Date()
  }),
  'EX',
  2592000  // Auto-delete after 30 days
);

// Every API request:
const session = await redis.get(`session:uuid-123:abc456`);
// Speed: <1ms instead of 50ms! 50x faster!
```

#### 2. Rate Limiting

**Prevent abuse by limiting requests:**

```javascript
async function checkRateLimit(ipAddress: string): Promise<boolean> {
  const key = `rate_limit:login:${ipAddress}`;

  // Increment request count
  const count = await redis.incr(key);

  // First request? Set expiration
  if (count === 1) {
    await redis.expire(key, 900);  // 15 minutes
  }

  // Check limit
  if (count > 10) {
    return false;  // Rate limit exceeded
  }

  return true;  // Allow request
}

// Usage:
if (!await checkRateLimit(req.ip)) {
  throw new Error("Too many login attempts. Try again in 15 minutes.");
}
```

**How it works:**
```
First login attempt from 192.168.1.1:
  SET rate_limit:login:192.168.1.1 = 1 (expires in 15 min)

Second attempt:
  INCR rate_limit:login:192.168.1.1 → 2

... 8 more attempts ...

11th attempt:
  INCR rate_limit:login:192.168.1.1 → 11
  11 > 10 → BLOCKED!

After 15 minutes:
  Key automatically deleted by Redis
  User can try again
```

#### 3. Token Blacklist (Logout)

**Problem:** JWT tokens can't be "deleted" - they're valid until expiration.

**Solution:** Blacklist logged-out tokens in Redis:

```javascript
async function logout(accessToken: string) {
  const payload = jwt.decode(accessToken);
  const expiresIn = payload.exp - Math.floor(Date.now() / 1000);

  // Add token to blacklist until it expires
  await redis.set(
    `blacklist:${accessToken}`,
    'true',
    'EX',
    expiresIn  // Auto-delete when token would have expired anyway
  );

  // Delete session
  await redis.del(`session:${payload.userId}:${payload.sessionId}`);
}

// Middleware to check blacklist:
async function verifyToken(token: string) {
  // Check if blacklisted
  const isBlacklisted = await redis.exists(`blacklist:${token}`);
  if (isBlacklisted) {
    throw new Error("Token has been revoked");
  }

  // Verify signature
  const payload = jwt.verify(token, JWT_SECRET);
  return payload;
}
```

#### 4. Caching (Future Enhancement)

**Cache expensive database queries:**

```javascript
async function getUserExpenses(userId: string) {
  const cacheKey = `expenses:${userId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);  // Return cached data (fast!)
  }

  // Cache miss - query database
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  // Store in cache for 5 minutes
  await redis.set(cacheKey, JSON.stringify(expenses), 'EX', 300);

  return expenses;
}
```

### Redis Data Structures

Redis supports more than just simple key-value:

**1. Strings (what we mostly use):**
```javascript
await redis.set("user:name", "John Doe");
await redis.get("user:name");  // "John Doe"
```

**2. Hashes (objects):**
```javascript
await redis.hset("user:uuid-123", {
  fullName: "John Doe",
  email: "john@email.com",
  emailVerified: "true"
});

await redis.hget("user:uuid-123", "email");  // "john@email.com"
await redis.hgetall("user:uuid-123");  // Entire object
```

**3. Lists (arrays):**
```javascript
await redis.lpush("recent_logins:uuid-123", "2024-01-15T10:00:00Z");
await redis.lrange("recent_logins:uuid-123", 0, 9);  // Last 10 logins
```

**4. Sets (unique values):**
```javascript
await redis.sadd("online_users", "uuid-123");
await redis.sadd("online_users", "uuid-456");
await redis.smembers("online_users");  // ["uuid-123", "uuid-456"]
```

**5. Sorted Sets (with scores):**
```javascript
await redis.zadd("leaderboard", 100, "user1");
await redis.zadd("leaderboard", 200, "user2");
await redis.zrevrange("leaderboard", 0, 9);  // Top 10
```

### Where We Host Redis

**Option 1: Upstash (Recommended for us)**
```
✅ Serverless Redis
✅ Free tier: 10,000 commands/day
✅ Pay-as-you-go: $0.20 per 100K commands
✅ Global edge network (fast worldwide)
✅ Built-in REST API
✅ No server management
```

**Option 2: AWS ElastiCache**
```
⚠️ More expensive ($15-50/month minimum)
✅ More control
✅ Better for very high traffic
✅ VPC integration
```

**Option 3: Local (Development only)**
```bash
# Install Redis locally
brew install redis          # macOS
sudo apt install redis      # Linux

# Start Redis
redis-server

# Connect
redis-cli
```

### Redis Configuration for Our Project

**Environment variable:**
```env
REDIS_URL=rediss://default:password@your-redis.upstash.io:6379
```

**Connection in NestJS:**
```typescript
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

await redisClient.connect();

// Use it
await redisClient.set('key', 'value');
```

### Redis Persistence Options

**Option 1: No persistence (fastest, risk of data loss)**
```
If server crashes, all data lost
Good for: Cache, rate limiting, temporary data
```

**Option 2: RDB (snapshots)**
```
Save full database to disk every X minutes
Good balance of speed and safety
Upstash uses this by default
```

**Option 3: AOF (append-only file)**
```
Log every write operation
Slower but maximum durability
Overkill for sessions/cache
```

**Our choice: RDB with Upstash** - Sessions can be recreated (users just log in again).

---

## 5. Understanding the Full Architecture {#architecture}

### The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Frontend (localhost:5173 or app.expenseai.com)    │  │
│  │                                                           │  │
│  │  - Pages (Login, Dashboard, etc.)                        │  │
│  │  - Components (Forms, Tables, etc.)                      │  │
│  │  - State Management (AuthContext)                        │  │
│  │  - API Client (Axios with interceptors)                  │  │
│  │                                                           │  │
│  │  Stores:                                                  │  │
│  │  - accessToken in memory (React state)                   │  │
│  │  - user data in localStorage                             │  │
│  │  - refreshToken in httpOnly cookie                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST API
                              ↓ (JSON over HTTPS)
┌─────────────────────────────────────────────────────────────────┐
│                         NestJS BACKEND                           │
│                   (localhost:3000 or api.expenseai.com)         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Controllers (HTTP Routes)                                │  │
│  │  POST /auth/login, POST /auth/signup, GET /api/expenses  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Guards (JWT Authentication)                             │  │
│  │  Verify tokens, check permissions                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services (Business Logic)                               │  │
│  │  - AuthService (login, signup, tokens)                   │  │
│  │  - UserService (profile, settings)                       │  │
│  │  - ExpenseService (CRUD operations)                      │  │
│  │  - EmailService (SendGrid integration)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Data Layer                                              │  │
│  │  - Prisma ORM (type-safe queries)                       │  │
│  │  - Redis Client (sessions, cache)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                 ↓                              ↓
    ┌────────────────────┐        ┌────────────────────┐
    │  PostgreSQL        │        │  Redis (Upstash)   │
    │  (Supabase)        │        │                    │
    │                    │        │  - Sessions        │
    │  - users           │        │  - Rate limits     │
    │  - expenses        │        │  - Token blacklist │
    │  - audit_logs      │        │  - Cache           │
    │  - password_resets │        └────────────────────┘
    │  - email_verifs    │
    └────────────────────┘
                 ↓
    ┌────────────────────┐
    │  Supabase Storage  │
    │                    │
    │  - User avatars    │
    │  - Receipt images  │
    └────────────────────┘

              ↓ (Email sending)
    ┌────────────────────┐
    │  SendGrid          │
    │                    │
    │  - Verification    │
    │  - Password reset  │
    │  - Notifications   │
    └────────────────────┘
```

### Request Flow - User Logs In

Let's trace a complete login request:

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User enters credentials and clicks "Login"          │
└─────────────────────────────────────────────────────────────┘

Frontend (Login.tsx):
  const handleSubmit = async (e) => {
    const { email, password } = formData;

    try {
      const response = await axios.post('http://localhost:3000/auth/login', {
        email,
        password
      });

      // Receive: { accessToken, refreshToken, user }
    } catch (error) {
      // Show error message
    }
  };

                    ↓ HTTP POST Request
                    ↓ Body: { email: "john@email.com", password: "MyPass123" }

┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Request arrives at NestJS backend                   │
└─────────────────────────────────────────────────────────────┘

Backend (auth.controller.ts):
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

                    ↓ loginDto = { email: "john@email.com", password: "MyPass123" }

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Validation happens automatically                    │
└─────────────────────────────────────────────────────────────┘

LoginDto class:
  class LoginDto {
    @IsEmail()
    email: string;  // Validates it's a proper email format

    @IsString()
    @MinLength(8)
    password: string;  // Validates minimum length
  }

  If validation fails → Returns 400 Bad Request immediately
  If passes → Continue to service

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ STEP 4: AuthService handles business logic                  │
└─────────────────────────────────────────────────────────────┘

Backend (auth.service.ts):
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account locked. Try again later.');
    }

    // 3. Compare password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed attempts
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: user.failedLoginAttempts + 1,
          lastFailedLoginAt: new Date(),
          // Lock account if 5+ failed attempts
          lockedUntil: user.failedLoginAttempts >= 4
            ? new Date(Date.now() + 30 * 60 * 1000)  // 30 min from now
            : null
        }
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Password correct! Reset failed attempts
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lastLoginAt: new Date()
      }
    });

    // 5. Generate JWT tokens
    const accessToken = this.jwtService.sign(
      { userId: user.id, email: user.email },
      { expiresIn: '15m' }
    );

    const refreshToken = this.jwtService.sign(
      { userId: user.id, sessionId: uuid() },
      { expiresIn: '30d' }
    );

    // 6. Store session in Redis
    const sessionKey = `session:${user.id}:${refreshToken}`;
    await this.redis.set(
      sessionKey,
      JSON.stringify({
        userId: user.id,
        refreshToken,
        deviceName: req.headers['user-agent'],
        ipAddress: req.ip,
        createdAt: new Date()
      }),
      'EX',
      30 * 24 * 60 * 60  // 30 days in seconds
    );

    // 7. Log successful login
    await this.auditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      ipAddress: req.ip,
      metadata: { deviceName: req.headers['user-agent'] }
    });

    // 8. Return response
    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified
        }
      }
    };
  }

                    ↓ Response sent back

┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Frontend receives response and stores tokens        │
└─────────────────────────────────────────────────────────────┘

Frontend (AuthContext.tsx):
  const login = async (credentials) => {
    const response = await authService.login(credentials);

    // Store access token in memory (React state)
    setAccessToken(response.data.accessToken);

    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(response.data.user));

    // Refresh token automatically stored in httpOnly cookie by axios

    // Update auth state
    setUser(response.data.user);
    setIsAuthenticated(true);

    // Redirect to dashboard
    navigate('/dashboard');
  };

┌─────────────────────────────────────────────────────────────┐
│ STEP 6: User is now logged in!                              │
└─────────────────────────────────────────────────────────────┘

Dashboard loads:
  - Shows user's name: "Welcome, John Doe!"
  - Fetches expenses with access token
  - User can interact with app
```

### Request Flow - Protected API Call

Now let's see what happens when the logged-in user fetches expenses:

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User on dashboard, app fetches expenses             │
└─────────────────────────────────────────────────────────────┘

Frontend (Dashboard.tsx):
  useEffect(() => {
    const fetchExpenses = async () => {
      const expenses = await expenseService.getExpenses();
      setExpenses(expenses);
    };

    fetchExpenses();
  }, []);

Frontend (api.ts - Axios setup):
  const api = axios.create({
    baseURL: 'http://localhost:3000',
  });

  // Interceptor automatically adds token to every request
  api.interceptors.request.use((config) => {
    const accessToken = getAccessToken();  // From React state
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

                    ↓ HTTP GET Request
                    ↓ Headers: { Authorization: "Bearer eyJhbGci..." }

┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Request hits NestJS backend                         │
└─────────────────────────────────────────────────────────────┘

Backend (expenses.controller.ts):
  @Get()
  @UseGuards(JwtAuthGuard)  // ← This guard runs BEFORE the method
  async getExpenses(@Request() req) {
    // req.user is automatically populated by guard
    return this.expensesService.getExpenses(req.user.userId);
  }

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: JwtAuthGuard validates the token                    │
└─────────────────────────────────────────────────────────────┘

Backend (jwt-auth.guard.ts):
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // 1. Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // 2. Check if token is blacklisted (logged out)
    const isBlacklisted = await this.redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // 3. Verify JWT signature and expiration
    try {
      const payload = this.jwtService.verify(token);

      // 4. Attach user to request object
      request.user = payload;  // { userId: "uuid-123", email: "john@email.com" }

      return true;  // Allow request to proceed
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

                    ↓ Token valid, request allowed

┌─────────────────────────────────────────────────────────────┐
│ STEP 4: ExpensesService fetches user's expenses             │
└─────────────────────────────────────────────────────────────┘

Backend (expenses.service.ts):
  async getExpenses(userId: string) {
    const expenses = await this.prisma.expense.findMany({
      where: { userId },  // Only this user's expenses!
      orderBy: { date: 'desc' },
      take: 50
    });

    return { success: true, data: expenses };
  }

                    ↓ Response sent back

┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Frontend receives and displays expenses             │
└─────────────────────────────────────────────────────────────┘

Frontend (Dashboard.tsx):
  const expenses = await expenseService.getExpenses();
  // [
  //   { id: "1", amount: 50, category: "Food", description: "Lunch" },
  //   { id: "2", amount: 25, category: "Transport", description: "Uber" },
  //   ...
  // ]

  // Render in table
  {expenses.map(expense => (
    <tr key={expense.id}>
      <td>{expense.category}</td>
      <td>${expense.amount}</td>
      <td>{expense.description}</td>
    </tr>
  ))}
```

---

## 6. How Everything Fits Together {#integration}

### The Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND STACK                        │
├─────────────────────────────────────────────────────────────┤
│ React 19          │ UI library (components, state)          │
│ TypeScript        │ Type safety for JavaScript              │
│ Vite              │ Build tool (fast dev server, bundling) │
│ React Router      │ Client-side routing (/login, /dashboard)│
│ Tailwind CSS      │ Utility-first styling                   │
│ Axios             │ HTTP client (API calls)                 │
│ React Hook Form   │ Form handling and validation            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        BACKEND STACK                         │
├─────────────────────────────────────────────────────────────┤
│ NestJS            │ Node.js framework (structure, DI)       │
│ TypeScript        │ Type safety                             │
│ Prisma            │ ORM (database queries)                  │
│ Passport.js       │ Authentication strategies               │
│ JWT               │ Token-based auth                        │
│ bcrypt            │ Password hashing                        │
│ class-validator   │ Input validation (DTOs)                 │
│ class-transformer │ Data transformation                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      DATABASE & CACHE                        │
├─────────────────────────────────────────────────────────────┤
│ PostgreSQL        │ Main database (users, expenses, etc.)   │
│ Redis             │ Sessions, cache, rate limiting          │
│ Supabase Storage  │ File storage (avatars, receipts)        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
├─────────────────────────────────────────────────────────────┤
│ SendGrid          │ Email delivery                          │
│ Upstash           │ Managed Redis hosting                   │
│ Supabase          │ Managed PostgreSQL hosting              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT                              │
├─────────────────────────────────────────────────────────────┤
│ Railway           │ Backend hosting                         │
│ Vercel            │ Frontend hosting (alternative)          │
│ Docker            │ Containerization (optional)             │
└─────────────────────────────────────────────────────────────┘
```

### Why We Chose This Stack

**1. Why NestJS for Backend?**
- ✅ Built-in TypeScript support
- ✅ Modular architecture (organized code)
- ✅ Dependency injection (easy testing)
- ✅ Built-in decorators (@Get, @Post, @UseGuards)
- ✅ Similar to Angular (familiar to many developers)
- ✅ Great documentation
- ❌ Alternative: Express (simpler but less structure)

**2. Why React for Frontend?**
- ✅ Most popular UI library
- ✅ Component-based (reusable code)
- ✅ Large ecosystem (lots of libraries)
- ✅ React Hooks (elegant state management)
- ✅ Virtual DOM (fast updates)
- ❌ Alternative: Vue (simpler), Angular (full framework)

**3. Why Vite over Create React App?**
- ✅ 10-100x faster dev server
- ✅ Instant hot module replacement
- ✅ Optimized production builds
- ✅ Modern (uses ES modules)
- ✅ Smaller bundle sizes

**4. Why Prisma over other ORMs?**
- ✅ Best TypeScript support
- ✅ Auto-generated types
- ✅ Intuitive API
- ✅ Great migration system
- ✅ Prisma Studio (visual editor)

**5. Why PostgreSQL over MySQL/MongoDB?**
- ✅ More features (JSON, arrays, full-text search)
- ✅ Better for complex queries
- ✅ ACID compliant (critical for financial data)
- ✅ Open-source and free

**6. Why Redis?**
- ✅ Fastest in-memory database
- ✅ Industry standard for sessions
- ✅ Built-in expiration (auto-cleanup)
- ✅ Atomic operations (rate limiting)

**7. Why JWT over sessions?**
- ✅ Stateless (no server-side storage needed)
- ✅ Scales horizontally (multiple servers)
- ✅ Works with mobile apps
- ✅ Contains user info (no database lookup)

**8. Why Tailwind CSS?**
- ✅ Utility-first (fast development)
- ✅ Small bundle size (only used classes)
- ✅ Responsive design built-in
- ✅ No naming conflicts

---

## 7. Step-by-Step Build Process {#build-process}

### Phase 1: Environment Setup

**1. Install Prerequisites:**
```bash
# Node.js (runtime for JavaScript)
# Download from nodejs.org or:
brew install node@20          # macOS
winget install OpenJS.NodeJS  # Windows
sudo apt install nodejs       # Linux

# Verify installation
node --version   # Should be v20.x
npm --version    # Should be 10.x

# Git (version control)
git --version    # If not installed, download from git-scm.com

# VS Code (code editor)
# Download from code.visualstudio.com
# Install extensions:
# - ESLint
# - Prettier
# - Prisma
# - TypeScript
```

**2. Create Project Structure:**
```bash
mkdir expense-tracker
cd expense-tracker

# Create backend and frontend folders
mkdir backend frontend

# Initialize Git
git init
```

### Phase 2: Backend Setup (Step-by-Step)

**Step 1: Initialize NestJS Project**
```bash
cd backend

# Install NestJS CLI globally
npm install -g @nestjs/cli

# Create NestJS project
nest new . --skip-git

# This creates:
# - src/main.ts (entry point)
# - src/app.module.ts (root module)
# - src/app.controller.ts (example controller)
# - src/app.service.ts (example service)
```

**Step 2: Install Dependencies**
```bash
# Core dependencies
npm install @prisma/client bcrypt jsonwebtoken passport passport-jwt
npm install @nestjs/jwt @nestjs/passport class-validator class-transformer
npm install redis ioredis @sendgrid/mail

# Dev dependencies
npm install -D prisma @types/bcrypt @types/jsonwebtoken @types/passport-jwt
npm install -D @types/node typescript ts-node
```

**Step 3: Set Up Prisma**
```bash
# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env file
```

**Edit prisma/schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                  String    @id @default(uuid())
  fullName            String    @map("full_name")
  email               String    @unique
  passwordHash        String    @map("password_hash")
  emailVerified       Boolean   @default(false) @map("email_verified")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  @@map("users")
}
```

**Step 4: Create Environment Variables**
```bash
# Edit .env file
DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker"
JWT_SECRET="your-super-secret-key-min-32-characters-long"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="30d"
REDIS_URL="redis://localhost:6379"
PORT=3000
```

**Step 5: Run First Migration**
```bash
# Create database tables
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio to view database
npx prisma studio
```

**Step 6: Create Services**
```bash
# Generate Prisma service
nest generate service prisma

# Generate Redis service
nest generate service redis

# Generate Auth module
nest generate module auth
nest generate controller auth
nest generate service auth
```

**Step 7: Implement Prisma Service**

Create `src/prisma/prisma.service.ts`:
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Connected to PostgreSQL database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Disconnected from PostgreSQL database');
  }
}
```

**Step 8: Implement Auth Service (Simplified Version)**

Create `src/auth/auth.service.ts`:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(fullName: string, email: string, password: string) {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        passwordHash,
      }
    });

    // Generate tokens
    const accessToken = this.jwtService.sign(
      { userId: user.id, email: user.email },
      { expiresIn: '15m' }
    );

    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      }
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const accessToken = this.jwtService.sign(
      { userId: user.id, email: user.email },
      { expiresIn: '15m' }
    );

    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      }
    };
  }
}
```

**Step 9: Create Auth Controller**

Create `src/auth/auth.controller.ts`:
```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: { fullName: string; email: string; password: string }) {
    return this.authService.signup(body.fullName, body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}
```

**Step 10: Configure Auth Module**

Edit `src/auth/auth.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}
```

**Step 11: Update App Module**

Edit `src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
```

**Step 12: Enable CORS**

Edit `src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:5173',  // React dev server
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Backend running on http://localhost:${port}`);
}
bootstrap();
```

**Step 13: Start Backend**
```bash
npm run start:dev

# You should see:
# ✅ Connected to PostgreSQL database
# 🚀 Backend running on http://localhost:3000
```

### Phase 3: Frontend Setup (Step-by-Step)

**Step 1: Create React Project with Vite**
```bash
cd ../frontend

# Create Vite React TypeScript project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install
```

**Step 2: Install Additional Dependencies**
```bash
# Core dependencies
npm install react-router-dom axios

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 3: Configure Tailwind**

Edit `tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Edit `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: Create Project Structure**
```bash
mkdir -p src/pages src/components src/services src/context src/types
```

**Step 5: Create API Service**

Create `src/services/api.ts`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add token to requests)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Step 6: Create Auth Service**

Create `src/services/auth.service.ts`:
```typescript
import api from './api';

export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export const authService = {
  async signup(fullName: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/signup', { fullName, email, password });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  },
};
```

**Step 7: Create Auth Context**

Create `src/context/AuthContext.tsx`:
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken, user } = await authService.login(email, password);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    setIsAuthenticated(true);
  };

  const signup = async (fullName: string, email: string, password: string) => {
    const { accessToken, user } = await authService.signup(fullName, email, password);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Step 8: Create Login Page**

Create `src/pages/Login.tsx`:
```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-500 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
```

**Step 9: Create Dashboard Page**

Create `src/pages/Dashboard.tsx`:
```typescript
import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">ExpenseAI</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.fullName}!</span>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-8">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <p>Your expenses will appear here!</p>
      </div>
    </div>
  );
}
```

**Step 10: Set Up Routing**

Edit `src/App.tsx`:
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

**Step 11: Start Frontend**
```bash
npm run dev

# Opens http://localhost:5173
```

### Testing the Complete Flow

**1. Create an account:**
- Go to http://localhost:5173
- Click "Sign up"
- Enter details and submit
- Should redirect to dashboard

**2. Verify in database:**
```bash
cd backend
npx prisma studio
# View users table - your user should be there!
```

**3. Test login:**
- Logout
- Login with same credentials
- Should work!

---

## 8. Server Deployment Guide {#deployment}

### Deploying to Railway

**Step 1: Sign Up for Services**

1. **Supabase** (Database)
   - Go to supabase.com
   - Create account
   - Create new project
   - Get connection string from Settings → Database
   - Copy `DATABASE_URL`

2. **Upstash** (Redis)
   - Go to upstash.com
   - Create account
   - Create Redis database
   - Copy `REDIS_URL`

3. **SendGrid** (Email)
   - Go to sendgrid.com
   - Create account
   - Verify sender email
   - Create API key
   - Copy `SENDGRID_API_KEY`

4. **Railway** (Hosting)
   - Go to railway.app
   - Sign up with GitHub
   - No credit card needed for trial

**Step 2: Prepare Backend for Deployment**

Create `backend/package.json` scripts:
```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/main",
    "postinstall": "prisma generate"
  }
}
```

Create `railway.json` in root:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "services": {
    "backend": {
      "buildCommand": "cd backend && npm install && npm run build",
      "startCommand": "cd backend && npx prisma migrate deploy && npm run start:prod",
      "source": {
        "path": "backend"
      }
    }
  }
}
```

**Step 3: Deploy Backend**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to project
railway link

# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set REDIS_URL="rediss://..."
railway variables set JWT_SECRET="your-secret-key-min-32-chars"
railway variables set SENDGRID_API_KEY="SG...."
railway variables set PORT="3000"

# Deploy
railway up
```

**Step 4: Deploy Frontend**

Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Follow prompts
# Set environment variable:
# VITE_API_URL=https://your-backend.railway.app
```

Option B: Railway
```json
// Add to railway.json
{
  "services": {
    "frontend": {
      "buildCommand": "cd frontend && npm install && npm run build",
      "startCommand": "cd frontend && npx serve dist -s -p $PORT",
      "source": {
        "path": "frontend"
      }
    }
  }
}
```

**Step 5: Update CORS**

In backend `main.ts`:
```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'https://your-frontend.vercel.app'
  ],
  credentials: true,
});
```

**Step 6: Run Migrations on Production**

```bash
railway run npx prisma migrate deploy
```

**Step 7: Test Production**

- Go to your frontend URL
- Sign up
- Login
- Verify in Supabase dashboard

---

## Next Steps

Now that you understand all the technologies, we'll build version1 step-by-step with:

1. ✅ Detailed comments explaining every line
2. ✅ Console logs showing what's happening
3. ✅ Error handling with explanations
4. ✅ Tests for each feature
5. ✅ Documentation for each file

This will be a complete learning experience where you'll understand exactly why and how everything works!

---

## Quick Reference

### Common Commands

```bash
# Backend
cd backend
npm run start:dev              # Start dev server
npx prisma studio              # View database
npx prisma migrate dev         # Create migration
npx prisma generate            # Generate client

# Frontend
cd frontend
npm run dev                    # Start dev server
npm run build                  # Build for production

# Database
psql -U postgres               # Connect to PostgreSQL
redis-cli                      # Connect to Redis
```

### Folder Structure

```
expense-tracker/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── auth/              # Auth module
│   │   ├── prisma/            # Prisma service
│   │   ├── redis/             # Redis service
│   │   └── main.ts            # Entry point
│   ├── .env                   # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API services
│   │   ├── context/           # React contexts
│   │   └── App.tsx            # Root component
│   └── package.json
│
└── railway.json               # Deployment config
```

Ready to build version1? Let's go! 🚀
