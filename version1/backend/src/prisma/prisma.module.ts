/**
 * prisma.module.ts - Prisma Module
 *
 * WHAT IS A MODULE?
 * A module is like a folder that groups related code together
 *
 * WHAT DOES THIS MODULE DO?
 * - Provides PrismaService to other modules
 * - Makes database access available everywhere
 *
 * WHY SEPARATE MODULE?
 * - Clean organization
 * - Can import in any other module
 * - Single source of truth for database connection
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * @Global() Decorator
 *
 * Makes this module available EVERYWHERE in the app
 * Without @Global(), we'd have to import PrismaModule in every module
 *
 * With @Global():
 *   ✅ Import PrismaModule once in AppModule
 *   ✅ Use PrismaService anywhere
 *
 * Without @Global():
 *   ❌ Import PrismaModule in AppModule
 *   ❌ Import PrismaModule in AuthModule
 *   ❌ Import PrismaModule in UsersModule
 *   ❌ Import PrismaModule in ExpensesModule
 *   ... (repetitive!)
 */
@Global()
@Module({
  /**
   * providers: []
   *
   * Services that this module creates
   *
   * NestJS will:
   * 1. Create ONE instance of PrismaService
   * 2. Keep it alive for entire app lifetime
   * 3. Inject it wherever needed
   */
  providers: [PrismaService],

  /**
   * exports: []
   *
   * What this module shares with others
   *
   * By exporting PrismaService:
   * - Other modules can import PrismaModule
   * - Other services can inject PrismaService
   *
   * Example:
   *   @Injectable()
   *   export class AuthService {
   *     constructor(private prisma: PrismaService) {}
   *     // Can now use this.prisma.user.create()
   *   }
   */
  exports: [PrismaService],
})
export class PrismaModule {
  /**
   * Module class is usually empty
   * All configuration is in @Module() decorator
   */
}
