import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '5', 10),
  minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '1', 10),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '60000', 10)
})
export const prisma = new PrismaClient({ adapter })

export * from "./generated/prisma/client"