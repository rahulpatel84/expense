/**
 * auth.service.ts - Authentication Business Logic
 *
 * WHAT IS A SERVICE?
 * A service contains business logic (the "brains" of your application)
 *
 * ANALOGY:
 * - Controller = Receptionist (takes requests, returns responses)
 * - Service = Office worker (does the actual work)
 * - Database = Filing cabinet (stores data)
 *
 * Flow:
 * 1. Client → Controller: "I want to sign up"
 * 2. Controller → Service: "Here's the user data, process it"
 * 3. Service → Database: "Check if email exists, hash password, save user"
 * 4. Database → Service: "Done! Here's the user"
 * 5. Service → Controller: "Here's the JWT token"
 * 6. Controller → Client: "Success! You're logged in"
 *
 * WHY SEPARATE SERVICE FROM CONTROLLER?
 * - Controller = HTTP stuff (requests, responses, status codes)
 * - Service = Business logic (can be reused elsewhere, easier to test)
 *
 * Example: Service can be used by:
 * - REST API controller
 * - GraphQL resolver
 * - CLI command
 * - Background job
 * All reusing same logic!
 */

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

/**
 * @Injectable() Decorator
 *
 * Tells NestJS: "This class can be injected into other classes"
 *
 * Now we can do:
 * constructor(private authService: AuthService) {}
 */
@Injectable()
export class AuthService {
  /**
   * CONSTANTS
   *
   * Configuration values used throughout the service
   */

  /**
   * BCRYPT_SALT_ROUNDS
   *
   * How many times to hash the password
   *
   * What are salt rounds?
   * - Salt = Random data added to password before hashing
   * - Rounds = How many times to run the hashing algorithm
   *
   * Why 10 rounds?
   * - 1 round: Too fast, easy to crack (0.001 seconds)
   * - 10 rounds: Good balance (0.1 seconds)
   * - 20 rounds: Very slow (10 seconds per password!)
   *
   * Security vs Performance:
   * ┌────────┬──────────────┬────────────────────┐
   * │ Rounds │ Time to Hash │ Security Level     │
   * ├────────┼──────────────┼────────────────────┤
   * │ 1      │ 0.001s       │ ❌ Weak (crackable)│
   * │ 5      │ 0.01s        │ ⚠️  Low             │
   * │ 10     │ 0.1s         │ ✅ Good (standard)  │
   * │ 12     │ 0.4s         │ ✅ Better           │
   * │ 15     │ 3.2s         │ ✅ Very good        │
   * │ 20     │ 100s         │ ⚠️  Too slow        │
   * └────────┴──────────────┴────────────────────┘
   *
   * For production: 10-12 is industry standard
   */
  private readonly BCRYPT_SALT_ROUNDS = 10;

  /**
   * MAX_FAILED_ATTEMPTS
   *
   * How many wrong passwords before locking account
   *
   * Why lock accounts?
   * - Prevents brute force attacks
   * - Attacker can't try 1 million passwords
   * - Forces them to reset password (email verification)
   *
   * Why 5 attempts?
   * - User might genuinely forget password 2-3 times
   * - But 5+ attempts likely indicates attack
   * - Industry standard (most banks use 3-5)
   */
  private readonly MAX_FAILED_ATTEMPTS = 5;

  /**
   * ACCOUNT_LOCK_DURATION_MS
   *
   * How long to lock account after max failed attempts
   *
   * 15 minutes = 15 * 60 * 1000 milliseconds
   *
   * Why 15 minutes?
   * - Long enough to deter automated attacks
   * - Short enough to not annoy legitimate users
   * - User can also reset password to unlock immediately
   */
  private readonly ACCOUNT_LOCK_DURATION_MS = 15 * 60 * 1000;

