import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(cookieParser());
  // ⚠️ raw body pour Stripe uniquement
  app.use('/checkout/webhook', express.raw({ type: 'application/json' }));
  await app.listen(app.get(ConfigService).getOrThrow('PORT'));
}
bootstrap();
