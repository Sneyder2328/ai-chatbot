import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