  /**
   * DEPENDENCY INJECTION
   *
   * The constructor receives services we need:
   * - prisma: To query database
   * - jwtService: To generate JWT tokens
   *
   * NestJS automatically creates and injects these
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * ═══════════════════════════════════════════════════════════════
   * SIGNUP METHOD - Create New User Account
   * ═══════════════════════════════════════════════════════════════
   *
   * What this method does:
   * 1. Check if email already exists
   * 2. Hash the password (bcrypt with salt)
   * 3. Create user in database
   * 4. Generate JWT access & refresh tokens
   * 5. Return tokens and user info
   *
   * @param signupDto - Validated signup data (email, password, fullName)
   * @returns Object with tokens and user info
   * @throws ConflictException if email already exists
   */
  async signup(signupDto: SignupDto) {
    console.log('📝 Starting signup process for:', signupDto.email);

    /**
     * STEP 1: Check if email already exists
     *
     * Why check first?
     * - Email must be unique (database constraint)
     * - Better to return friendly error than database error
     * - Prevents wasted password hashing if email is taken
     *
     * findUnique() returns:
     * - User object if found
     * - null if not found
     */
    const existingUser = await this.prisma.user.findUnique({
      where: { email: signupDto.email },
    });

    if (existingUser) {
      console.log('❌ Email already exists:', signupDto.email);

      /**
       * ConflictException
       *
       * HTTP 409 Conflict
       * Used when resource already exists
       *
       * Client will receive:
       * {
       *   "statusCode": 409,
       *   "message": "Email already registered. Please login or use a different email.",
       *   "error": "Conflict"
       * }
       */
      throw new ConflictException(
        'Email already registered. Please login or use a different email.',
      );
    }

    console.log('✅ Email is available');

    /**
     * STEP 2: Hash the password
     *
     * WHAT IS PASSWORD HASHING?
     *
     * Plain password: "MySecure123!"
     * After hashing: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
     *
     * Properties:
     * - ONE-WAY: Can't reverse hash to get original password
     * - DETERMINISTIC: Same password → different hash (due to salt)
     * - SLOW: Takes ~0.1 seconds (prevents brute force)
     *
     * How bcrypt works:
     * 1. Generate random salt
     * 2. Combine password + salt
     * 3. Hash 2^10 times (1024 iterations)
     * 4. Store hash (includes salt in the string)
     *
     * Hash format:
     * $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
     * │ │ │  │                                                      │
     * │ │ │  │                                                      └─ Hash (31 chars)
     * │ │ │  └─ Salt (22 chars)
     * │ │ └─ Cost factor (10 = 2^10 rounds)
     * │ └─ Minor version
     * └─ Algorithm (2b = bcrypt)
     *
     * Security:
     * - Attacker gets database: Sees hash, not password ✅
     * - Attacker tries to crack: Would take years with bcrypt ✅
     * - Same password, different users: Different hashes (salt) ✅
     */
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(
      signupDto.password,
      this.BCRYPT_SALT_ROUNDS,
    );
    console.log('✅ Password hashed successfully');

    /**
     * STEP 3: Create user in database
     *
     * What happens:
     * 1. Prisma generates SQL INSERT statement
     * 2. PostgreSQL creates new row in users table
     * 3. PostgreSQL returns the created user
     * 4. Prisma converts to TypeScript object
     *
     * SQL equivalent:
     * INSERT INTO users (
     *   id, full_name, email, password_hash,
     *   currency_code, email_verified, onboarding_completed,
     *   failed_login_attempts, created_at, updated_at
     * )
     * VALUES (
     *   uuid_generate_v4(), 'John Doe', 'john@example.com', '$2b$10$...',
     *   'USD', false, false, 0, NOW(), NOW()
     * )
     * RETURNING *;
     *
     * Note: We DON'T store the plain password!
     * Only the hash is stored.
     */
    console.log('💾 Creating user in database...');
    const user = await this.prisma.user.create({
      data: {
        email: signupDto.email,
        passwordHash: passwordHash,
        fullName: signupDto.fullName,
        // These fields have defaults in schema, but we can override:
        currencyCode: 'USD',
        emailVerified: false,
        onboardingCompleted: false,
        failedLoginAttempts: 0,
      },
    });
    console.log('✅ User created with ID:', user.id);

    /**
     * STEP 4: Generate JWT tokens
     *
     * We generate TWO tokens:
     * - Access Token: Short-lived (15 minutes), used for API requests
     * - Refresh Token: Long-lived (7 days), used to get new access tokens
     *
     * Why two tokens?
     * - Access token stolen: Attacker has 15 min access (limited damage)
     * - Refresh token stolen: Can be revoked in database
     * - Best of both: Security + convenience
     *
     * Token payload (data stored in token):
     * {
     *   sub: "user-uuid",        // Subject (user ID)
     *   email: "john@example.com",
     *   iat: 1672531200,         // Issued At timestamp
     *   exp: 1672532100          // Expiration timestamp
     * }
     *
     * How JWT works:
     * 1. Server signs payload with secret key
     * 2. Creates token: header.payload.signature
     * 3. Client stores token (localStorage, cookie, etc.)
     * 4. Client sends token with each request
     * 5. Server verifies signature (proves authenticity)
     * 6. Server extracts payload (knows who user is)
     *
     * Example tokens:
     * Access Token (short):
     * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dWlkIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNjcyNTMxMjAwLCJleHAiOjE2NzI1MzIxMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
     *
     * Refresh Token (long):
     * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dWlkIiwiaWF0IjoxNjcyNTMxMjAwLCJleHAiOjE2NzMxMzYwMDB9.dQw4w9WgXcQ
     */
    const tokens = await this.generateTokens(user.id, user.email);

    console.log('🎉 Signup successful for:', user.email);

    /**
     * STEP 5: Return response
     *
     * What we return:
     * - accessToken: For API requests
     * - refreshToken: To get new access tokens
     * - user: User info (without sensitive data like password hash)
     *
     * What we DON'T return:
     * - passwordHash: NEVER send this to client!
     * - failedLoginAttempts: Internal security info
     * - lockedUntil: Internal security info
     */
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * LOGIN METHOD - Authenticate Existing User
   * ═══════════════════════════════════════════════════════════════
   *
   * What this method does:
   * 1. Find user by email
   * 2. Check if account is locked
   * 3. Verify password hash matches
   * 4. Reset failed attempts on success
   * 5. Generate JWT tokens
   * 6. Return tokens and user info
   *
   * OR handle failures:
   * - Increment failed attempts
   * - Lock account after max attempts
   * - Return generic error (don't reveal which field is wrong)
   *
   * @param loginDto - Validated login data (email, password)
   * @returns Object with tokens and user info
   * @throws UnauthorizedException if credentials are invalid or account locked
   */
  async login(loginDto: LoginDto) {
    console.log('🔐 Login attempt for:', loginDto.email);

    /**
     * STEP 1: Find user by email
     *
     * Why use findUnique?
     * - Email has unique constraint in database
     * - Faster than findFirst (uses index)
     * - Returns null if not found (not an error)
     */
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    /**
     * SECURITY: Don't reveal if email exists or not
     *
     * ❌ BAD:
     * if (!user) throw new Error('Email not found');
     * if (wrong password) throw new Error('Wrong password');
     *
     * Why bad?
     * - Attacker can test if emails are registered
     * - Attacker can build list of valid emails
     * - Attacker knows which field to focus on
     *
     * ✅ GOOD:
     * if (!user || wrong password) throw new Error('Invalid credentials');
     *
     * Why good?
     * - Attacker doesn't know if email exists
     * - Attacker doesn't know which field is wrong
     * - Forces attacker to guess both fields
     */
    if (!user) {
      console.log('❌ Login failed: User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    /**
     * STEP 2: Check if account is locked
     *
     * Account gets locked after too many failed attempts
     * This prevents brute force attacks
     *
     * lockedUntil = timestamp when lock expires
     * - null: Account not locked
     * - future date: Account locked until that time
     * - past date: Lock expired, can login
     */
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );

      console.log(
        `🔒 Account locked for ${minutesLeft} more minutes:`,
        user.email,
      );

      throw new UnauthorizedException(
        `Account locked due to too many failed login attempts. Please try again in ${minutesLeft} minutes or reset your password.`,
      );
    }

    /**
     * STEP 3: Verify password
     *
     * bcrypt.compare() does:
     * 1. Extract salt from stored hash
     * 2. Hash provided password with same salt
     * 3. Compare hashes (constant-time comparison)
     * 4. Return true if match, false otherwise
     *
     * Why constant-time comparison?
     * - Prevents timing attacks
     * - Takes same time regardless of result
     * - Attacker can't guess based on response time
     *
     * Example:
     * User password: "MySecure123!"
     * Stored hash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
     *
     * User enters: "MySecure123!"
     * bcrypt.compare() → true ✅
     *
     * User enters: "WrongPassword"
     * bcrypt.compare() → false ❌
     */
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash || '',
    );

    if (!isPasswordValid) {
      console.log('❌ Login failed: Invalid password');

      /**
       * HANDLE FAILED LOGIN ATTEMPT
       *
       * 1. Increment failed attempts counter
       * 2. Update last failed login timestamp
       * 3. If max attempts reached: Lock account
       */
      await this.handleFailedLogin(user.id, user.failedLoginAttempts);

      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('✅ Password verified');

    /**
     * STEP 4: Reset failed login attempts
     *
     * User logged in successfully, so:
     * - Reset failed attempts to 0
     * - Clear locked until time
     * - Update last login timestamp
     *
     * This is important:
     * - User might have had failed attempts in the past
     * - Successful login proves they're legitimate
     * - Reset counter for next login attempt tracking
     */
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    console.log('✅ Login successful for:', user.email);

    /**
     * STEP 5: Generate JWT tokens
     */
    const tokens = await this.generateTokens(user.id, user.email);

    /**
     * STEP 6: Return response
     */
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * REFRESH TOKEN METHOD - Get New Access Token
   * ═══════════════════════════════════════════════════════════════
   *
   * What this method does:
   * 1. Verify refresh token is valid
   * 2. Extract user ID from token
   * 3. Check if user still exists
   * 4. Generate new access token
   * 5. Return new access token
   *
   * @param refreshToken - The long-lived refresh token
   * @returns Object with new accessToken
   * @throws UnauthorizedException if refresh token is invalid or expired
   */
  async refreshToken(refreshToken: string) {
    console.log('🔄 Refreshing access token...');

    try {
      /**
       * STEP 1: Verify refresh token
       *
       * jwtService.verifyAsync() does:
       * 1. Split token into header.payload.signature
       * 2. Recalculate signature using JWT_SECRET
       * 3. Compare signatures
       * 4. Check expiration time
       * 5. If all valid, return decoded payload
       * 6. If invalid/expired, throw error
       *
       * What we get back (if valid):
       * {
       *   sub: "user-uuid",
       *   email: "john@example.com",
       *   iat: 1767272721,  // Issued at
       *   exp: 1767877521   // Expires in 7 days
       * }
       */
      const payload = await this.jwtService.verifyAsync(refreshToken);

      console.log('✅ Refresh token verified for user:', payload.email);

      /**
       * STEP 2: Check if user still exists
       *
       * Why check?
       * - User might have been deleted
       * - Account might have been banned
       * - Email might have changed
       *
       * Better to validate than issue token for non-existent user
       */
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        console.log('❌ User no longer exists:', payload.sub);
        throw new UnauthorizedException('User not found');
      }

      console.log('✅ User still exists, generating new access token');

      /**
       * STEP 3: Generate new access token
       *
       * Note: We only return a new ACCESS token
       * Refresh token stays the same (still valid for 7 days)
       *
       * Why not issue new refresh token?
       * - Refresh token lasts 7 days
       * - Access token lasts 15 minutes
       * - User will refresh access token many times
       * - Only need new refresh token when it expires
       */
      const tokens = await this.generateTokens(user.id, user.email);

      /**
       * OPTIONAL: Refresh token rotation
       *
       * Some apps issue BOTH new access + refresh tokens
       * This invalidates old refresh token (more secure)
       *
       * return {
       *   accessToken: tokens.accessToken,
       *   refreshToken: tokens.refreshToken  // New refresh token
       * };
       *
       * Then store mapping in database/Redis:
       * - refreshTokenId → userId
       * - On refresh: Invalidate old, issue new
       * - Prevents stolen refresh token reuse
       *
       * For this tutorial, we'll keep it simple
       */

      console.log('✅ New access token generated');

      return {
        accessToken: tokens.accessToken,
      };
    } catch (error: any) {
      /**
       * ERROR HANDLING
       *
       * Possible errors:
       * 1. JsonWebTokenError - Token malformed
       * 2. TokenExpiredError - Refresh token expired
       * 3. Other errors - Database issues, etc.
       *
       * For all cases: Force user to login again
       */
      console.log('❌ Refresh token verification failed:', error.message);

      throw new UnauthorizedException(
        'Invalid or expired refresh token. Please login again.',
      );
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * HELPER METHOD: Generate JWT Tokens
   * ═══════════════════════════════════════════════════════════════
   *
   * Generates both access and refresh tokens
   *
   * @param userId - User's unique ID
   * @param email - User's email
   * @returns Object with accessToken and refreshToken
   *
   * PRIVATE method (only used internally by this service)
   */
  private async generateTokens(userId: string, email: string) {
    /**
     * JWT PAYLOAD
     *
     * Data embedded in the token
     * This data is BASE64-encoded (NOT encrypted!)
     * Anyone can decode and read it
     * So don't include sensitive data (password, credit card, etc.)
     *
     * Standard claims:
     * - sub: Subject (who the token is about) = userId
     * - iat: Issued At (when token was created)
     * - exp: Expiration (when token expires)
     *
     * Custom claims:
     * - email: User's email (for convenience)
     */
    const payload = {
      sub: userId,
      email: email,
    };

    /**
     * ACCESS TOKEN
     *
     * Short-lived token for API requests
     *
     * expiresIn: '15m' = 15 minutes
     *
     * Why short-lived?
     * - If stolen, attacker only has 15 min access
     * - User won't notice if device stolen
     * - Limits damage from XSS attacks
     *
     * How it's used:
     * Client sends in header: Authorization: Bearer <accessToken>
     * Server verifies signature and extracts user ID
     * Server knows who is making the request
     */
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    /**
     * REFRESH TOKEN
     *
     * Long-lived token to get new access tokens
     *
     * expiresIn: '7d' = 7 days
     *
     * Why long-lived?
     * - User doesn't have to login every 15 minutes
     * - More convenient user experience
     * - Can be revoked if suspicious activity
     *
     * How it's used:
     * 1. Access token expires after 15 min
     * 2. Client sends refresh token to /auth/refresh endpoint
     * 3. Server generates new access token
     * 4. Client continues making requests
     *
     * Security:
     * - Stored securely (httpOnly cookie or secure storage)
     * - Can be revoked in database
     * - Requires additional endpoint to use (can add rate limiting)
     */
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * HELPER METHOD: Handle Failed Login
   * ═══════════════════════════════════════════════════════════════
   *
   * Tracks failed login attempts and locks account if needed
   *
   * @param userId - User's unique ID
   * @param currentFailedAttempts - Current number of failed attempts
   *
   * PRIVATE method (only used internally by this service)
   */
  private async handleFailedLogin(
    userId: string,
    currentFailedAttempts: number,
  ) {
    const newFailedAttempts = currentFailedAttempts + 1;

    console.log(
      `⚠️  Failed login attempt ${newFailedAttempts}/${this.MAX_FAILED_ATTEMPTS}`,
    );

    /**
     * ACCOUNT LOCKOUT LOGIC
     *
     * If user reaches max failed attempts:
     * - Lock account for 15 minutes
     * - User must wait or reset password
     */
    const shouldLock = newFailedAttempts >= this.MAX_FAILED_ATTEMPTS;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + this.ACCOUNT_LOCK_DURATION_MS)
      : null;

    /**
     * UPDATE DATABASE
     *
     * - Increment failed attempts counter
     * - Update timestamp of last failed attempt
     * - Set locked until time (if max attempts reached)
     */
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newFailedAttempts,
        lastFailedLoginAt: new Date(),
        lockedUntil: lockedUntil,
      },
    });

    if (shouldLock) {
      console.log(`🔒 Account locked until:`, lockedUntil);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * FORGOT PASSWORD METHOD - Request Password Reset
   * ═══════════════════════════════════════════════════════════════
   *
   * What this method does:
   * 1. Find user by email (if exists)
   * 2. Generate random reset token
   * 3. Hash token and store in database
   * 4. Send reset email with unhashed token
   * 5. Return success message (same message whether email exists or not)
   *
   * @param email - User's email address
   * @returns Success message
   *
   * SECURITY NOTE:
   * We return the same message whether email exists or not.
   * This prevents attackers from discovering which emails are registered.
   */
  async forgotPassword(email: string) {
    console.log('📧 Starting forgot password process for:', email);

    /**
     * STEP 1: Find user by email
     *
     * We check if user exists, but won't tell the client!
     * Same message whether user exists or not (security)
     */
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('ℹ️ User not found, but returning success message (security)');

      /**
       * SECURITY: Return success even if email doesn't exist
       *
       * Why?
       * - Prevents email enumeration attacks
       * - Attacker can't discover which emails are registered
       *
       * Example attack without this:
       * 1. Attacker tries: "ceo@company.com" → "Email not found"
       * 2. Attacker tries: "admin@company.com" → "Reset email sent"
       * 3. Attacker now knows admin@company.com is registered
       * 4. Attacker can target that email with phishing, etc.
       *
       * With vague message:
       * - All emails get same message
       * - Attacker can't tell which emails exist
       */
      return {
        message:
          'If the email exists in our system, a password reset link has been sent.',
      };
    }

    console.log('✅ User found:', user.id);

    /**
     * STEP 2: Generate random reset token
     *
     * We use crypto.randomBytes() from Node.js
     * - Cryptographically secure random number generator
     * - 32 bytes = 256 bits of randomness
     * - Converted to hex string (64 characters)
     *
     * Example token: "a3f5b8c2d9e4f1g7h6j5k4l3m2n1o9p8q7r6s5t4u3v2w1x0y9z8a7b6c5d4e3f2g1"
     */
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');

    console.log('🔑 Generated reset token (first 10 chars):', resetToken.substring(0, 10) + '...');

    /**
     * STEP 3: Hash the token
     *
     * WHY HASH THE TOKEN?
     * - Token is sent via email (potentially insecure channel)
     * - If database is leaked, hashed tokens can't be used
     * - Only the user who received email has unhashed token
     *
     * Flow:
     * 1. Generate token: "abc123"
     * 2. Hash it: "$2b$10$xyz..."
     * 3. Store hash in database
     * 4. Send unhashed token via email
     * 5. User clicks link with token "abc123"
     * 6. Server hashes "abc123" and compares with stored hash
     * 7. If match → Token is valid
     *
     * Security:
     * - Database leaked: Attacker has hashes, but can't reverse them
     * - Email intercepted: Attacker has token, but database has hash
     * - Both needed for attack (defense in depth)
     */
    console.log('🔒 Hashing reset token...');
    const hashedToken = await bcrypt.hash(resetToken, this.BCRYPT_SALT_ROUNDS);
    console.log('✅ Token hashed successfully');

    /**
     * STEP 4: Store hashed token in database
     *
     * We store:
     * - userId: Link to user
     * - token: Hashed token (for verification)
     * - expiresAt: When token expires (1 hour from now)
     * - used: Whether token has been used (prevents reuse)
     *
     * Why 1 hour expiration?
     * - Long enough for user to check email and reset
     * - Short enough to limit attack window
     * - Industry standard
     *
     * Delete existing reset tokens first:
     * - User might have requested reset multiple times
     * - Only latest token should be valid
     * - Prevents token spam
     */
    console.log('🗑️ Deleting any existing reset tokens for user...');
    await this.prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    console.log('💾 Creating password reset record...');

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hashedToken,
        expiresAt: expiresAt,
        // usedAt is null by default (not used yet)
      },
    });

