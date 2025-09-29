import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Logger et validation
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Cookie parser
  app.use(cookieParser());

  const configService = app.get(ConfigService);

  // CORS : autoriser frontend et envoyer cookie
  app.enableCors({
    origin: ['http://localhost:3000', 'https://shoppy-ui-app.vercel.app'],
    credentials: true, // important pour cookie JWT
  });

  await app.listen(configService.getOrThrow<number>('PORT'));
}
bootstrap();
