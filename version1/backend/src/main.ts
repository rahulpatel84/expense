/**
 * main.ts - The Entry Point of Our Backend Application
 *
 * Think of this as the "main()" function in C or Java
 * This file runs first when you start the backend server
 *
 * What happens here:
 * 1. Load environment variables from .env file
 * 2. Import NestJS framework
 * 3. Create the application instance
 * 4. Configure settings (CORS, validation, etc.)
 * 5. Start the server on a port (like 3001)
 */

// Load environment variables FIRST (before anything else!)
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * bootstrap() - Main function that starts everything
 *
 * 'async' means this function can wait for things (like starting the server)
 * without blocking other code
 */
async function bootstrap() {
  console.log('🚀 Starting ExpenseAI Backend...\n');

  /**
   * Step 1: Create the NestJS application
   *
   * NestFactory.create() builds our app using the AppModule
   * AppModule is the root module that imports all other modules
   */
  const app = await NestFactory.create(AppModule);
  console.log('✅ NestJS application created');

  /**
   * Step 2: Enable CORS (Cross-Origin Resource Sharing)
   *
   * Why? Our frontend (http://localhost:5173) needs to call
   * our backend (http://localhost:3000)
   *
   * Without CORS, browsers block these requests for security
   *
   * origin: Which websites can call our API
   * credentials: Allow cookies and auth headers
   */
  /**
   * CORS Configuration
   * 
   * In development, allow all localhost ports (5173, 5174, 3000, etc.)
   * In production, specify exact frontend URL
   */
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'http://localhost:5173']
    : [
        'http://localhost:5173', // Vite default port
        'http://localhost:5174', // Vite alternate port
        'http://localhost:3000', // Common dev port
        'http://localhost:5175', // Another Vite port
      ];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // In development, allow any localhost port
        if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true, // Allow cookies for refresh tokens
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  });
  console.log('✅ CORS enabled for:', allowedOrigins.join(', '));
  console.log('✅ CORS also allows any localhost port in development');

  /**
   * Step 3: Enable Global Validation
   *
   * ValidationPipe automatically validates all incoming requests
   * using class-validator decorators (@IsEmail, @MinLength, etc.)
   *
   * whitelist: true - Remove any properties that aren't in our DTOs
   * forbidNonWhitelisted: true - Throw error if extra properties sent
   * transform: true - Automatically convert types (string "5" → number 5)
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Transform payloads to DTO instances
    }),
  );
  console.log('✅ Global validation pipe enabled');

  /**
   * Step 4: Set the port
   *
   * process.env.PORT - Read from environment variable (for production)
   * || 3000 - If not set, use 3000 (for development)
   *
   * Environment variables are like settings you can change without
   * modifying code (useful for different environments: dev, staging, prod)
   */
  const port = process.env.PORT || 3001;

  /**
   * Step 5: Start the server
   *
   * await app.listen(port) - Start listening for HTTP requests on the port
   * This is like opening a shop - now customers (frontend) can come in!
   */
  await app.listen(port);

  console.log(`\n🎉 Backend is running!`);
  console.log(`📡 Server: http://localhost:${port}`);
  console.log(`📚 API Base: http://localhost:${port}/api`);
  console.log(`\n✨ Ready to accept requests!\n`);
}

/**
 * Start the application
 *
 * .catch() - If anything goes wrong during startup, log the error
 */
bootstrap().catch((error) => {
  console.error('❌ Failed to start backend:', error);
  process.exit(1); // Exit with error code
});
