import type { auth } from "./auth";

export type BetterAuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

declare global {
  namespace Express {
    interface Request {
      session?: BetterAuthSession;
    }
  }
}
