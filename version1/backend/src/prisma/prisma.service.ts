/**
 * prisma.service.ts - Database Connection Service
 *
 * WHAT IS THIS FILE?
 * This service creates and manages our connection to PostgreSQL database
 *
 * ANALOGY:
 * Think of this like a phone connection:
 * - PrismaClient = Your phone
 * - $connect() = Dialing the database server
 * - $disconnect() = Hanging up
 * - This service = Keeping the connection open while app runs
 *
 * WHY A SERVICE?
 * Instead of creating new database connection everywhere:
 *   ❌ const prisma = new PrismaClient() // In every file (wasteful!)
 *
 * We create ONE connection and reuse it:
 *   ✅ constructor(private prisma: PrismaService) // Inject everywhere
 *
 * This is called DEPENDENCY INJECTION and SINGLETON pattern
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * @Injectable() Decorator
 *
 * Tells NestJS: "This class can be injected into other classes"
 *
 * What does "inject" mean?
 * When you write:
 *   constructor(private prisma: PrismaService) { }
 *
 * NestJS automatically:
 * 1. Creates PrismaService instance (only once!)
 * 2. Passes it to your constructor
 * 3. You can now use it: this.prisma.user.create()
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * CONSTRUCTOR
   *
   * Prisma 7 requires us to use an adapter for database connections
   * We create a connection pool and pass it to Prisma
   */
  constructor() {
    /**
     * Step 1: Create PostgreSQL connection pool
     *
     * Pool = Multiple reusable database connections
     * Why? More efficient than creating new connection each time
     *
     * connectionString: Reads from DATABASE_URL in .env
     */
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    /**
     * Step 2: Create Prisma adapter using the pool
     *
     * Adapter = Bridge between Prisma and PostgreSQL
     */
    const adapter = new PrismaPg(pool);

    /**
     * Step 3: Pass adapter to PrismaClient
     *
     * super() = Call parent class (PrismaClient) constructor
     */
    super({
      adapter,
      /**
       * log: What events to log
       *
       * Options:
       * - 'query': Log all SQL queries (useful for debugging)
       * - 'info': General information
       * - 'warn': Warnings
       * - 'error': Errors
       *
       * For development, we enable all logs to learn what's happening
       */
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  /**
   * INHERITANCE EXPLANATION
   *
   * "extends PrismaClient"
   * = PrismaService IS A PrismaClient (inherits all methods)
   *
   * Now we can use:
   * - this.user.create()
   * - this.user.findUnique()
   * - this.$connect()
   * - etc.
   *
   * All PrismaClient methods are available!
   */

  /**
   * INTERFACES EXPLANATION
   *
   * "implements OnModuleInit, OnModuleDestroy"
   * = This class MUST have these methods:
   *   - onModuleInit() - Called when module starts
   *   - onModuleDestroy() - Called when module stops
   *
   * NestJS automatically calls these at the right time
   */

  /**
   * onModuleInit() - Called when NestJS starts
   *
   * WHEN: As soon as the application boots up
   * PURPOSE: Connect to database before handling any requests
   *
   * Flow:
   * 1. User runs: npm run start:dev
   * 2. NestJS starts
   * 3. Creates PrismaService instance
   * 4. Calls onModuleInit()
   * 5. Connection established ✅
   * 6. App ready to handle requests
   */
  async onModuleInit() {
    try {
      /**
       * $connect() - Establish connection to PostgreSQL
       *
       * What happens:
       * 1. Reads DATABASE_URL from .env
       * 2. Connects to PostgreSQL on localhost:5432
       * 3. Tests connection with a simple query
       * 4. If fails, throws error
       * 5. If success, connection pool created
       *
       * Connection Pool = Multiple reusable database connections
       * (More efficient than creating new connection each time)
       */
      await this.$connect();

      console.log('✅ Connected to PostgreSQL database');
      console.log(
        '📊 Database: expense_tracker_v1 on localhost:5432',
      );
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      /**
       * process.exit(1) - Shut down application with error code
       *
       * Why? If database connection fails, app can't work
       * Better to crash immediately than run with broken database
       *
       * Error codes:
       * - 0 = Success (normal shutdown)
       * - 1 = Failure (something went wrong)
       */
      process.exit(1);
    }
  }

  /**
   * onModuleDestroy() - Called when NestJS shuts down
   *
   * WHEN: When you stop the server (Ctrl+C) or app crashes
   * PURPOSE: Clean up database connection gracefully
   *
   * Why important?
   * - Prevents connection leaks
   * - Finishes pending queries
   * - Releases resources
   *
   * Like hanging up a phone call properly instead of just
   * throwing the phone away!
   */
  async onModuleDestroy() {
    try {
      /**
       * $disconnect() - Close database connection
       *
       * What happens:
       * 1. Waits for pending queries to finish
       * 2. Closes all connections in pool
       * 3. Releases memory
       */
      await this.$disconnect();

      console.log('👋 Disconnected from PostgreSQL database');
    } catch (error) {
      console.error('⚠️  Error disconnecting from database:', error);
    }
  }

  /**
   * USAGE EXAMPLE
   *
   * In any other service, you can now use:
   *
   * @Injectable()
   * export class AuthService {
   *   constructor(private prisma: PrismaService) {}
   *
   *   async createUser(email: string, passwordHash: string) {
   *     return this.prisma.user.create({
   *       data: { email, passwordHash }
   *     });
   *   }
   *
   *   async findUser(email: string) {
   *     return this.prisma.user.findUnique({
   *       where: { email }
   *     });
   *   }
   * }
   *
   * NestJS automatically injects PrismaService for you!
   */

  /**
   * ADDITIONAL HELPER METHODS
   *
   * We can add custom methods here that all services can use
   * These are convenience methods built on top of Prisma
   */

  /**
   * cleanDatabase() - FOR TESTING ONLY
   *
   * Deletes all data from database
   * Useful for resetting test database between tests
   *
   * ⚠️  NEVER call this in production!
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    // Delete in correct order (respect foreign keys)
    await this.auditLog.deleteMany();
    await this.emailVerification.deleteMany();
    await this.passwordReset.deleteMany();
    await this.user.deleteMany();

    console.log('🧹 Database cleaned (all tables emptied)');
  }
}

/**
 * IMPORTANT NOTES:
 *
 * 1. This service is a SINGLETON
 *    - Only ONE instance exists in entire app
 *    - All services share same instance
 *    - All share same database connection
 *
 * 2. Connection is persistent
 *    - Opens once when app starts
 *    - Stays open while app runs
 *    - Closes when app stops
 *    - Don't need to connect/disconnect for each query
 *
 * 3. Thread-safe
 *    - Multiple requests can use simultaneously
 *    - Prisma handles connection pooling
 *    - No race conditions
 *
 * 4. Auto-generated types
 *    - this.user has TypeScript types
 *    - this.auditLog has TypeScript types
 *    - Auto-completion works in VS Code!
 */
