/**
 * refresh-token.dto.ts - Data Transfer Object for Token Refresh
 *
 * WHAT IS THIS FILE?
 * Validates the refresh token request from client
 *
 * REFRESH TOKEN FLOW:
 * 1. Access token expires after 15 minutes
 * 2. Client sends refresh token to /auth/refresh
 * 3. Server validates refresh token
 * 4. Server returns new access token
 * 5. Client continues making requests
 *
 * WHY SEPARATE ENDPOINT?
 * - Access tokens are short-lived (15 min) → High security
 * - Refresh tokens are long-lived (7 days) → Convenience
 * - Separating them allows different security measures
 */

import { IsString, IsNotEmpty } from 'class-validator';

/**
 * RefreshTokenDto Class
 *
 * Simple DTO with just one field: refreshToken
 */
export class RefreshTokenDto {
  /**
   * REFRESH TOKEN FIELD
   *
   * @IsString() - Must be a string
   * @IsNotEmpty() - Cannot be empty
   *
   * What this accepts:
   * - ✅ "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (valid JWT)
   * - ❌ "" (empty - rejected)
   * - ❌ null (rejected)
   * - ❌ undefined (rejected)
   *
   * Note: We don't validate the JWT format here
   * Why? JwtService will do that in the service layer
   * This just ensures it's a non-empty string
   */
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}

/**
 * USAGE IN CONTROLLER:
 *
 * @Post('refresh')
 * async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
 *   return this.authService.refreshToken(refreshTokenDto.refreshToken);
 * }
 *
 * CLIENT REQUEST:
 *
 * POST http://localhost:3001/auth/refresh
 * Content-Type: application/json
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 *
 * SUCCESSFUL RESPONSE (200 OK):
 * {
 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 *
 * ERROR RESPONSES:
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
 * COMPLETE FLOW EXAMPLE:
 *
 * Step 1: User logs in
 * POST /auth/login
 * Response:
 * {
 *   "accessToken": "access-token-expires-in-15min",
 *   "refreshToken": "refresh-token-expires-in-7days",
 *   "user": {...}
 * }
 *
 * Step 2: User makes requests (next 15 minutes)
 * GET /user/profile
 * Headers: { Authorization: "Bearer access-token-expires-in-15min" }
 * ✅ Works fine
 *
 * Step 3: Access token expires (after 15 minutes)
 * GET /user/profile
 * Headers: { Authorization: "Bearer expired-access-token" }
 * Response: 401 Unauthorized
 *
 * Step 4: Client refreshes token
 * POST /auth/refresh
 * Body: { "refreshToken": "refresh-token-expires-in-7days" }
 * Response:
 * {
 *   "accessToken": "new-access-token-expires-in-15min"
 * }
 *
 * Step 5: Retry with new token
 * GET /user/profile
 * Headers: { Authorization: "Bearer new-access-token-expires-in-15min" }
 * ✅ Works again!
 *
 * Step 6: Repeat every 15 minutes for 7 days
 * After 7 days: Refresh token expires
 * User must login again
 *
 * SECURITY CONSIDERATIONS:
 *
 * 1. REFRESH TOKEN STORAGE
 *    - ❌ Don't store in localStorage (vulnerable to XSS)
 *    - ✅ Store in httpOnly cookie (best)
 *    - ✅ Store in secure memory (acceptable)
 *
 * 2. REFRESH TOKEN ROTATION
 *    - Basic: Same refresh token for 7 days
 *    - Advanced: New refresh token on each refresh
 *    - Advanced prevents stolen token reuse
 *
 * 3. RATE LIMITING
 *    - Limit refresh requests: 10 per hour per user
 *    - Prevents token refresh spam
 *
 * 4. REVOCATION
 *    - Store refresh tokens in database/Redis
 *    - Can revoke specific tokens
 *    - Useful for "logout from all devices"
 */
