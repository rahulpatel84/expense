/**
 * login.dto.ts - Data Transfer Object for User Login
 *
 * WHAT IS THIS FILE?
 * Defines the structure and validation rules for login requests
 *
 * DIFFERENCE FROM SIGNUP DTO:
 * - Signup: Creates new user (needs email, password, fullName)
 * - Login: Authenticates existing user (only needs email, password)
 *
 * LOGIN FLOW:
 * 1. Client sends email + password
 * 2. DTO validates format
 * 3. AuthService checks if user exists
 * 4. AuthService verifies password hash matches
 * 5. If correct: Generate JWT tokens
 * 6. If wrong: Return error (don't specify which field is wrong for security)
 *
 * SECURITY NOTE:
 * For login, we DON'T want strict password validation like signup
 * Why? User might have an old account with a weaker password
 * (created before we added strict rules)
 *
 * Example:
 * - User created account in 2020 with password "simple123"
 * - We now require special characters (2024 rule)
 * - If we validate strictly, they can't login!
 * - Solution: Only validate format, not strength (for login)
 */

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * LoginDto Class
 *
 * Simpler than SignupDto because:
 * - We only need to identify the user (email)
 * - We only need to verify their identity (password)
 * - No need for fullName or other details
 */
export class LoginDto {
  /**
   * EMAIL FIELD
   *
   * @IsEmail() - Validates email format
   * @IsNotEmpty() - Cannot be empty
   *
   * Why validate email format?
   * - Prevents obvious typos: "userexample.com" (missing @)
   * - Reduces unnecessary database queries
   * - Provides helpful error message immediately
   *
   * Examples:
   * - ✅ john@example.com
   * - ✅ user.name+tag@company.co.uk
   * - ❌ not-an-email (rejected before hitting database)
   * - ❌ @example.com (rejected before hitting database)
   */
  @IsEmail(
    {},
    {
      message:
        'Please provide a valid email address (e.g., user@example.com)',
    },
  )
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  /**
   * PASSWORD FIELD
   *
   * @IsString() - Must be a string
   * @IsNotEmpty() - Cannot be empty
   *
   * IMPORTANT: Notice we DON'T use @MinLength or @Matches here
   *
   * Why NOT enforce password strength on login?
   *
   * SCENARIO 1: Backwards Compatibility
   * - User signed up 2 years ago with "oldpass123"
   * - We now require special characters
   * - If we enforce on login, they're locked out!
   * - Solution: Only enforce on signup and password change
   *
   * SCENARIO 2: Security Through Obscurity
   * - If we reject "Password must be 8 characters"
   * - Attacker learns: "Aha! Passwords are at least 8 chars"
   * - Better to say: "Invalid credentials" (vague)
   *
   * SCENARIO 3: Brute Force Protection
   * - Password validation happens in AuthService
   * - We can implement rate limiting there
   * - We can track failed attempts in database
   * - We can lock account after 5 failed attempts
   *
   * What we DO validate:
   * - ✅ It's a string (not number, object, etc.)
   * - ✅ It's not empty (at least 1 character)
   * - ✅ It's not just whitespace
   *
   * What we DON'T validate:
   * - ❌ Length (could be old account)
   * - ❌ Character requirements (could be old account)
   * - ❌ Complexity (could be old account)
   *
   * Examples (all accepted by DTO):
   * - ✅ "MySecure123!" (new strong password)
   * - ✅ "oldpass" (old weak password - still valid for login)
   * - ✅ "12345678" (weak but might be legacy account)
   * - ❌ "" (empty - rejected)
   * - ❌ "   " (only whitespace - rejected by @IsNotEmpty)
   */
  @IsString({ message: 'Password must be a text value' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

/**
 * HOW LOGIN VALIDATION WORKS
 *
 * STEP-BY-STEP FLOW:
 *
 * 1. Client sends POST /auth/login request:
 *    {
 *      "email": "john@example.com",
 *      "password": "MySecure123!"
 *    }
 *
 * 2. NestJS ValidationPipe runs class-validator on LoginDto
 *
 * 3. Validators check:
 *    - Is email a valid format? ✅
 *    - Is email not empty? ✅
 *    - Is password a string? ✅
 *    - Is password not empty? ✅
 *
 * 4a. If validation FAILS:
 *     Return 400 Bad Request immediately
 *     {
 *       "statusCode": 400,
 *       "message": ["Please provide a valid email address"],
 *       "error": "Bad Request"
 *     }
 *
 * 4b. If validation PASSES:
 *     Forward to AuthController.login(loginDto)
 *
 * 5. AuthController calls AuthService.login(loginDto)
 *
 * 6. AuthService performs actual authentication:
 *
 *    // Find user by email
 *    const user = await this.prisma.user.findUnique({
 *      where: { email: loginDto.email }
 *    });
 *
 *    // If user doesn't exist
 *    if (!user) {
 *      throw new UnauthorizedException('Invalid credentials');
 *    }
 *
 *    // Compare password with stored hash
 *    const isPasswordValid = await bcrypt.compare(
 *      loginDto.password,
 *      user.passwordHash
 *    );
 *
 *    // If password doesn't match
 *    if (!isPasswordValid) {
 *      throw new UnauthorizedException('Invalid credentials');
 *    }
 *
 *    // Success! Generate JWT tokens
 *    return {
 *      accessToken: '...',
 *      refreshToken: '...',
 *      user: { id: user.id, email: user.email, fullName: user.fullName }
 *    };
 *
 * SECURITY CONSIDERATIONS:
 *
 * 1. VAGUE ERROR MESSAGES
 *    ❌ BAD: "Email not found" or "Wrong password"
 *    ✅ GOOD: "Invalid credentials"
 *
 *    Why?
 *    - Attacker shouldn't know if email exists
 *    - Prevents user enumeration attack
 *    - Attacker can't build list of valid emails
 *
 * 2. ACCOUNT LOCKOUT (implemented in AuthService)
 *    After 5 failed attempts:
 *    - Lock account for 15 minutes
 *    - Prevents brute force attacks
 *    - User gets email: "Account locked, reset password to unlock"
 *
 * 3. RATE LIMITING (implemented at API Gateway level)
 *    - Max 5 login attempts per IP per minute
 *    - Prevents distributed brute force
 *    - Can use @nestjs/throttler package
 *
 * 4. PASSWORD VERIFICATION TIMING
 *    - bcrypt.compare() takes same time regardless of result
 *    - Prevents timing attacks
 *    - Attacker can't guess based on response time
 *
 * WHAT HAPPENS IN THE DATABASE:
 *
 * User table already has these columns (from schema.prisma):
 * - failedLoginAttempts: number of wrong passwords
 * - lastFailedLoginAt: timestamp of last wrong password
 * - lockedUntil: account locked until this time
 * - lastLoginAt: timestamp of last successful login
 *
 * On failed login:
 * await this.prisma.user.update({
 *   where: { email: loginDto.email },
 *   data: {
 *     failedLoginAttempts: { increment: 1 },
 *     lastFailedLoginAt: new Date(),
 *     lockedUntil: failedAttempts >= 5 ? fifteenMinutesFromNow : null
 *   }
 * });
 *
 * On successful login:
 * await this.prisma.user.update({
 *   where: { email: loginDto.email },
 *   data: {
 *     failedLoginAttempts: 0,
 *     lastFailedLoginAt: null,
 *     lockedUntil: null,
 *     lastLoginAt: new Date()
 *   }
 * });
 *
 * USAGE IN CONTROLLER:
 *
 * @Post('login')
 * async login(@Body() loginDto: LoginDto) {
 *   // At this point we know:
 *   // - loginDto.email is valid email format
 *   // - loginDto.password is a non-empty string
 *   // - No extra fields were sent
 *
 *   return this.authService.login(loginDto);
 * }
 *
 * TESTING EXAMPLES:
 *
 * Valid Login Request:
 * curl -X POST http://localhost:3001/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "john@example.com",
 *     "password": "MySecure123!"
 *   }'
 *
 * Expected Response (if credentials correct):
 * {
 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "uuid-here",
 *     "email": "john@example.com",
 *     "fullName": "John Doe"
 *   }
 * }
 *
 * Invalid Email Format:
 * curl -X POST http://localhost:3001/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "not-an-email",
 *     "password": "MySecure123!"
 *   }'
 *
 * Response: 400 Bad Request
 * {
 *   "statusCode": 400,
 *   "message": ["Please provide a valid email address"],
 *   "error": "Bad Request"
 * }
 *
 * Missing Password:
 * curl -X POST http://localhost:3001/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "john@example.com"
 *   }'
 *
 * Response: 400 Bad Request
 * {
 *   "statusCode": 400,
 *   "message": ["Password is required"],
 *   "error": "Bad Request"
 * }
 *
 * Wrong Credentials (after DTO validation passes):
 * curl -X POST http://localhost:3001/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "john@example.com",
 *     "password": "WrongPassword123!"
 *   }'
 *
 * Response: 401 Unauthorized
 * {
 *   "statusCode": 401,
 *   "message": "Invalid credentials",
 *   "error": "Unauthorized"
 * }
 *
 * Notice: Same error whether email is wrong OR password is wrong
 * This is intentional for security!
 *
 * COMPARISON: Login DTO vs Signup DTO
 *
 * ┌─────────────────┬──────────────────┬──────────────────┐
 * │ Field           │ Signup DTO       │ Login DTO        │
 * ├─────────────────┼──────────────────┼──────────────────┤
 * │ email           │ @IsEmail         │ @IsEmail         │
 * │                 │ @IsNotEmpty      │ @IsNotEmpty      │
 * ├─────────────────┼──────────────────┼──────────────────┤
 * │ password        │ @IsNotEmpty      │ @IsString        │
 * │                 │ @MinLength(8)    │ @IsNotEmpty      │
 * │                 │ @Matches(regex)  │                  │
 * ├─────────────────┼──────────────────┼──────────────────┤
 * │ fullName        │ @IsString        │ Not needed       │
 * │                 │ @IsNotEmpty      │                  │
 * └─────────────────┴──────────────────┴──────────────────┘
 *
 * Why different password validation?
 * - Signup: Enforce strong passwords for NEW accounts
 * - Login: Accept any password for EXISTING accounts (including old weak ones)
 */
