/**
 * signup.dto.ts - Data Transfer Object for User Signup
 *
 * WHAT IS A DTO?
 * DTO = Data Transfer Object
 * It's a class that defines the shape of data coming from the client
 *
 * ANALOGY:
 * Think of it like a form with validation rules:
 * - Client fills out signup form
 * - DTO checks: "Is email valid? Is password strong enough?"
 * - Only valid data reaches our business logic
 *
 * WHY USE DTOs?
 * 1. INPUT VALIDATION: Ensure data is correct before processing
 * 2. TYPE SAFETY: TypeScript knows exact structure
 * 3. AUTO-DOCUMENTATION: Other developers see what data is needed
 * 4. SECURITY: Prevent malicious or malformed data
 *
 * REAL WORLD EXAMPLE:
 * Client sends:
 * {
 *   "email": "john@example.com",
 *   "password": "MySecurePass123!",
 *   "fullName": "John Doe"
 * }
 *
 * DTO validates:
 * - ✅ Email format is correct
 * - ✅ Password is strong enough (8+ chars, has uppercase, lowercase, number, special char)
 * - ✅ Full name is provided and not empty
 *
 * If validation fails:
 * - ❌ Returns 400 Bad Request with error details
 * - ❌ Business logic never runs (saves processing)
 *
 * If validation passes:
 * - ✅ Data forwarded to AuthService.signup()
 */

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

/**
 * SignupDto Class
 *
 * Defines what data is required for signup and validation rules
 *
 * Class-validator decorators (@IsEmail, @MinLength, etc.) automatically validate
 * We don't write validation code - decorators do it for us!
 */
export class SignupDto {
  /**
   * EMAIL FIELD
   *
   * @IsEmail() - Validates email format
   *
   * What it checks:
   * - ✅ john@example.com (valid)
   * - ✅ user.name+tag@company.co.uk (valid)
   * - ❌ not-an-email (invalid - no @)
   * - ❌ missing@domain (invalid - no TLD)
   * - ❌ @example.com (invalid - no local part)
   *
   * Options (optional, but useful):
   * - { message: '...' } - Custom error message
   * - { require_tld: true } - Require top-level domain (.com, .org)
   * - { allow_display_name: false } - Disallow "Name <email@example.com>"
   */
  @IsEmail(
    {},
    {
      message:
        'Please provide a valid email address (e.g., user@example.com)',
    },
  )
  email!: string;

  /**
   * PASSWORD FIELD
   *
   * Multiple validators stacked on top of each other:
   * 1. @IsNotEmpty() - Cannot be empty string
   * 2. @MinLength(8) - Must be at least 8 characters
   * 3. @Matches(regex) - Must match password strength rules
   *
   * Password Requirements (enforced by regex):
   * - At least 8 characters long
   * - At least one uppercase letter (A-Z)
   * - At least one lowercase letter (a-z)
   * - At least one number (0-9)
   * - At least one special character (!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?)
   *
   * Examples:
   * - ✅ MyPass123! (has all requirements)
   * - ✅ SecureP@ssw0rd (has all requirements)
   * - ❌ password (no uppercase, number, or special char)
   * - ❌ PASSWORD (no lowercase, number, or special char)
   * - ❌ Pass123 (no special char, too short)
   * - ❌ MyPass! (no number)
   *
   * REGEX EXPLANATION:
   * ^                           - Start of string
   * (?=.*[a-z])                 - Must contain at least one lowercase letter
   * (?=.*[A-Z])                 - Must contain at least one uppercase letter
   * (?=.*\d)                    - Must contain at least one digit
   * (?=.*[@$!%*?&])             - Must contain at least one special character
   * [A-Za-z\d@$!%*?&]{8,}       - Allow these characters, minimum 8 length
   * $                           - End of string
   *
   * Why so strict?
   * - Prevents weak passwords like "password123"
   * - Reduces risk of brute force attacks
   * - Industry standard security practice
   */
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
  })
  password!: string;

  /**
   * FULL NAME FIELD
   *
   * @IsString() - Must be a string type
   * @IsNotEmpty() - Cannot be empty or just whitespace
   *
   * What it accepts:
   * - ✅ "John Doe"
   * - ✅ "María García"
   * - ✅ "李明" (Chinese characters)
   * - ❌ "" (empty string)
   * - ❌ "   " (only whitespace)
   *
   * Why we need full name:
   * - Personalization: "Welcome back, John!"
   * - Display in UI: Show user's name in dashboard
   * - Audit logs: Track who did what
   * - Communication: "Hi John, here's your expense report..."
   *
   * Note: We use "fullName" not "firstName" and "lastName"
   * Why? Not all cultures use two-part names
   * - Some have one name
   * - Some have three or more parts
   * - Full name is more inclusive
   */
  @IsString({ message: 'Full name must be a text value' })
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;
}

