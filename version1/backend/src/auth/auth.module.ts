/**
 * auth.module.ts - Authentication Module Configuration
 *
 * WHAT IS A MODULE?
 * A module is like a folder that groups related code together
 * It tells NestJS: "These controllers, services, and dependencies work together"
 *
 * ANALOGY:
 * Think of modules like departments in a company:
 * - HR Department (AuthModule): Handles employees (users)
 * - Finance Department (ExpenseModule): Handles money
 * - IT Department (PrismaModule): Manages infrastructure (database)
 *
 * Each department has:
 * - Workers (services) - Do the actual work
 * - Reception desk (controllers) - Handle requests
 * - Tools (imports) - Things they need from other departments
 *
 * WHAT THIS MODULE DOES:
 * - Registers AuthController (HTTP endpoints)
 * - Registers AuthService (business logic)
 * - Imports JwtModule (for token generation/verification)
 * - Imports ConfigModule (for environment variables)
 * - Makes everything work together
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * @Module() Decorator
 *
 * Configures this module with:
 * - imports: Other modules we need
 * - controllers: HTTP route handlers
 * - providers: Services and dependencies
 * - exports: What we share with other modules
 */
@Module({
  /**
   * ═══════════════════════════════════════════════════════════════
   * IMPORTS: Modules this module depends on
   * ═══════════════════════════════════════════════════════════════
   */
  imports: [
    /**
     * ConfigModule
     *
     * Provides access to environment variables (.env file)
     *
     * Why we need it:
     * - JWT_SECRET (for signing tokens)
     * - JWT_EXPIRES_IN (token expiration time)
     * - DATABASE_URL (already used by Prisma)
     *
     * Without ConfigModule:
     * ❌ process.env.JWT_SECRET might be undefined
     * ❌ No type safety
     * ❌ Hard to test (can't mock environment)
     *
     * With ConfigModule:
     * ✅ Type-safe configuration
     * ✅ Validation of required variables
     * ✅ Easy to override in tests
     */
    ConfigModule.forRoot({
      /**
       * isGlobal: true
       *
       * Makes ConfigService available everywhere
       * Without this, we'd have to import ConfigModule in every module
       *
       * With isGlobal:
       * - Import ConfigModule once here
       * - Use ConfigService anywhere
       */
      isGlobal: true,

      /**
       * envFilePath: '.env'
       *
       * Where to find environment variables
       * Default is .env in project root
       *
       * For multiple environments:
       * envFilePath: ['.env.local', '.env']
       * (Tries .env.local first, falls back to .env)
       */
      envFilePath: '.env',
    }),

    /**
     * JwtModule
     *
     * Provides JwtService for creating and verifying tokens
     *
     * SYNCHRONOUS CONFIGURATION (simple):
     * JwtModule.register({
     *   secret: 'hardcoded-secret',
     *   signOptions: { expiresIn: '15m' }
     * })
     *
     * ASYNCHRONOUS CONFIGURATION (we use this):
     * Why async?
     * - We need to read JWT_SECRET from environment variables
     * - ConfigService is only available after module initialization
     * - Must wait for ConfigService to be ready
     *
     * registerAsync() allows us to:
     * 1. Wait for ConfigService to be ready
     * 2. Read JWT_SECRET from .env
     * 3. Configure JwtModule with that secret
     */
    JwtModule.registerAsync({
      /**
       * imports: [ConfigModule]
       *
       * Even though ConfigModule is global, we explicitly import it here
       * This makes it clear that we depend on ConfigService
       */
      imports: [ConfigModule],

      /**
       * useFactory: Function that returns configuration
       *
       * This function runs when module initializes
       * It receives injected dependencies (ConfigService)
       * Returns configuration object for JwtModule
       *
       * Why "factory"?
       * - Factory pattern: Creates objects dynamically
       * - Configuration is created at runtime (not compile time)
       * - Can use dynamic values (environment variables)
       *
       * How it works:
       * 1. NestJS initializes ConfigModule
       * 2. NestJS calls this useFactory function
       * 3. NestJS injects ConfigService as parameter
       * 4. Function reads JWT_SECRET from .env
       * 5. Function returns configuration object
       * 6. JwtModule uses this configuration
       */
      useFactory: async (configService: ConfigService) => {
        /**
         * READ JWT_SECRET FROM ENVIRONMENT
         *
         * configService.get<string>('JWT_SECRET')
         *
         * What this does:
         * 1. Reads JWT_SECRET from .env file
         * 2. Returns value as string
         * 3. If not found, returns undefined
         *
         * Example .env:
         * JWT_SECRET=my-super-secret-key-change-in-production
         * JWT_EXPIRES_IN=15m
         *
         * Security:
         * - ❌ NEVER hardcode secrets in code
         * - ❌ NEVER commit .env to git
         * - ✅ Use environment variables
         * - ✅ Different secret for dev/staging/production
         *
         * For development:
         * JWT_SECRET=dev-secret-key-not-for-production
         *
         * For production:
         * JWT_SECRET=<generated-cryptographically-secure-random-string>
         *
         * How to generate secure secret:
         * node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
         *
         * Output example:
         * a7f3d8b2c1e9f6a4d2b8c5e7f1a3d9b6c4e8f2a7d5b9c3e6f8a1d4b7c2e5f9a3
         */
        const jwtSecret = configService.get<string>('JWT_SECRET');

        /**
         * VALIDATE JWT_SECRET EXISTS
         *
         * Why check?
         * - If JWT_SECRET is missing, app can't sign tokens
         * - Better to crash immediately than run with broken auth
         * - Clear error message helps debugging
         */
        if (!jwtSecret) {
          throw new Error(
            'JWT_SECRET is not defined in environment variables. ' +
              'Please add JWT_SECRET to your .env file.\n' +
              'Example: JWT_SECRET=your-secret-key-here',
          );
        }

        console.log('🔐 JWT Module configured with secret from .env');

        /**
         * RETURN CONFIGURATION
         *
         * This object configures JwtModule
         */
        return {
          /**
           * secret: The key used to sign tokens
           *
           * What is token signing?
           * 1. Create payload: { userId: "123", email: "john@example.com" }
           * 2. Create signature: HMAC-SHA256(payload, secret)
           * 3. Combine: header.payload.signature
           *
           * When verifying:
           * 1. Split token into header.payload.signature
           * 2. Recompute signature: HMAC-SHA256(payload, secret)
           * 3. Compare signatures
           * 4. If match: Token is valid ✅
           * 5. If different: Token was tampered with ❌
           *
           * Security:
           * - Only server knows the secret
           * - Client can read token but can't modify it
           * - Any modification changes signature
           * - Server detects tampering
           */
          secret: jwtSecret,

          /**
           * signOptions: Default options when signing tokens
           *
           * expiresIn: How long until token expires
           *
           * Note: This is DEFAULT expiration
           * We override this in AuthService:
           * - Access token: 15m (short-lived)
           * - Refresh token: 7d (long-lived)
           *
           * But having a default is good practice:
           * - Prevents accidental long-lived tokens
           * - Ensures all tokens eventually expire
           *
           * Time formats:
           * - '60' = 60 seconds
           * - '2m' = 2 minutes
           * - '15m' = 15 minutes
           * - '2h' = 2 hours
           * - '1d' = 1 day
           * - '7d' = 7 days
           */
          signOptions: {
            expiresIn: '15m', // Default: 15 minutes
          },
        };
      },

      /**
       * inject: Dependencies to inject into useFactory
       *
       * NestJS will:
       * 1. Create ConfigService instance
       * 2. Pass it to useFactory as parameter
       *
       * We can inject multiple dependencies:
       * inject: [ConfigService, DatabaseService, LoggerService]
       *
       * Then useFactory receives:
       * useFactory: (config, db, logger) => { ... }
       */
      inject: [ConfigService],
    }),
  ],

  /**
   * ═══════════════════════════════════════════════════════════════
   * CONTROLLERS: HTTP route handlers
   * ═══════════════════════════════════════════════════════════════
   *
   * What happens:
   * 1. NestJS creates AuthController instance
   * 2. NestJS registers all routes (@Post, @Get, etc.)
   * 3. When request comes in, NestJS calls appropriate method
   *
   * Our routes:
   * - POST /auth/signup → AuthController.signup()
   * - POST /auth/login → AuthController.login()
   */
  controllers: [AuthController],

  /**
   * ═══════════════════════════════════════════════════════════════
   * PROVIDERS: Services and dependencies
   * ═══════════════════════════════════════════════════════════════
   *
   * What are providers?
   * - Classes that can be injected into other classes
   * - Usually services (business logic)
   * - Also: repositories, factories, helpers, etc.
   *
   * What happens:
   * 1. NestJS creates AuthService instance
   * 2. NestJS injects PrismaService and JwtService into it
   * 3. AuthService is now available for injection
   * 4. AuthController can inject AuthService
   *
   * Dependency graph:
   * AuthController
   *   └─ AuthService
   *       ├─ PrismaService (from PrismaModule)
   *       └─ JwtService (from JwtModule)
   *
   * NestJS automatically resolves this graph!
   */
  providers: [AuthService],

  /**
   * ═══════════════════════════════════════════════════════════════
   * EXPORTS: What this module shares with other modules
   * ═══════════════════════════════════════════════════════════════
   *
   * We export AuthService so other modules can use it
   *
   * Example: ExpenseModule might need to verify user is logged in
   *
   * Without export:
   * ❌ ExpenseModule can't access AuthService
   *
   * With export:
   * ✅ Other modules can import AuthModule
   * ✅ Other modules can inject AuthService
   *
   * Usage in another module:
   * @Module({
   *   imports: [AuthModule],
   *   ...
   * })
   * export class ExpenseModule {}
   *
   * Then in ExpenseService:
   * constructor(private authService: AuthService) {}
   */
  exports: [AuthService],
})
export class AuthModule {
  /**
   * Module class is usually empty
   * All configuration is in @Module() decorator
   *
   * Sometimes you might add:
   * - constructor() for initialization logic
   * - onModuleInit() for startup tasks
   * - onModuleDestroy() for cleanup tasks
   *
   * But for most cases, empty class is fine
   */
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HOW MODULES WORK TOGETHER
 * ═══════════════════════════════════════════════════════════════
 *
 * AppModule (root)
 * ├── imports: [
 * │   ├── PrismaModule (database)
 * │   │   └── provides: PrismaService
 * │   │
 * │   └── AuthModule (authentication)
 * │       ├── imports: [
 * │       │   ├── ConfigModule (environment variables)
 * │       │   └── JwtModule (token generation)
 * │       │]
 * │       ├── controllers: [AuthController]
 * │       ├── providers: [AuthService]
 * │       └── exports: [AuthService]
 * │]
 *
 * Dependency injection flow:
 * 1. AppModule starts
 * 2. PrismaModule initializes
 *    - Creates PrismaService
 *    - Connects to database
 * 3. AuthModule initializes
 *    - ConfigModule loads .env
 *    - JwtModule configures with JWT_SECRET
 *    - Creates AuthService (injects PrismaService, JwtService)
 *    - Creates AuthController (injects AuthService)
 * 4. App ready to handle requests!
 *
 * Request flow:
 * Client
 *   → POST /auth/signup
 *   → NestJS routing
 *   → AuthController.signup()
 *   → @Body() validates SignupDto
 *   → AuthService.signup()
 *   → PrismaService.user.create()
 *   → PostgreSQL database
 *   → Returns user
 *   → JwtService.signAsync()
 *   → Returns tokens
 *   → Controller returns to client
 *   ← Response with tokens
 * Client
 *
 * ═══════════════════════════════════════════════════════════════
 * ENVIRONMENT VARIABLES NEEDED
 * ═══════════════════════════════════════════════════════════════
 *
 * Add to .env file:
 *
 * # Database (already exists)
 * DATABASE_URL="postgresql://rahul@localhost:5432/expense_tracker_v1"
 *
 * # Server (already exists)
 * PORT=3001
 *
 * # JWT Configuration (ADD THESE)
 * JWT_SECRET=your-secret-key-here-change-in-production
 * JWT_EXPIRES_IN=15m
 *
 * For development, you can use any string for JWT_SECRET
 * For production, generate a secure random string:
 *
 * node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
 *
 * NEXT STEPS:
 * 1. Add JWT_SECRET to .env file
 * 2. Import AuthModule in AppModule
 * 3. Test signup endpoint
 * 4. Test login endpoint
 */