    console.log('✅ Password reset record created, expires at:', expiresAt);

    /**
     * STEP 5: Send reset email
     *
     * In a real application, you would:
     * 1. Use email service (SendGrid, AWS SES, Mailgun, etc.)
     * 2. Send HTML email with reset link
     * 3. Link format: https://yourapp.com/reset-password?token=abc123
     *
     * Example email content:
     * ─────────────────────────────────────
     * Subject: Reset Your Password
     *
     * Hi John,
     *
     * You requested to reset your password.
     * Click the link below to create a new password:
     *
     * https://yourapp.com/reset-password?token=abc123
     *
     * This link expires in 1 hour.
     *
     * If you didn't request this, ignore this email.
     * ─────────────────────────────────────
     *
     * For this tutorial, we just log it to console.
     */
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    console.log('📧 ════════════════════════════════════════════════════════');
    console.log('📧 PASSWORD RESET EMAIL (would be sent in production):');
    console.log('📧 ════════════════════════════════════════════════════════');
    console.log('📧 To:', user.email);
    console.log('📧 Subject: Reset Your Password');
    console.log('📧');
    console.log('📧 Hi', user.fullName + ',');
    console.log('📧');
    console.log('📧 Click this link to reset your password:');
    console.log('📧', resetLink);
    console.log('📧');
    console.log('📧 This link expires in 1 hour.');
    console.log('📧 ════════════════════════════════════════════════════════');

