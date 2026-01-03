/**
 * app.controller.ts - Controller for Basic Routes
 *
 * WHAT IS A CONTROLLER?
 * Controllers handle incoming HTTP requests and return responses
 *
 * Think of it like a receptionist:
 * - Client: "I want to check if the server is running"
 * - Controller: "Let me check... yes, it's running!"
 * - Client receives response
 *
 * HTTP REQUEST FLOW:
 * 1. Browser/Frontend sends: GET http://localhost:3000/health
 * 2. NestJS routes it to: AppController.getHealth()
 * 3. Controller processes and returns: { status: 'ok', message: 'Server is running!' }
 * 4. Browser receives JSON response
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

/**
 * @Controller() Decorator
 *
 * Tells NestJS: "This class handles HTTP requests"
 *
 * The string inside @Controller('route') sets the base path
 * @Controller('users') → all routes start with /users
 * @Controller() → no base path, routes start from root
 */
@Controller()
export class AppController {
  /**
   * DEPENDENCY INJECTION
   *
   * The constructor receives services automatically
   * NestJS creates them and injects them here
   *
   * Why? So we don't have to do: const service = new AppService()
   * NestJS manages it for us (creates once, reuses everywhere)
   *
   * Now we're injecting TWO services:
   * - appService: For business logic
   * - prisma: For database queries
   */
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Route 1: Health Check Endpoint
   *
   * @Get() - Handles HTTP GET requests
   * @Get('health') - Responds to: GET /health
   *
   * This is like a heartbeat - lets you know the server is alive
   */
  @Get('health')
  getHealth() {
    console.log('📡 Health check requested');

    return {
      status: 'ok',
      message: 'ExpenseAI Backend is running!',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(), // How long server has been running (seconds)
    };
  }

  /**
   * Route 2: Welcome Message
   *
   * @Get() - Without path means root: GET /
   *
   * Calls appService.getWelcome() to get the message
   * Services contain business logic, controllers just coordinate
   */
  @Get()
  getWelcome(): string {
    console.log('👋 Welcome endpoint requested');
    return this.appService.getWelcome();
  }

  /**
   * Route 3: API Information
   *
   * @Get('info') - Responds to: GET /info
   *
   * Returns information about available endpoints
   */
  @Get('info')
  getInfo() {
    return {
      name: 'ExpenseAI API',
      version: '1.0.0',
      description: 'Learn-by-building expense tracker with authentication',
      endpoints: {
        health: 'GET /health - Check server status',
        welcome: 'GET / - Welcome message',
        info: 'GET /info - This endpoint',
        testDb: 'GET /test-db - Test database connection',
      },
      documentation: 'See LEARNING-GUIDE.md for detailed explanations',
    };
  }

  /**
   * Route 4: Test Database Connection
   *
   * @Get('test-db') - Responds to: GET /test-db
   *
   * THIS IS A TEST ENDPOINT - demonstrates Prisma working!
   *
   * What it does:
   * 1. Queries database for user count
   * 2. Queries database for all table counts
   * 3. Returns results as JSON
   *
   * This proves:
   * - ✅ Prisma service injected correctly
   * - ✅ Database connection works
   * - ✅ Can execute queries from code
   */
  @Get('test-db')
  async testDatabase() {
    console.log('🧪 Testing database connection...');

    try {
      /**
       * Count records in each table
       *
       * Syntax: await this.prisma.[tableName].count()
       * - await: Wait for database to respond
       * - this.prisma: Our injected database service
       * - .user: The User model from schema
       * - .count(): Prisma method to count records
       */
      const userCount = await this.prisma.user.count();
      const passwordResetCount = await this.prisma.passwordReset.count();
      const emailVerificationCount =
        await this.prisma.emailVerification.count();
      const auditLogCount = await this.prisma.auditLog.count();

      console.log('✅ Database query successful!');
      console.log(`   Users: ${userCount}`);
      console.log(`   Password Resets: ${passwordResetCount}`);
      console.log(`   Email Verifications: ${emailVerificationCount}`);
      console.log(`   Audit Logs: ${auditLogCount}`);

      return {
        success: true,
        message: 'Database connection working! 🎉',
        data: {
          tables: {
            users: userCount,
            passwordResets: passwordResetCount,
            emailVerifications: emailVerificationCount,
            auditLogs: auditLogCount,
          },
          totalRecords:
            userCount +
            passwordResetCount +
            emailVerificationCount +
            auditLogCount,
        },
        note: 'All counts should be 0 (we have not created any records yet)',
      };
    } catch (error: any) {
      console.error('❌ Database query failed:', error);

      return {
        success: false,
        message: 'Database connection failed',
        error: error.message,
      };
    }
  }
}
