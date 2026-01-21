import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { createExpressMiddleware } from "@trpc/server/adapters/express"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import { AppModule } from "./app.module"
import { env } from "./env"
import { createContext } from "./trpc/context"
import { appRouter } from "./trpc/router"

function isOriginAllowed(allowedOrigins: readonly string[], origin: string) {
  return allowedOrigins.includes(origin)
}

function corsOriginCallback(
  allowedOrigins: readonly string[],
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
) {
  // Non-browser clients (curl/postman) often omit Origin — allow them.
  if (!origin) {
    callback(null, true)
    return
  }

  if (isOriginAllowed(allowedOrigins, origin)) {
    callback(null, true)
    return
  }

  callback(new Error("Not allowed by CORS"), false)
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  if (env.trustProxy) {
    app.set("trust proxy", 1)
  }

  app.disable("x-powered-by")

  app.use(
    helmet({
      // Safe defaults for an API. If you later serve HTML from the API,
      // revisit CSP settings.
      contentSecurityPolicy: false,
      // This API is consumed cross-origin (e.g. Vite dev server on :5173).
      // Helmet defaults CORP to "same-origin", which breaks EventSource/SSE in Chrome
      // with `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  )

  app.enableCors({
    origin: (origin, callback) =>
      corsOriginCallback(env.corsOrigins, origin, callback),
    credentials: true,
  })

  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 50,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  )

  app.use(
    "/api/trpc",
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  )

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  )

  await app.listen(env.port)
}

bootstrap()
