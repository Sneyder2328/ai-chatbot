import { protectedProcedure, router } from "@ai-chatbot/trpc";
import { z } from "zod";

const chatSelect = {
  id: true,
  title: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const chatRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.db.chat.create({
        data: {
          userId: ctx.user.id,
          title: input.title ?? "New chat",
        },
        select: chatSelect,
      });

      return {
        ...chat,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
      };
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    const chats = await ctx.db.chat.findMany({
      where: {
        userId: ctx.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: chatSelect,
    });

    return chats.map((chat) => ({
      ...chat,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    }));
  }),
});
