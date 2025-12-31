import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

  // Security middleware
  app.use(helmet());
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  await app.listen(port);

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 ExpenseAI Backend is running!                            ║
║                                                                ║
║   📍 Server:     http://localhost:${port}                         ║
║   🔗 API:        http://localhost:${port}/api                     ║
║   🌐 Frontend:   ${frontendUrl}                    ║
║   📊 Health:     http://localhost:${port}/api/health              ║
║                                                                ║
║   Environment:   ${configService.get('NODE_ENV')}                               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
