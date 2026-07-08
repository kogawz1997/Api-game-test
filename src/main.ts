import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ verify: (req: any, _res, buffer) => { req.rawBody = buffer.toString('utf8'); } }));
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  console.log(`Mock Game Provider API running on http://localhost:${port}`);
}
bootstrap();
