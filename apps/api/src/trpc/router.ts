import { protectedProcedure, publicProcedure, router } from "@ai-chatbot/trpc"
import { z } from "zod"
import { aiRouter } from "./routers/ai"
import { chatRouter } from "./routers/chat"
import { messageRouter } from "./routers/messages"

export const appRouter = router({
  health: publicProcedure.query(() => "ok"),
  echo: publicProcedure
    .input(
      z.object({
        text: z.string().min(1),
      }),
    )
    .query(({ input }) => input),
  me: protectedProcedure.query(({ ctx }) => ctx.user),
  ai: aiRouter,
  chat: chatRouter,
  message: messageRouter,
})

export type AppRouter = typeof appRouter
