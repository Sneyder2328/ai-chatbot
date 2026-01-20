import { protectedProcedure, router } from "@ai-chatbot/trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

const messageSelect = {
  id: true,
  chatId: true,
  role: true,
  content: true,
  providerId: true,
  modelId: true,
  status: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
} as const

export const messageRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First verify the chat belongs to the user
      const chat = await ctx.db.chat.findFirst({
        where: {
          id: input.chatId,
          userId: ctx.user.id,
          deletedAt: null,
        },
      })

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found or access denied",
        })
      }

      const messages = await ctx.db.message.findMany({
        where: {
          chatId: input.chatId,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: messageSelect,
      })

      return messages.map((message) => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      }))
    }),

  create: protectedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First verify the chat belongs to the user
      const chat = await ctx.db.chat.findFirst({
        where: {
          id: input.chatId,
          userId: ctx.user.id,
          deletedAt: null,
        },
      })

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found or access denied",
        })
      }

      // Create the message and update chat's lastMessageAt in a transaction
      const result = await ctx.db.$transaction(async (tx) => {
        const message = await tx.message.create({
          data: {
            chatId: input.chatId,
            role: "USER",
            content: input.content,
          },
          select: messageSelect,
        })

        // Update chat's lastMessageAt
        await tx.chat.update({
          where: {
            id: input.chatId,
          },
          data: {
            lastMessageAt: new Date(),
          },
        })

        return message
      })

      return {
        ...result,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      }
    }),

  createInNewChat: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date()

      const message = await ctx.db.$transaction(async (tx) => {
        const chat = await tx.chat.create({
          data: {
            userId: ctx.user.id,
            title: "New chat",
            lastMessageAt: now,
          },
          select: { id: true },
        })

        return tx.message.create({
          data: {
            chatId: chat.id,
            role: "USER",
            content: input.content,
          },
          select: messageSelect,
        })
      })

      return {
        ...message,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      }
    }),
})
