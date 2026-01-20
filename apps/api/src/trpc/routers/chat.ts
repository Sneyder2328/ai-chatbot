import { protectedProcedure, router } from "@ai-chatbot/trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

const chatSelect = {
  id: true,
  title: true,
  pinnedAt: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
} as const

function serializeChat(chat: {
  id: string
  title: string
  pinnedAt: Date | null
  lastMessageAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...chat,
    pinnedAt: chat.pinnedAt?.toISOString() ?? null,
    lastMessageAt: chat.lastMessageAt?.toISOString() ?? null,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
  }
}

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
      })

      return serializeChat(chat)
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    const chats = await ctx.db.chat.findMany({
      where: {
        userId: ctx.user.id,
        deletedAt: null,
      },
      orderBy: [
        {
          pinnedAt: {
            sort: "desc",
            nulls: "last",
          },
        },
        {
          lastMessageAt: {
            sort: "desc",
            nulls: "last",
          },
        },
        {
          updatedAt: "desc",
        },
      ],
      select: chatSelect,
    })

    return chats.map(serializeChat)
  }),

  pin: protectedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.db.chat.findFirst({
        where: {
          id: input.chatId,
          userId: ctx.user.id,
          deletedAt: null,
        },
        select: { id: true },
      })

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found or access denied",
        })
      }

      const updated = await ctx.db.chat.update({
        where: { id: input.chatId },
        data: { pinnedAt: new Date() },
        select: chatSelect,
      })

      return serializeChat(updated)
    }),

  unpin: protectedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.db.chat.findFirst({
        where: {
          id: input.chatId,
          userId: ctx.user.id,
          deletedAt: null,
        },
        select: { id: true },
      })

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found or access denied",
        })
      }

      const updated = await ctx.db.chat.update({
        where: { id: input.chatId },
        data: { pinnedAt: null },
        select: chatSelect,
      })

      return serializeChat(updated)
    }),

  delete: protectedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.db.chat.findFirst({
        where: {
          id: input.chatId,
          userId: ctx.user.id,
          deletedAt: null,
        },
        select: { id: true },
      })

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found or access denied",
        })
      }

      await ctx.db.chat.update({
        where: { id: input.chatId },
        data: { deletedAt: new Date(), pinnedAt: null },
      })

      return { id: input.chatId }
    }),
})
