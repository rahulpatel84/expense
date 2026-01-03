# DTOs (Data Transfer Objects) - Complete Guide

## What Are DTOs?

DTOs are classes that define the **shape and validation rules** for data coming from the client.

### Real-World Analogy

Think of a DTO like a restaurant order form:

```
┌─────────────────────────────────┐
│      RESTAURANT ORDER FORM      │
├─────────────────────────────────┤
│ Name: ________________          │ ← Must be filled (required)
│                                 │
│ Phone: (___) ___-____           │ ← Must be valid format
│                                 │
│ Pizza Size:                     │
│  ○ Small  ○ Medium  ○ Large     │ ← Must pick one option
│                                 │
│ Toppings:                       │
│  □ Pepperoni □ Mushrooms        │ ← Optional, can pick multiple
└─────────────────────────────────┘
```

**Without the form:** Customer could say anything
- "I want a dinosaur-sized pizza" ❌
- "Call me at ABC-DEFG" ❌
- "I want pizza but no size" ❌

**With the form:** Kitchen only gets valid orders
- Size must be Small/Medium/Large ✅
- Phone must be valid format ✅
- All required info is present ✅

DTOs do the same for API requests!

---

## Why Do We Need DTOs?

### 1. Input Validation

**Without DTO:**
```typescript
@Post('signup')
async signup(@Body() data: any) {
  // What if data.email is missing?
  // What if data.password is "123"?
  // What if data has extra fields like "isAdmin: true"?
  // We'd need to manually check everything!
}
```

**With DTO:**
```typescript
@Post('signup')
async signup(@Body() signupDto: SignupDto) {
  // At this point we KNOW:
  // - Email is valid format
  // - Password is strong enough
  // - No malicious extra fields
  // We can trust the data!
}
```

### 2. Type Safety

TypeScript auto-completion works:
```typescript
async signup(signupDto: SignupDto) {
  // IDE shows: signupDto.email, signupDto.password, signupDto.fullName
  console.log(signupDto.email); // TypeScript knows this exists
}
```

### 3. Auto-Documentation

Other developers (or your future self) can see exactly what data is needed:

```typescript
export class SignupDto {
  @IsEmail()
  email: string;  // ← "Oh, I need to send an email field"

  @MinLength(8)
  password: string;  // ← "Password must be at least 8 characters"

  @IsNotEmpty()
  fullName: string;  // ← "Full name is required"
}
```

### 4. Security

Prevents **Mass Assignment Attacks**:

**Attack Attempt:**
```bash
curl -X POST /auth/signup \
  -d '{
    "email": "hacker@evil.com",
    "password": "Pass123!",
    "fullName": "Hacker",
    "isAdmin": true,        ← Trying to make themselves admin!
    "emailVerified": true   ← Trying to bypass verification!
  }'
```

**DTO Protection:**
```typescript
export class SignupDto {
  email: string;
  password: string;
  fullName: string;
  // Only these 3 fields are accepted!
  // "isAdmin" and "emailVerified" are automatically rejected
}
```

---

## Our DTOs Explained

### SignupDto (Creating New Account)

**File:** `signup.dto.ts`

**Purpose:** Validate new user registration

**Fields:**
```typescript
email: string           // Must be valid email format
password: string        // Must be 8+ chars with uppercase, lowercase, number, special char
fullName: string        // Required, cannot be empty
```

**Example Valid Request:**
```json
{
  "email": "john@example.com",
  "password": "MySecure123!",
  "fullName": "John Doe"
}
```

**Example Invalid Request (weak password):**
```json
{
  "email": "john@example.com",
  "password": "weak",     ← Too short, no uppercase, no special char
  "fullName": "John Doe"
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": [
    "Password must be at least 8 characters long",
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  ],
  "error": "Bad Request"
}
```

---

### LoginDto (Authenticating Existing User)

**File:** `login.dto.ts`

**Purpose:** Validate login attempts

**Fields:**
```typescript
email: string           // Must be valid email format
password: string        // Any non-empty string (no strength check!)
```

**Why no password strength check on login?**

Imagine this scenario:
1. User signed up in 2020 with password "oldpass123"
2. In 2024, we add requirement: "Must have special characters"
3. If we enforce on login, user can't login anymore!

**Solution:** Only enforce password strength on:
- Signup (new accounts)
- Password change (updating password)

**NOT on login** (existing accounts might have old weak passwords)

---

## Common Validation Decorators

### String Validators

```typescript
@IsString()              // Must be text (not number, object, etc.)
@IsNotEmpty()            // Cannot be empty string or whitespace
@MinLength(8)            // Must be at least 8 characters
@MaxLength(100)          // Cannot exceed 100 characters
@Matches(/regex/)        // Must match regular expression pattern
```

### Email Validator

```typescript
@IsEmail()               // Must be valid email format
```

What counts as valid email?
- ✅ `john@example.com`
- ✅ `user.name+tag@company.co.uk`
- ✅ `test_email@subdomain.domain.com`
- ❌ `not-an-email` (no @)
- ❌ `missing@domain` (no TLD like .com)
- ❌ `@example.com` (no local part)

### Number Validators

```typescript
@IsNumber()              // Must be a number
@Min(0)                  // Must be at least 0
@Max(100)                // Cannot exceed 100
@IsPositive()            // Must be positive number
```

