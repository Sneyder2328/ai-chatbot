import { initTRPC, TRPCError } from "@trpc/server"
import type { ProtectedContext, TrpcContext } from "./context"

const t = initTRPC.context<TrpcContext>().create()

export const router = t.router

export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    } as ProtectedContext,
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
