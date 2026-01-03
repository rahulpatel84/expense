/**
 * forgot-password.dto.ts - Forgot Password Request Validation
 *
 * WHAT IS THIS FILE?
 * Validates the email when user requests a password reset.
 *
 * WHAT GETS VALIDATED?
 * - Email is provided
 * - Email is in valid format
 *
 * WHY JUST EMAIL?
 * User forgot password, so we can't ask for password!
 * We only need their email to send reset instructions.
 */

import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * ForgotPasswordDto Class
 *
 * This DTO ensures the client sends a valid email address
 */
export class ForgotPasswordDto {
  /**
   * EMAIL FIELD
   *
   * @IsEmail() - Validates email format (must contain @, valid domain, etc.)
   * @IsNotEmpty() - Cannot be empty string
   *
   * Valid examples:
   * - ✅ "john@example.com"
   * - ✅ "user.name+tag@company.co.uk"
   *
   * Invalid examples:
   * - ❌ "notanemail" (missing @)
   * - ❌ "test@" (missing domain)
   * - ❌ "" (empty)
   * - ❌ null or undefined
   */
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}

/**
 * USAGE IN CONTROLLER:
 *
 * @Post('forgot-password')
 * async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
 *   return this.authService.forgotPassword(forgotPasswordDto.email);
 * }
 *
 * REQUEST EXAMPLE:
 *
 * POST http://localhost:3001/auth/forgot-password
 * Content-Type: application/json
 *
 * {
 *   "email": "john@example.com"
 * }
 *
 * SUCCESSFUL RESPONSE (200 OK):
 * {
 *   "message": "If the email exists, a password reset link has been sent."
 * }
 *
 * NOTE: Same message whether email exists or not (security feature)
 *
 * ERROR RESPONSES:
 *
 * 1. Missing email (400 Bad Request):
 * {
 *   "statusCode": 400,
 *   "message": ["Email is required"],
 *   "error": "Bad Request"
 * }
 *
 * 2. Invalid email format (400 Bad Request):
 * {
 *   "statusCode": 400,
 *   "message": ["Please provide a valid email address"],
 *   "error": "Bad Request"
 * }
 */
