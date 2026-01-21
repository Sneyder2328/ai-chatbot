import type { PrismaClient } from "db"

export type AuthUser = {
  id: string
}

export type TrpcContext = {
  /**
   * Authenticated user for the request (if any).
   *
   * Set this in your server adapter's context factory.
   */
  user?: AuthUser | null
  /**
   * Database client
   */
  db: PrismaClient
}

export type ProtectedContext = Omit<TrpcContext, "user"> & {
  user: AuthUser
}
