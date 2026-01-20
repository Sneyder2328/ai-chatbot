import "dotenv/config"

import { z } from "zod"

const nodeEnvSchema = z
  .enum(["development", "test", "production"])
  .default("development")

const rawEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),

  /**
   * Comma-separated list of allowed browser origins for CORS (no paths).
   * Example: "https://app.example.com,https://admin.example.com"
   */
  CLIENT_URL: z.string().optional(),

  /**
   * Better Auth server base URL (no path). Example: "https://api.example.com"
   */
  BETTER_AUTH_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(1),

  DATABASE_URL: z.string().min(1),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().optional(),
  OPENROUTER_APP_NAME: z.string().min(1).optional(),
  OPENROUTER_APP_URL: z.string().url().optional(),

  /**
   * Set to true when behind a reverse proxy (Fly/Render/NGINX).
   * Avoid enabling unless you know you need it.
   */
  TRUST_PROXY: z.coerce.boolean().optional(),
})

function parseOrigins(value: string): string[] {
  const candidates = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  if (candidates.length === 0) {
    return []
  }

  return candidates.map((candidate) => {
    const url = new URL(candidate)
    const hasOnlyOriginParts =
      url.pathname === "/" && url.search === "" && url.hash === ""

    if (!hasOnlyOriginParts) {
      throw new Error(
        `Invalid origin "${candidate}". Provide origins only (no path/query/hash).`,
      )
    }

    return url.origin
  })
}

function requireInProduction(
  nodeEnv: "development" | "test" | "production",
  name: string,
  value: string | undefined,
): string | undefined {
  if (nodeEnv === "production" && !value) {
    throw new Error(
      `Missing required environment variable in production: ${name}`,
    )
  }

  return value
}

const raw = rawEnvSchema.parse(process.env)

const clientUrl = requireInProduction(
  raw.NODE_ENV,
  "CLIENT_URL",
  raw.CLIENT_URL,
)
const betterAuthUrl = requireInProduction(
  raw.NODE_ENV,
  "BETTER_AUTH_URL",
  raw.BETTER_AUTH_URL,
)

const corsOrigins =
  clientUrl && clientUrl.trim().length > 0
    ? parseOrigins(clientUrl)
    : raw.NODE_ENV === "production"
      ? []
      : ["http://localhost:5173"]

export const env = {
  nodeEnv: raw.NODE_ENV,
  port: raw.PORT,
  trustProxy: raw.TRUST_PROXY ?? false,

  corsOrigins,

  betterAuthUrl: betterAuthUrl ?? `http://localhost:${raw.PORT}`,
  betterAuthSecret: raw.BETTER_AUTH_SECRET,

  databaseUrl: raw.DATABASE_URL,

  googleClientId: raw.GOOGLE_CLIENT_ID,
  googleClientSecret: raw.GOOGLE_CLIENT_SECRET,

  openrouterApiKey: raw.OPENROUTER_API_KEY,
  openrouterBaseUrl: raw.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
  openrouterAppName: raw.OPENROUTER_APP_NAME,
  openrouterAppUrl: raw.OPENROUTER_APP_URL,
} as const
