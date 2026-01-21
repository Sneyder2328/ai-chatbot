import { protectedProcedure, router } from "@ai-chatbot/trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import {
  type AiModelId,
  type AiProviderId,
  DEFAULT_AI_MODEL_ID,
  DEFAULT_AI_PROVIDER_ID,
  getAiModelCatalogEntry,
  isAiModelId,
  isAiProviderId,
  listAiModelsForProvider,
} from "../../ai"

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

function resolveModelSelection(input: {
  providerId?: string | null
  modelId?: string | null
}): {
  providerId: AiProviderId
  modelId: AiModelId
} {
  const providerIdRaw = input.providerId ?? undefined
  const modelIdRaw = input.modelId ?? undefined

  const maybeModelId = modelIdRaw
    ? isAiModelId(modelIdRaw)
      ? modelIdRaw
      : (() => {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid modelId",
          })
        })()
    : null

  const maybeProviderId = providerIdRaw
    ? isAiProviderId(providerIdRaw)
      ? providerIdRaw
      : (() => {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid providerId",
          })
        })()
    : null

  if (maybeModelId) {
    const entry = getAiModelCatalogEntry(maybeModelId)
    if (maybeProviderId && entry.providerId !== maybeProviderId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Model is not available for provider",
      })
    }

    return { providerId: entry.providerId, modelId: maybeModelId }
  }

  const providerId = maybeProviderId ?? DEFAULT_AI_PROVIDER_ID
  const defaultEntry = getAiModelCatalogEntry(DEFAULT_AI_MODEL_ID)
  if (defaultEntry.providerId === providerId) {
    return { providerId, modelId: DEFAULT_AI_MODEL_ID }
  }

  const fallbackModelId = listAiModelsForProvider(providerId)[0]?.id
  if (!fallbackModelId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `No AI models available for provider "${providerId}"`,
    })
  }

  return { providerId, modelId: fallbackModelId }
}

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
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
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
        providerId: z.string().optional(),
        modelId: z.string().optional(),
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

      const { providerId, modelId } = resolveModelSelection(input)

      // Create the message and update chat's lastMessageAt in a transaction
      const result = await ctx.db.$transaction(async (tx) => {
        const message = await tx.message.create({
          data: {
            chatId: input.chatId,
            role: "USER",
            content: input.content,
            providerId,
            modelId,
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
        providerId: z.string().optional(),
        modelId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date()
      const { providerId, modelId } = resolveModelSelection(input)

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
            providerId,
            modelId,
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