/**
 * HOW VALIDATION WORKS (Behind the Scenes)
 *
 * 1. Client sends POST request to /auth/signup with JSON body
 *
 * 2. NestJS receives request and deserializes JSON to SignupDto instance
 *
 * 3. ValidationPipe (configured in main.ts) runs class-validator
 *
 * 4. class-validator checks each decorator:
 *    - Runs @IsEmail() validator on email
 *    - Runs @IsNotEmpty() validator on password
 *    - Runs @MinLength(8) validator on password
 *    - Runs @Matches() validator on password
 *    - Runs @IsString() validator on fullName
 *    - Runs @IsNotEmpty() validator on fullName
 *
 * 5a. If ANY validator fails:
 *     - ❌ Returns 400 Bad Request
 *     - ❌ Response body contains error details:
 *       {
 *         "statusCode": 400,
 *         "message": [
 *           "Please provide a valid email address",
 *           "Password must be at least 8 characters long"
 *         ],
 *         "error": "Bad Request"
 *       }
 *     - ❌ Controller method NEVER runs
 *
 * 5b. If ALL validators pass:
 *     - ✅ Data is clean and safe
 *     - ✅ Controller method receives validated SignupDto
 *     - ✅ We can trust the data (no need to re-validate)
 *
 * VALIDATION PIPE CONFIGURATION (in main.ts)
 *
 * app.useGlobalPipes(new ValidationPipe({
 *   whitelist: true,           // Remove properties not in DTO
 *   forbidNonWhitelisted: true, // Throw error if extra properties sent
 *   transform: true,            // Transform plain object to DTO instance
 * }));
 *
 * - whitelist: If client sends extra fields (e.g., "isAdmin": true),
 *              those fields are automatically removed
 *
 * - forbidNonWhitelisted: Instead of silently removing, throw error
 *                         This alerts client they're sending wrong data
 *
 * - transform: Convert plain JavaScript object to SignupDto class instance
 *              This allows decorators to work properly
 *
 * SECURITY BENEFITS:
 *
 * 1. PREVENTS MASS ASSIGNMENT ATTACKS
 *    Client tries to send:
 *    {
 *      "email": "hacker@evil.com",
 *      "password": "Pass123!",
 *      "fullName": "Hacker",
 *      "isAdmin": true,        // Trying to make themselves admin!
 *      "emailVerified": true   // Trying to bypass email verification!
 *    }
 *
 *    DTO only accepts: email, password, fullName
 *    Result: "isAdmin" and "emailVerified" are rejected
 *
 * 2. PREVENTS SQL INJECTION (when used with Prisma)
 *    Even if someone sends: email: "'; DROP TABLE users; --"
 *    Prisma uses parameterized queries, so this becomes harmless string
 *
 * 3. PREVENTS XSS (Cross-Site Scripting)
 *    If someone sends: fullName: "<script>alert('hacked')</script>"
 *    We can sanitize this in the service layer
 *    DTO ensures it's at least a string type
 *
 * 4. REDUCES SERVER LOAD
 *    Invalid requests rejected immediately
 *    No database queries for malformed data
 *    No wasted processing
 *
 * USAGE IN CONTROLLER:
 *
 * @Post('signup')
 * async signup(@Body() signupDto: SignupDto) {
 *   // At this point, we know for certain:
 *   // - signupDto.email is a valid email format
 *   // - signupDto.password is strong enough
 *   // - signupDto.fullName is provided
 *   // - No extra fields were sent
 *
 *   return this.authService.signup(signupDto);
 * }
 *
 * TESTING EXAMPLES:
 *
 * Valid Request:
 * curl -X POST http://localhost:3001/auth/signup \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "john@example.com",
 *     "password": "MySecure123!",
 *     "fullName": "John Doe"
 *   }'
 *
 * Response: 201 Created (signup succeeds)
 *
 * Invalid Request (weak password):
 * curl -X POST http://localhost:3001/auth/signup \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "john@example.com",
 *     "password": "weak",
 *     "fullName": "John Doe"
 *   }'
 *
 * Response: 400 Bad Request
 * {
 *   "statusCode": 400,
 *   "message": [
 *     "Password must be at least 8 characters long",
 *     "Password must contain at least one uppercase letter, ..."
 *   ],
 *   "error": "Bad Request"
 * }
 *
 * Invalid Request (invalid email):
 * curl -X POST http://localhost:3001/auth/signup \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "not-an-email",
 *     "password": "MySecure123!",
 *     "fullName": "John Doe"
 *   }'
 *
 * Response: 400 Bad Request
 * {
 *   "statusCode": 400,
 *   "message": ["Please provide a valid email address"],
 *   "error": "Bad Request"
 * }
 */
