import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 3030;

  if (process.env.NODE_ENV === 'production') {
    app.enableCors({
      origin: ['https://...'],
      credentials: true,
    });
  } else {
    app.enableCors({
      origin: true,
      credentials: true,
    });
  }

  await app.listen(PORT);
}
bootstrap();
