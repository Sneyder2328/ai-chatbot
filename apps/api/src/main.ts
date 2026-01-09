import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { createExpressMiddleware } from "@trpc/server/adapters/express"
import { AppModule } from "./app.module"
import { createContext } from "./trpc/context"
import { appRouter } from "./trpc/router"

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  app.enableCors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  })

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  )

  await app.listen(process.env.PORT || 3000)
}

bootstrap()
