import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const chatRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chat.create({
        data: {
          userId: ctx.user.id,
          title: input.title,
        },
      });
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.chat.findMany({
      where: {
        userId: ctx.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
});
