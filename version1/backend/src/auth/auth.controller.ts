/**
 * auth.controller.ts - Authentication HTTP Endpoints
 *
 * WHAT IS A CONTROLLER?
 * Controller handles HTTP requests and returns HTTP responses
 * It's the "receptionist" that talks to clients
 *
 * WHAT THIS FILE DOES:
 * - Exposes authentication endpoints (signup, login)
 * - Validates request data (using DTOs)
 * - Calls AuthService to do business logic
 * - Returns formatted responses
 *
 * ANALOGY:
 * Controller = Restaurant waiter
 * - Takes customer order (HTTP request)
 * - Validates order (DTO validation)
 * - Sends to kitchen (AuthService)
 * - Brings back food (HTTP response)
 *
 * Flow:
 * Client → Controller → Service → Database
 * Client ← Controller ← Service ← Database
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/**
 * @Controller('auth') Decorator
 *
 * Tells NestJS: "This class handles /auth routes"
 *
 * All routes in this controller will start with /auth:
 * - /auth/signup
 * - /auth/login
 * - /auth/logout
 * - etc.
 *
 * Why group by /auth?
 * - Organization: All auth routes in one place
 * - Security: Can apply auth-specific middleware/guards
 * - Clarity: Easy to understand URL structure
 */
@Controller('auth')
export class AuthController {
  /**
   * DEPENDENCY INJECTION
   *
   * Inject AuthService to use its methods
   *
   * constructor(private authService: AuthService) {}
   *
   * What happens:
   * 1. NestJS sees we need AuthService
   * 2. NestJS creates AuthService instance (or reuses existing one)
   * 3. NestJS passes it to this controller
   * 4. We can now use: this.authService.signup(), this.authService.login()
   *
   * Why inject instead of: const service = new AuthService()?
   * - NestJS manages lifecycle (creates once, reuses everywhere)
   * - Easier to test (can inject mock service)
   * - Automatic dependency resolution (AuthService needs PrismaService, etc.)
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * ═══════════════════════════════════════════════════════════════
   * ENDPOINT 1: User Signup
   * ═══════════════════════════════════════════════════════════════
   *
   * @Post('signup') - Handles POST requests to /auth/signup
   * @HttpCode(HttpStatus.CREATED) - Returns 201 Created (not default 200 OK)
   *
   * WHAT THIS ENDPOINT DOES:
   * 1. Receives signup request from client
   * 2. Validates data (automatic via SignupDto)
   * 3. Calls AuthService.signup() to create account
   * 4. Returns JWT tokens and user info
   *
   * HTTP REQUEST:
   * POST /auth/signup
   * Content-Type: application/json
   * {
   *   "email": "john@example.com",
   *   "password": "MySecure123!",
   *   "fullName": "John Doe"
   * }
   *
   * RESPONSE (201 Created):
   * {
   *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "user": {
   *     "id": "uuid-here",
   *     "email": "john@example.com",
   *     "fullName": "John Doe",
   *     "emailVerified": false
   *   }
   * }
   *
   * POSSIBLE ERRORS:
   *
   * 1. Validation Error (400 Bad Request):
   * {
   *   "statusCode": 400,
   *   "message": [
   *     "Please provide a valid email address",
   *     "Password must be at least 8 characters long"
   *   ],
   *   "error": "Bad Request"
   * }
   *
   * 2. Email Already Exists (409 Conflict):
   * {
   *   "statusCode": 409,
   *   "message": "Email already registered. Please login or use a different email.",
   *   "error": "Conflict"
   * }
   *
   * WHAT HAPPENS BEHIND THE SCENES:
   *
   * 1. Client sends POST request
   *
   * 2. NestJS routing finds this controller + method
   *
   * 3. ValidationPipe (configured in main.ts) runs
   *    - Deserializes JSON to SignupDto instance
   *    - Runs all validators (@IsEmail, @MinLength, etc.)
   *    - If fails: Return 400 Bad Request
   *    - If passes: Continue to method
   *
   * 4. Method receives validated signupDto
   *
   * 5. Calls this.authService.signup(signupDto)
   *    - Service checks if email exists
   *    - Service hashes password
   *    - Service creates user in database
   *    - Service generates JWT tokens
   *
   * 6. Service returns result object
   *
   * 7. Controller returns result to client
   *
   * 8. NestJS serializes to JSON and sends HTTP response
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED) // 201 instead of 200
  async signup(@Body() signupDto: SignupDto) {
    /**
     * @Body() Decorator
     *
     * Extracts request body and validates it against SignupDto
     *
     * What happens:
     * 1. Read request body (JSON)
     * 2. Parse JSON to JavaScript object
     * 3. Create SignupDto instance
     * 4. Run class-validator decorators
     * 5. If valid: Pass to method
     * 6. If invalid: Throw ValidationException (400)
     *
     * Example request body:
     * {
     *   "email": "john@example.com",
     *   "password": "MySecure123!",
     *   "fullName": "John Doe"
     * }
     *
     * After validation, signupDto is:
     * SignupDto {
     *   email: "john@example.com",
     *   password: "MySecure123!",
     *   fullName: "John Doe"
     * }
     *
     * All validators have already run:
     * - ✅ Email is valid format
     * - ✅ Password meets strength requirements
     * - ✅ Full name is provided
     * - ✅ No extra fields were sent
     */
    console.log('📝 POST /auth/signup - New signup request');

