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

function getForkTitle(sourceTitle: string) {
  const suffix = " (fork)"
  const maxLength = 100

  const baseTitle =
    sourceTitle.trim().length > 0 ? sourceTitle.trim() : "New chat"
  const maxBaseLength = Math.max(0, maxLength - suffix.length)
  const trimmedBase =
    baseTitle.length <= maxBaseLength
      ? baseTitle
      : baseTitle.slice(0, maxBaseLength)

  return `${trimmedBase}${suffix}`
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

  fork: protectedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
        fromMessageId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date()

      const forkedChat = await ctx.db.$transaction(async (tx) => {
        const sourceChat = await tx.chat.findFirst({
          where: {
            id: input.chatId,
            userId: ctx.user.id,
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
          },
        })

        if (!sourceChat) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Chat not found or access denied",
          })
        }

        const sourceMessages = await tx.message.findMany({
          where: {
            chatId: input.chatId,
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            role: true,
            content: true,
            providerId: true,
            modelId: true,
            status: true,
            errorMessage: true,
            createdAt: true,
          },
        })

        const fromIndex = sourceMessages.findIndex(
          (message) => message.id === input.fromMessageId,
        )

        if (fromIndex === -1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Message not found in chat",
          })
        }

        const messagesToCopy = sourceMessages.slice(0, fromIndex + 1)

        const newChat = await tx.chat.create({
          data: {
            userId: ctx.user.id,
            title: getForkTitle(sourceChat.title),
            lastMessageAt: now,
            forkedFromChatId: input.chatId,
            forkedFromMessageId: input.fromMessageId,
          },
          select: chatSelect,
        })

        await tx.message.createMany({
          data: messagesToCopy.map((message) => ({
            chatId: newChat.id,
            role: message.role,
            content: message.content,
            providerId: message.providerId,
            modelId: message.modelId,
            status: message.status,
            errorMessage: message.errorMessage,
            createdAt: message.createdAt,
          })),
        })

        return newChat
      })

      return serializeChat(forkedChat)
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
