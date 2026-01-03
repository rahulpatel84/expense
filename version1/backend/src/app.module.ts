/**
 * app.module.ts - The Root Module
 *
 * In NestJS, everything is organized into MODULES
 * Think of modules like folders that group related features
 *
 * Example:
 * - AuthModule: Everything about authentication (login, signup, etc.)
 * - UsersModule: Everything about users (profile, settings, etc.)
 * - ExpensesModule: Everything about expenses (create, list, delete, etc.)
 *
 * AppModule is the ROOT module that imports all other modules
 */

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

/**
 * @Module() Decorator
 *
 * Decorators are like labels that add functionality
 * @Module tells NestJS: "This class is a module"
 *
 * A module has 4 main properties:
 * 1. imports: Other modules this module depends on
 * 2. controllers: Classes that handle HTTP requests
 * 3. providers: Services (business logic, database access, etc.)
 * 4. exports: Things this module shares with other modules
 */
@Module({
  /**
   * imports: []
   *
   * List of other modules we need
   *
   * PrismaModule: Provides database connection (@Global so available everywhere)
   * AuthModule: Provides authentication (signup, login, JWT tokens)
   *
   * We'll add more later:
   * - UsersModule (for user management)
   * - ExpensesModule (for expense tracking)
   * - etc.
   */
  imports: [
    PrismaModule, // Database connection
    AuthModule,   // Authentication endpoints
  ],

  /**
   * controllers: []
   *
   * Controllers handle HTTP requests and send responses
   *
   * Example: When frontend sends GET /api/health
   * → AppController.getHealth() handles it
   */
  controllers: [AppController],

  /**
   * providers: []
   *
   * Providers are classes that can be injected into other classes
   * Usually services that contain business logic
   *
   * AppService: Simple service for basic operations
   */
  providers: [AppService],
})
export class AppModule {
  /**
   * The module class is usually empty
   * All configuration is in the @Module() decorator above
   */
}