### Boolean Validators

```typescript
@IsBoolean()             // Must be true or false
```

### Optional Fields

```typescript
@IsOptional()            // Field can be missing or null
@IsString()
bio?: string;            // User bio is optional
```

---

## How Validation Works Behind the Scenes

### Step-by-Step Flow

```
Client                  NestJS                      Database
  │                       │                            │
  │  1. POST /auth/signup │                            │
  ├──────────────────────→│                            │
  │  {                    │                            │
  │    email: "...",      │                            │
  │    password: "..."    │                            │
  │  }                    │                            │
  │                       │                            │
  │                       │ 2. ValidationPipe runs     │
  │                       │    class-validator         │
  │                       │                            │
  │                       │ 3. Check @IsEmail()        │
  │                       │    Check @MinLength()      │
  │                       │    Check @Matches()        │
  │                       │                            │
  │                ┌──────┴──────┐                     │
  │                │             │                     │
  │         Validation    Validation                   │
  │           Fails         Passes                     │
  │                │             │                     │
  │  400 Bad Request   Controller.signup()            │
  │ ←──────────────│      │                            │
  │                │      │ 4. Business logic          │
  │                │      ├───────────────────────────→│
  │                │      │                    5. Save to DB
  │                │      │                            │
  │                │      │ 6. Success                 │
  │  201 Created   │      ├────────────────────────────┤
  │ ←──────────────┴──────┤                            │
  │                       │                            │
```

### Configuration in main.ts

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // Remove unknown properties
  forbidNonWhitelisted: true,   // Throw error on unknown properties
  transform: true,              // Transform to DTO class instance
}));
```

**What each option does:**

**`whitelist: true`**
```typescript
// Client sends:
{ "email": "john@example.com", "password": "Pass123!", "isAdmin": true }

// DTO accepts:
{ "email": "john@example.com", "password": "Pass123!" }
// "isAdmin" is silently removed
```

**`forbidNonWhitelisted: true`**
```typescript
// Client sends:
{ "email": "john@example.com", "password": "Pass123!", "isAdmin": true }

// Response:
{
  "statusCode": 400,
  "message": ["property isAdmin should not exist"],
  "error": "Bad Request"
}
// Throws error instead of silently removing
```

**`transform: true`**
```typescript
// Converts plain object to DTO class instance
// This allows decorators to work properly
// Also does type coercion (string "123" → number 123)
```

---

## Testing DTOs

### Test 1: Valid Signup

```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "MySecure123!",
    "fullName": "John Doe"
  }'
```

**Expected:** 201 Created (account created)

---

### Test 2: Invalid Email

```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "MySecure123!",
    "fullName": "John Doe"
  }'
```

**Expected:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["Please provide a valid email address"],
  "error": "Bad Request"
}
```

---

### Test 3: Weak Password

```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "weak",
    "fullName": "John Doe"
  }'
```

**Expected:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "Password must be at least 8 characters long",
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  ],
  "error": "Bad Request"
}
```

---

### Test 4: Missing Field

```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "MySecure123!"
  }'
```

**Expected:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["Full name is required"],
  "error": "Bad Request"
}
```

---

### Test 5: Extra Fields (Attack Attempt)

```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "MySecure123!",
    "fullName": "John Doe",
    "isAdmin": true,
    "emailVerified": true
  }'
```

**Expected:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "property isAdmin should not exist",
    "property emailVerified should not exist"
  ],
  "error": "Bad Request"
}
```

---

## Common Mistakes and Solutions

### Mistake 1: Forgetting @IsNotEmpty()

```typescript
// ❌ BAD: Email can be empty string
@IsEmail()
email: string;
```

```typescript
// ✅ GOOD: Email must be non-empty AND valid format
@IsEmail()
@IsNotEmpty()
email: string;
```

---

### Mistake 2: Wrong Order of Decorators

```typescript
// ❌ BAD: @MinLength runs before @IsString
@MinLength(8)
@IsString()
password: string;
```

```typescript
// ✅ GOOD: Check type first, then length
@IsString()
@MinLength(8)
password: string;
```

**Why order matters:**
- Type check should come first
- Then more specific validations

---

### Mistake 3: Not Handling Optional Fields

```typescript
// ❌ BAD: TypeScript allows undefined, but validator doesn't
bio: string | undefined;
```

```typescript
// ✅ GOOD: Use @IsOptional() decorator
@IsOptional()
@IsString()
bio?: string;
```

---

### Mistake 4: Using same DTO for Different Operations

```typescript
// ❌ BAD: Using SignupDto for user updates
@Patch('profile')
updateProfile(@Body() signupDto: SignupDto) {
  // What if user only wants to change name, not password?
}
```

```typescript
// ✅ GOOD: Create separate UpdateProfileDto
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

@Patch('profile')
updateProfile(@Body() updateDto: UpdateProfileDto) {
  // Only updates provided fields
}
```

---

## Next Steps

Now that we have DTOs for validation, we need:

1. **Auth Service** - Business logic for signup/login
2. **Auth Controller** - HTTP endpoints that use these DTOs
3. **JWT Strategy** - Token generation and verification

Let's build the Auth Service next! 🚀
