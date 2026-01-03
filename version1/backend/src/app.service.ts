/**
 * app.service.ts - Service for Business Logic
 *
 * WHAT IS A SERVICE?
 * Services contain business logic and are separate from controllers
 *
 * WHY SEPARATE?
 * - Controllers: Handle HTTP (requests/responses)
 * - Services: Handle business logic (calculations, database, etc.)
 *
 * BENEFITS:
 * 1. Clean code - Each class has ONE job
 * 2. Reusable - Multiple controllers can use same service
 * 3. Testable - Easy to test business logic separately
 *
 * EXAMPLE:
 * Controller: "User wants to login"
 * Service: "Let me check database, verify password, generate token"
 * Controller: "Here's the token!" (sends response)
 */

import { Injectable } from '@nestjs/common';

/**
 * @Injectable() Decorator
 *
 * Tells NestJS: "This class can be injected into other classes"
 *
 * This enables Dependency Injection:
 * - NestJS creates ONE instance of this service
 * - Any class that needs it gets the SAME instance
 * - No need to manually create instances with 'new'
 *
 * This is called the SINGLETON pattern
 */
@Injectable()
export class AppService {
  /**
   * getWelcome() - Returns a welcome message
   *
   * This is a simple example of business logic
   * In real apps, services do things like:
   * - Query database
   * - Send emails
   * - Process payments
   * - Complex calculations
   * - Call external APIs
   */
  getWelcome(): string {
    return `
      🎉 Welcome to ExpenseAI Backend!

      This is a learning project where we build a production-ready
      expense tracker with authentication from scratch.

      What you'll learn:
      ✅ NestJS backend framework
      ✅ PostgreSQL database with Prisma ORM
      ✅ JWT authentication (login/signup)
      ✅ Redis for sessions
      ✅ React frontend
      ✅ Full-stack deployment

      Next steps:
      1. Check /health - Verify server is running
      2. Check /info - See available endpoints
      3. Follow LEARNING-GUIDE.md for step-by-step tutorial

      Happy coding! 🚀
    `;
  }

  /**
   * NOTE: As we build more features, we'll add more methods here
   *
   * Future methods:
   * - validateUser(email, password)
   * - createUser(userData)
   * - generateToken(userId)
   * - etc.
   */
}
