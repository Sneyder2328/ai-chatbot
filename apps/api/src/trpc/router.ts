import { protectedProcedure, publicProcedure, router } from "@ai-chatbot/trpc";
import { z } from "zod";
import { chatRouter } from "./routers/chat";

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
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