    /**
     * Call AuthService to handle business logic
     *
     * Why not put logic here?
     * - Controller = HTTP stuff (requests, responses, status codes)
     * - Service = Business logic (reusable, testable)
     *
     * Benefits:
     * - Can use same logic from GraphQL, CLI, background job, etc.
     * - Easier to test (mock service, no need for HTTP)
     * - Cleaner separation of concerns
     */
    const result = await this.authService.signup(signupDto);

    /**
     * Return result
     *
     * NestJS automatically:
     * - Serializes to JSON
     * - Sets Content-Type: application/json header
     * - Sets status code (201 Created from @HttpCode decorator)
     * - Sends HTTP response
     */
    return result;
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * ENDPOINT 2: User Login
   * ═══════════════════════════════════════════════════════════════
   *
   * @Post('login') - Handles POST requests to /auth/login
   * @HttpCode(HttpStatus.OK) - Returns 200 OK (this is default, but explicit)
   *
   * WHAT THIS ENDPOINT DOES:
   * 1. Receives login request from client
   * 2. Validates data (automatic via LoginDto)
   * 3. Calls AuthService.login() to authenticate
   * 4. Returns JWT tokens and user info
   *
   * HTTP REQUEST:
   * POST /auth/login
   * Content-Type: application/json
   * {
   *   "email": "john@example.com",
   *   "password": "MySecure123!"
   * }
   *
   * RESPONSE (200 OK):
   * {
   *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "user": {
   *     "id": "uuid-here",
   *     "email": "john@example.com",
   *     "fullName": "John Doe",
   *     "emailVerified": false
   *   }
   * }
   *
   * POSSIBLE ERRORS:
   *
   * 1. Validation Error (400 Bad Request):
   * {
   *   "statusCode": 400,
   *   "message": ["Please provide a valid email address"],
   *   "error": "Bad Request"
   * }
   *
   * 2. Invalid Credentials (401 Unauthorized):
   * {
   *   "statusCode": 401,
   *   "message": "Invalid credentials",
   *   "error": "Unauthorized"
   * }
   *
   * Note: Same error for wrong email OR wrong password (security!)
   *
   * 3. Account Locked (401 Unauthorized):
   * {
   *   "statusCode": 401,
   *   "message": "Account locked due to too many failed login attempts. Please try again in 14 minutes or reset your password.",
   *   "error": "Unauthorized"
   * }
   *
   * WHY 200 OK FOR LOGIN (not 201 Created)?
   *
   * - Signup creates a resource (new user) → 201 Created
   * - Login doesn't create anything → 200 OK
   * - Login retrieves tokens → 200 OK
   *
   * HTTP status code guidelines:
   * - 200 OK: Success, resource retrieved
   * - 201 Created: Success, resource created
   * - 204 No Content: Success, no response body
   * - 400 Bad Request: Client sent invalid data
   * - 401 Unauthorized: Authentication failed
   * - 403 Forbidden: Authenticated but not allowed
   * - 404 Not Found: Resource doesn't exist
   * - 409 Conflict: Resource already exists
   * - 500 Internal Server Error: Server error
   */
  @Post('login')
  @HttpCode(HttpStatus.OK) // 200 (default, but explicit is better)
  async login(@Body() loginDto: LoginDto) {
    /**
     * @Body() Decorator
     *
     * Same as signup, but validates against LoginDto
     *
     * LoginDto only requires:
     * - email (valid format)
     * - password (non-empty string)
     *
     * No password strength check (user might have old weak password)
     */
    console.log('🔐 POST /auth/login - Login attempt');

    /**
     * Call AuthService to handle authentication
     *
     * Service will:
     * 1. Find user by email
     * 2. Check if account is locked
     * 3. Verify password hash
     * 4. Track failed attempts (if wrong password)
     * 5. Lock account (if too many failures)
     * 6. Generate JWT tokens (if success)
     */
    const result = await this.authService.login(loginDto);

    /**
     * Return result
     *
     * Same structure as signup:
     * - accessToken
     * - refreshToken
     * - user info
     */
    return result;
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * ENDPOINT 3: Refresh Access Token
   * ═══════════════════════════════════════════════════════════════
   *
   * @Post('refresh') - Handles POST requests to /auth/refresh
   * @HttpCode(HttpStatus.OK) - Returns 200 OK
   *
   * WHAT THIS ENDPOINT DOES:
   * 1. Receives refresh token from client
   * 2. Validates refresh token format (via RefreshTokenDto)
   * 3. Calls AuthService.refreshToken() to verify and generate new token
   * 4. Returns new access token
   *
   * HTTP REQUEST:
   * POST /auth/refresh
   * Content-Type: application/json
   * {
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * RESPONSE (200 OK):
   * {
   *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * POSSIBLE ERRORS:
   *
   * 1. Missing refreshToken (400 Bad Request):
   * {
   *   "statusCode": 400,
   *   "message": ["Refresh token is required"],
   *   "error": "Bad Request"
   * }
   *
   * 2. Invalid/Expired refreshToken (401 Unauthorized):
   * {
   *   "statusCode": 401,
   *   "message": "Invalid or expired refresh token. Please login again.",
   *   "error": "Unauthorized"
   * }
   *
   * WHEN TO USE THIS ENDPOINT:
   *
   * Timeline:
   * 1:00 PM - User logs in
   *           → Gets accessToken (expires 1:15 PM)
   *           → Gets refreshToken (expires 7 days later)
   *
   * 1:15 PM - Access token expires
   *           → User tries to fetch data
   *           → Gets 401 Unauthorized
   *           → Client calls /auth/refresh
   *           → Gets new accessToken (expires 1:30 PM)
   *           → Retries original request ✅
   *
   * 1:30 PM - Access token expires again
   *           → Client calls /auth/refresh
   *           → Gets new accessToken (expires 1:45 PM)
   *
   * (Repeat for 7 days)
   *
   * 7 days later - Refresh token expires
   *                → Client calls /auth/refresh
   *                → Gets 401 Unauthorized
   *                → User must login again
   *
   * AUTOMATIC TOKEN REFRESH:
   *
   * React frontend can handle this automatically:
   *
   * const fetchWithAuth = async (url) => {
   *   const token = localStorage.getItem('accessToken');
   *
   *   let response = await fetch(url, {
   *     headers: { Authorization: `Bearer ${token}` }
   *   });
   *
   *   // If token expired
   *   if (response.status === 401) {
   *     // Try to refresh
   *     const refreshToken = localStorage.getItem('refreshToken');
   *     const refreshResponse = await fetch('/auth/refresh', {
   *       method: 'POST',
   *       body: JSON.stringify({ refreshToken })
   *     });
   *
   *     if (refreshResponse.ok) {
   *       const { accessToken } = await refreshResponse.json();
   *       localStorage.setItem('accessToken', accessToken);
   *
   *       // Retry original request with new token
   *       response = await fetch(url, {
   *         headers: { Authorization: `Bearer ${accessToken}` }
   *       });
   *     } else {
   *       // Refresh failed, redirect to login
   *       window.location.href = '/login';
   *     }
   *   }
   *
   *   return response;
   * };
   *
   * SECURITY BENEFITS:
   *
   * 1. SHORT-LIVED ACCESS TOKENS
   *    - If stolen, only works for 15 minutes
   *    - Limited damage window
   *    - Reduces XSS attack impact
   *
   * 2. LONG-LIVED REFRESH TOKENS
   *    - User doesn't have to login every 15 minutes
   *    - Better user experience
   *    - Can be stored more securely (httpOnly cookies)
   *
   * 3. SEPARATE ENDPOINTS
   *    - Can rate-limit refresh endpoint
   *    - Can log refresh attempts
   *    - Can detect suspicious patterns
   *
   * 4. REVOCABLE
   *    - Can invalidate refresh tokens in database
   *    - Useful for "logout from all devices"
   *    - Useful for "I lost my phone"
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    /**
     * @Body() Decorator
     *
     * Validates against RefreshTokenDto:
     * - refreshToken must be a non-empty string
     */
    console.log('🔄 POST /auth/refresh - Refresh token request');

    /**
     * Call AuthService to verify token and generate new access token
     *
     * Service will:
     * 1. Verify refresh token signature
     * 2. Check expiration
     * 3. Verify user still exists
     * 4. Generate new access token
     * 5. Return new token
     */
    const result = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
    );

    /**
     * Return new access token
     *
     * Client should:
     * - Store new accessToken
     * - Use it for subsequent requests
     * - Keep same refreshToken (still valid)
     */
    return result;
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * ENDPOINT 4: Forgot Password
   * ═══════════════════════════════════════════════════════════════
   *
   * @Post('forgot-password') - Handles POST requests to /auth/forgot-password
   * @HttpCode(HttpStatus.OK) - Returns 200 OK
   *
   * WHAT THIS ENDPOINT DOES:
   * 1. Receives email from client
   * 2. Validates email format (automatic via ForgotPasswordDto)
   * 3. Calls AuthService.forgotPassword() to generate reset token
   * 4. Returns success message (same message whether email exists or not)
   *
   * HTTP REQUEST:
   * POST /auth/forgot-password
   * Content-Type: application/json
   * {
   *   "email": "john@example.com"
   * }
   *
   * RESPONSE (200 OK):
   * {
   *   "message": "If the email exists in our system, a password reset link has been sent."
   * }
   *
   * IMPORTANT SECURITY FEATURE:
   * We return the same message whether email exists or not!
   * This prevents attackers from discovering which emails are registered.
   *
   * WHAT HAPPENS BEHIND THE SCENES:
   * 1. If email exists:
   *    - Generate random reset token (64 char hex string)
   *    - Hash token with bcrypt
   *    - Store hashed token in password_resets table
   *    - Log reset link to console (would send email in production)
   *    - Return success message
   *
   * 2. If email doesn't exist:
   *    - Just return success message
   *    - No database operations
   *    - Attacker can't tell the difference!
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    /**
     * @Body() Decorator
     *
     * Validates against ForgotPasswordDto:
     * - email must be a valid email format
     * - email must not be empty
     */
    console.log('📧 POST /auth/forgot-password - Password reset request');
    console.log('📧 Email:', forgotPasswordDto.email);

    /**
     * Call AuthService to handle password reset request
     *
     * Service will:
     * 1. Find user by email (if exists)
     * 2. Generate random reset token
     * 3. Hash token and store in database
     * 4. Log reset link (would send email in production)
     * 5. Return vague success message
     */
    const result = await this.authService.forgotPassword(
      forgotPasswordDto.email,
    );

    /**
     * Return success message
     *
     * IMPORTANT: Same message whether email exists or not!
     * This is a security feature to prevent email enumeration.
     *
     * User will receive:
     * - Email with reset link (if email exists)
     * - Nothing (if email doesn't exist)
     * But response is always the same!
     */
    console.log('✅ Password reset request processed');
    return result;
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * ENDPOINT 5: Reset Password
   * ═══════════════════════════════════════════════════════════════
   *
   * @Post('reset-password') - Handles POST requests to /auth/reset-password
   * @HttpCode(HttpStatus.OK) - Returns 200 OK
   *
   * WHAT THIS ENDPOINT DOES:
   * 1. Receives reset token and new password from client
   * 2. Validates new password strength (automatic via ResetPasswordDto)
   * 3. Calls AuthService.resetPassword() to update password
   * 4. Returns success message
   *
   * HTTP REQUEST:
   * POST /auth/reset-password
   * Content-Type: application/json
   * {
   *   "token": "a3f5b8c2d9e4f1g7h6j5k4l3m2n1o9p8...",
   *   "newPassword": "MyNewSecure456@"
   * }
   *
   * RESPONSE (200 OK):
   * {
   *   "message": "Password has been reset successfully. You can now login with your new password."
   * }
   *
   * ERROR RESPONSES:
   *
   * 1. Invalid token (401 Unauthorized):
   * {
   *   "statusCode": 401,
   *   "message": "Invalid or expired reset token. Please request a new password reset.",
   *   "error": "Unauthorized"
   * }
   *
   * 2. Expired token (401 Unauthorized):
   * {
   *   "statusCode": 401,
   *   "message": "Reset token has expired. Please request a new password reset.",
   *   "error": "Unauthorized"
   * }
   *
   * 3. Token already used (400 Bad Request):
   * {
   *   "statusCode": 400,
   *   "message": "This reset token has already been used. Please request a new password reset.",
   *   "error": "Bad Request"
   * }
   *
   * 4. Weak password (400 Bad Request):
   * {
   *   "statusCode": 400,
   *   "message": [
   *     "New password must be at least 8 characters long",
   *     "New password must contain at least one uppercase letter..."
   *   ],
   *   "error": "Bad Request"
   * }
   *
   * WHAT HAPPENS BEHIND THE SCENES:
   * 1. Hash provided token
   * 2. Find password_reset record by hashed token
   * 3. Verify token not expired (1 hour limit)
   * 4. Verify token not already used
   * 5. Hash new password
   * 6. Update user's password in database
   * 7. Delete password_reset record (one-time use)
   * 8. Reset failed login attempts (unlock account)
   * 9. Return success message
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    /**
     * @Body() Decorator
     *
     * Validates against ResetPasswordDto:
     * - token must be a non-empty string
     * - newPassword must be at least 8 characters
     * - newPassword must contain uppercase, lowercase, number, special char
     */
    console.log('🔑 POST /auth/reset-password - Password reset attempt');
    console.log('🔑 Token (first 10 chars):', resetPasswordDto.token.substring(0, 10) + '...');

    /**
     * Call AuthService to reset password
     *
     * Service will:
     * 1. Find password reset record by token hash
     * 2. Verify token is valid and not expired
     * 3. Hash new password
     * 4. Update user's password
     * 5. Delete reset token (one-time use)
     * 6. Return success message
     */
    const result = await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );

    /**
     * Return success message
     *
     * User can now login with new password!
     */
    console.log('✅ Password reset successful');
    return result;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HOW TO USE THESE ENDPOINTS
 * ═══════════════════════════════════════════════════════════════
 *
 * TESTING WITH CURL:
 *
 * 1. Signup:
 * curl -X POST http://localhost:3001/auth/signup \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "john@example.com",
 *     "password": "MySecure123!",
 *     "fullName": "John Doe"
 *   }'
 *
 * 2. Login:
 * curl -X POST http://localhost:3001/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "john@example.com",
 *     "password": "MySecure123!"
 *   }'
 *
 * TESTING WITH FRONTEND (React):
 *
 * // Signup
 * const signup = async (email, password, fullName) => {
 *   const response = await fetch('http://localhost:3001/auth/signup', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify({ email, password, fullName }),
 *   });
 *
 *   if (!response.ok) {
 *     const error = await response.json();
 *     throw new Error(error.message);
 *   }
 *
 *   const data = await response.json();
 *   // Store tokens
 *   localStorage.setItem('accessToken', data.accessToken);
 *   localStorage.setItem('refreshToken', data.refreshToken);
 *   return data.user;
 * };
 *
 * // Login
 * const login = async (email, password) => {
 *   const response = await fetch('http://localhost:3001/auth/login', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify({ email, password }),
 *   });
 *
 *   if (!response.ok) {
 *     const error = await response.json();
 *     throw new Error(error.message);
 *   }
 *
 *   const data = await response.json();
 *   // Store tokens
 *   localStorage.setItem('accessToken', data.accessToken);
 *   localStorage.setItem('refreshToken', data.refreshToken);
 *   return data.user;
 * };
 *
 * USING TOKENS FOR AUTHENTICATED REQUESTS:
 *
 * // Frontend: Send access token in header
 * const getProfile = async () => {
 *   const accessToken = localStorage.getItem('accessToken');
 *
 *   const response = await fetch('http://localhost:3001/user/profile', {
 *     headers: {
 *       'Authorization': `Bearer ${accessToken}`,
 *     },
 *   });
 *
 *   return await response.json();
 * };
 *
 * // Backend: Extract and verify token (using JWT strategy)
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)  // Verifies token automatically
 * getProfile(@Req() req) {
 *   // req.user contains decoded token payload
 *   return req.user;
 * }
 *
 * TOKEN REFRESH FLOW:
 *
 * 1. Access token expires after 15 minutes
 * 2. Client gets 401 Unauthorized on API request
 * 3. Client sends refresh token to /auth/refresh
 * 4. Server generates new access token
 * 5. Client retries original request with new token
 *
 * // Refresh endpoint (we'll add this later)
 * @Post('refresh')
 * async refresh(@Body() body: { refreshToken: string }) {
 *   // Verify refresh token
 *   // Generate new access token
 *   // Return new tokens
 * }
 *
 * ═══════════════════════════════════════════════════════════════
 * SECURITY CONSIDERATIONS
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. RATE LIMITING (not implemented yet)
 *    - Limit signup: 5 per hour per IP
 *    - Limit login: 10 per minute per IP
 *    - Prevents brute force and spam
 *
 * 2. CORS (already configured in main.ts)
 *    - Only allow requests from http://localhost:5173 (our frontend)
 *    - Prevents malicious websites from calling our API
 *
 * 3. HTTPS IN PRODUCTION
 *    - All requests must use HTTPS (encrypted)
 *    - Prevents man-in-the-middle attacks
 *    - Deployment platforms (Railway, Vercel) provide this
 *
 * 4. TOKEN STORAGE
 *    - Access token: Memory or secure storage (not localStorage!)
 *    - Refresh token: HttpOnly cookie (XSS-proof)
 *    - Never store tokens in URL or sessionStorage
 *
 * 5. INPUT SANITIZATION
 *    - DTOs validate format
 *    - Prisma prevents SQL injection
 *    - Still sanitize before displaying (XSS prevention)
 *
 * NEXT STEPS:
 * - Create auth.module.ts (wire controller + service together)
 * - Add JWT strategy (verify tokens on protected routes)
 * - Test signup and login endpoints
 */