    /**
     * TODO: In production, integrate email service:
     *
     * import { MailerService } from '@nestjs-modules/mailer';
     *
     * await this.mailerService.sendMail({
     *   to: user.email,
     *   subject: 'Reset Your Password',
     *   template: 'password-reset',
     *   context: {
     *     name: user.fullName,
     *     resetLink: resetLink,
     *   },
     * });
     */

    /**
     * STEP 6: Return success message
     *
     * IMPORTANT: Same message whether email exists or not!
     */
    console.log('✅ Forgot password process completed');
    return {
      message:
        'If the email exists in our system, a password reset link has been sent.',
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * RESET PASSWORD METHOD - Update Password with Token
   * ═══════════════════════════════════════════════════════════════
   *
   * What this method does:
   * 1. Hash the provided token
   * 2. Find password reset record by hashed token
   * 3. Verify token is not expired and not used
   * 4. Hash new password
   * 5. Update user's password
   * 6. Delete password reset record (one-time use)
   * 7. Return success message
   *
   * @param token - Reset token from email link
   * @param newPassword - New password user wants to set
   * @returns Success message
   * @throws UnauthorizedException if token invalid/expired
   * @throws BadRequestException if token already used
   */
  async resetPassword(token: string, newPassword: string) {
    console.log('🔑 Starting password reset process');
    console.log('🔑 Token (first 10 chars):', token.substring(0, 10) + '...');

    /**
     * STEP 1: Find all password reset records
     *
     * Why get all records instead of finding by token?
     * - Token is hashed in database
     * - We can't query by hashed value directly
     * - Need to compare hashes using bcrypt.compare()
     *
     * Alternative approach (slower but simpler):
     * - Get all password reset records
     * - Loop through each one
     * - Compare provided token with each stored hash
     * - Find the matching one
     *
     * Better approach (for production):
     * - Store a searchable token ID alongside hash
     * - Use token ID to find record quickly
     * - Then verify hash
     */
    console.log('🔍 Looking for password reset record...');

    const allResets = await this.prisma.passwordReset.findMany({
      include: {
        user: true, // Include user data
      },
    });

    console.log(`📋 Found ${allResets.length} password reset record(s)`);

    /**
     * STEP 2: Find matching token
     *
     * We loop through all reset records and compare tokens
     */
    let matchingReset = null;

    for (const reset of allResets) {
      const isMatch = await bcrypt.compare(token, reset.tokenHash);
      if (isMatch) {
        matchingReset = reset;
        console.log('✅ Found matching reset token for user:', reset.user.email);
        break;
      }
    }

    /**
     * TOKEN NOT FOUND
     */
    if (!matchingReset) {
      console.log('❌ No matching reset token found');
      throw new UnauthorizedException(
        'Invalid or expired reset token. Please request a new password reset.',
      );
    }

    /**
     * STEP 3: Check if token expired
     *
     * Tokens expire after 1 hour for security
     */
    const now = new Date();
    if (now > matchingReset.expiresAt) {
      console.log('❌ Reset token expired at:', matchingReset.expiresAt);
      console.log('❌ Current time:', now);

      /**
       * Clean up expired token
       */
      await this.prisma.passwordReset.delete({
        where: { id: matchingReset.id },
      });

      throw new UnauthorizedException(
        'Reset token has expired. Please request a new password reset.',
      );
    }

    console.log('✅ Token is not expired (expires at:', matchingReset.expiresAt + ')');

    /**
     * STEP 4: Check if token already used
     *
     * Prevents token reuse (one-time use only)
     * If usedAt is not null, the token has been used
     */
    if (matchingReset.usedAt !== null) {
      console.log('❌ Reset token has already been used at:', matchingReset.usedAt);
      throw new BadRequestException(
        'This reset token has already been used. Please request a new password reset.',
      );
    }

    console.log('✅ Token has not been used yet');

    /**
     * STEP 5: Hash new password
     *
     * Same process as signup - never store plain passwords!
     */
    console.log('🔒 Hashing new password...');
    const newPasswordHash = await bcrypt.hash(
      newPassword,
      this.BCRYPT_SALT_ROUNDS,
    );
    console.log('✅ New password hashed successfully');

    /**
     * STEP 6: Update user's password
     *
     * We also:
     * - Reset failed login attempts (account unlocked)
     * - Clear locked until time
     * - Update password last changed timestamp
     */
    console.log('💾 Updating user password...');
    await this.prisma.user.update({
      where: { id: matchingReset.userId },
      data: {
        passwordHash: newPasswordHash,
        failedLoginAttempts: 0, // Reset failed attempts
        lockedUntil: null, // Unlock account
        updatedAt: new Date(),
      },
    });
    console.log('✅ User password updated successfully');

    /**
     * STEP 7: Delete password reset record
     *
     * Why delete?
     * - Token is one-time use only
     * - Prevents reuse of same token
     * - Clean up database
     */
    console.log('🗑️ Deleting used password reset token...');
    await this.prisma.passwordReset.delete({
      where: { id: matchingReset.id },
    });
    console.log('✅ Password reset token deleted');

    /**
     * STEP 8: Return success message
     */
    console.log('🎉 Password reset completed successfully');
    return {
      message:
        'Password has been reset successfully. You can now login with your new password.',
    };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * SUMMARY
 * ═══════════════════════════════════════════════════════════════
 *
 * This service provides:
 *
 * 1. SIGNUP
 *    - Check email doesn't exist
 *    - Hash password with bcrypt
 *    - Create user in database
 *    - Generate JWT tokens
 *
 * 2. LOGIN
 *    - Find user by email
 *    - Check account not locked
 *    - Verify password hash
 *    - Track failed attempts
 *    - Lock account after 5 failed attempts
 *    - Generate JWT tokens
 *
 * 3. REFRESH TOKEN
 *    - Verify refresh token signature
 *    - Check user still exists
 *    - Generate new access token
 *
 * 4. FORGOT PASSWORD
 *    - Generate random reset token
 *    - Hash and store token in database
 *    - Send reset email (logged to console)
 *    - Return vague success message (security)
 *
 * 5. RESET PASSWORD
 *    - Verify reset token (hash comparison)
 *    - Check token not expired (1 hour)
 *    - Check token not used (one-time use)
 *    - Hash new password
 *    - Update user's password
 *    - Delete reset token
 *
 * 6. SECURITY FEATURES
 *    - Password hashing (bcrypt with 10 salt rounds)
 *    - Token hashing (reset tokens stored as hashes)
 *    - Account lockout (15 minutes after 5 failed attempts)
 *    - Vague error messages (prevents email enumeration)
 *    - JWT tokens (access 15 min, refresh 7 days)
 *    - Token expiration (reset tokens expire in 1 hour)
 *    - One-time use tokens (can't reuse reset links)
 *    - No sensitive data in responses
 */
