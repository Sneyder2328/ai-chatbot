import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "db"
import { env } from "../env"

export const auth = betterAuth({
  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,
  basePath: "/api/auth",
  trustedOrigins: env.corsOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders:
    env.googleClientId && env.googleClientSecret
      ? {
          google: {
            clientId: env.googleClientId,
            clientSecret: env.googleClientSecret,
          },
        }
      : {},
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
      strategy: "jwe",
      refreshCache: true,
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: ".sneyderangulo.com", // Allows cookies to be shared across *.sneyderangulo.com
    },
  },
})
