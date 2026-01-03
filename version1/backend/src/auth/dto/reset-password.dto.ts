/**
 * reset-password.dto.ts - Reset Password Request Validation
 *
 * WHAT IS THIS FILE?
 * Validates the token and new password when user resets their password.
 *
 * WHAT GETS VALIDATED?
 * - Token is provided (from email link)
 * - New password is provided
 * - New password meets strength requirements
 *
 * WHY TOKEN + PASSWORD?
 * - Token proves user has access to their email
 * - New password is what they want to change to
 */

import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

/**
 * ResetPasswordDto Class
 *
 * This DTO validates both the reset token and the new password
 */
export class ResetPasswordDto {
  /**
   * TOKEN FIELD
   *
   * The token from the reset link in the email.
   * Example URL: https://yourapp.com/reset-password?token=abc123def456
   *
   * @IsString() - Must be a string
   * @IsNotEmpty() - Cannot be empty
   *
   * Note: We don't validate the token format here.
   * The actual validation (signature, expiration) happens in the service layer.
   */
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Reset token is required' })
  token!: string;

  /**
   * NEW PASSWORD FIELD
   *
   * The new password the user wants to set.
   *
   * Password Requirements (same as signup):
   * - At least 8 characters
   * - At least one lowercase letter (a-z)
   * - At least one uppercase letter (A-Z)
   * - At least one number (0-9)
   * - At least one special character (@$!%*?&)
   *
   * @IsString() - Must be a string
   * @IsNotEmpty() - Cannot be empty
   * @MinLength(8) - At least 8 characters
   * @Matches() - Custom regex for password strength
   *
   * Valid examples:
   * - ✅ "MySecure123@"
   * - ✅ "P@ssw0rd!"
   * - ✅ "Abcd1234$"
   *
   * Invalid examples:
   * - ❌ "password" (no uppercase, no number, no special char)
   * - ❌ "PASSWORD123" (no lowercase, no special char)
   * - ❌ "Pass@" (too short, no number)
   * - ❌ "Pass1234" (no special char)
   */
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
  })
  newPassword!: string;
}

/**
 * REGEX EXPLANATION:
 *
 * /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
 *
 * ^ - Start of string
 * (?=.*[a-z]) - Lookahead: Must contain at least one lowercase letter
 * (?=.*[A-Z]) - Lookahead: Must contain at least one uppercase letter
 * (?=.*\d) - Lookahead: Must contain at least one digit
 * (?=.*[@$!%*?&]) - Lookahead: Must contain at least one special character
 * [A-Za-z\d@$!%*?&]+ - One or more valid characters
 * $ - End of string
 *
 * Lookaheads don't consume characters, they just check if pattern exists.
 * This ensures all requirements are met.
 */

/**
 * USAGE IN CONTROLLER:
 *
 * @Post('reset-password')
 * async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
 *   return this.authService.resetPassword(
 *     resetPasswordDto.token,
 *     resetPasswordDto.newPassword
 *   );
 * }
 *
 * REQUEST EXAMPLE:
 *
 * POST http://localhost:3001/auth/reset-password
 * Content-Type: application/json
 *
 * {
 *   "token": "abc123def456ghi789",
 *   "newPassword": "MyNewSecure123@"
 * }
 *
 * SUCCESSFUL RESPONSE (200 OK):
 * {
 *   "message": "Password has been reset successfully. You can now login with your new password."
 * }
 *
 * ERROR RESPONSES:
 *
 * 1. Missing fields (400 Bad Request):
 * {
 *   "statusCode": 400,
 *   "message": [
 *     "Reset token is required",
 *     "New password is required"
 *   ],
 *   "error": "Bad Request"
 * }
 *
 * 2. Weak password (400 Bad Request):
 * {
 *   "statusCode": 400,
 *   "message": [
 *     "New password must be at least 8 characters long",
 *     "New password must contain at least one uppercase letter..."
 *   ],
 *   "error": "Bad Request"
 * }
 *
 * 3. Invalid/Expired token (401 Unauthorized):
 * {
 *   "statusCode": 401,
 *   "message": "Invalid or expired reset token",
 *   "error": "Unauthorized"
 * }
 */
