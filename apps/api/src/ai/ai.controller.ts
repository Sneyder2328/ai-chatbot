import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common"
import type { ModelMessage } from "ai"
import { prisma } from "db"
import type { Request, Response } from "express"
import { z } from "zod"
import { AuthGuard } from "../auth/auth.guard"
import {
  type AiModelId,
  type AiProviderId,
  DEFAULT_AI_MODEL_ID,
  DEFAULT_AI_PROVIDER_ID,
  getAiLanguageModel,
  isAiModelId,
  isAiProviderId,
} from "./index"

const streamQuerySchema = z.object({
  chatId: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().uuid()),
  userMessageId: z.preprocess(
    (v) => (Array.isArray(v) ? v[0] : v),
    z.string().uuid(),
  ),
  providerId: z.preprocess(
    (v) => (Array.isArray(v) ? v[0] : v),
    z.string().optional(),
  ),
  modelId: z.preprocess(
    (v) => (Array.isArray(v) ? v[0] : v),
    z.string().optional(),
  ),
})

function writeSseEvent(res: Response, event: string, data: string) {
  res.write(`event: ${event}\n`)
  for (const line of data.split(/\r?\n/)) {
    res.write(`data: ${line}\n`)
  }
  res.write("\n")
}

function toModelMessages(
  messages: ReadonlyArray<{ role: string; content: string }>,
): ModelMessage[] {
  const result: ModelMessage[] = []

  for (const message of messages) {
    switch (message.role) {
      case "USER":
        result.push({ role: "user", content: message.content })
        break
      case "ASSISTANT":
        result.push({ role: "assistant", content: message.content })
        break
      case "SYSTEM":
        result.push({ role: "system", content: message.content })
        break
      case "TOOL":
        // Tool messages store JSON-encoded tool results in content
        // Parse and convert to the AI SDK's expected format
        try {
          const toolResults = JSON.parse(message.content)
          result.push({ role: "tool", content: toolResults })
        } catch {
          // If parsing fails, skip the malformed tool message
          // This prevents breaking the conversation context
          console.warn("Failed to parse tool message content as JSON")
        }
        break
    }
  }

  return result
}

@Controller("api/ai")
export class AiController {
  @Get("stream")
  @UseGuards(AuthGuard)
  async streamAssistantResponse(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: unknown,
  ) {
    const parsedQuery = streamQuerySchema.safeParse(query)
    if (!parsedQuery.success) {
      throw new BadRequestException("Invalid query parameters")
    }

    const { chatId, userMessageId } = parsedQuery.data

    const providerIdRaw = parsedQuery.data.providerId
    const providerId: AiProviderId = providerIdRaw
      ? isAiProviderId(providerIdRaw)
        ? providerIdRaw
        : (() => {
            throw new BadRequestException("Invalid providerId")
          })()
      : DEFAULT_AI_PROVIDER_ID

    const modelIdRaw = parsedQuery.data.modelId
    const modelId: AiModelId = modelIdRaw
      ? isAiModelId(modelIdRaw)
        ? modelIdRaw
        : (() => {
            throw new BadRequestException("Invalid modelId")
          })()
      : DEFAULT_AI_MODEL_ID

    const userId = req.session?.user.id
    if (!userId) {
      throw new BadRequestException("Missing session user")
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    })

    if (!chat) {
      throw new NotFoundException("Chat not found")
    }

    const userMessage = await prisma.message.findFirst({
      where: {
        id: userMessageId,
        chatId,
        role: "USER",
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    if (!userMessage) {
      throw new NotFoundException("User message not found")
    }

    const contextMessages = await prisma.message.findMany({
      where: {
        chatId,
        createdAt: {
          lte: userMessage.createdAt,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        role: true,
        content: true,
      },
    })

    const assistantMessage = await prisma.message.create({
      data: {
        chatId,
        role: "ASSISTANT",
        content: "",
        providerId,
        modelId,
        status: "STREAMING",
      },
      select: {
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
      },
    })

    res.status(200)
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("X-Accel-Buffering", "no")
    res.flushHeaders()

    // Establish the stream early (helpful for some proxies)
    res.write(": stream started\n\n")

    const abortController = new AbortController()
    req.on("close", () => {
      abortController.abort()
    })

    const pingInterval = setInterval(() => {
      res.write(": ping\n\n")
    }, 15_000)

    let fullContent = ""
    let pendingBuffer = ""

    let writeChain = Promise.resolve()
    const enqueuePersist = (content: string) => {
      writeChain = writeChain
        .then(() =>
          prisma.message.update({
            where: { id: assistantMessage.id },
            data: { content },
          }),
        )
        .then(() => undefined)
        .catch(() => undefined)
    }

    const persistInterval = setInterval(() => {
      if (pendingBuffer.length === 0) return
      pendingBuffer = ""
      enqueuePersist(fullContent)
    }, 750)

    try {
      const model = await getAiLanguageModel({ providerId, modelId })
      const { streamText } = await import("ai")

      const result = await streamText({
        model,
        messages: toModelMessages(contextMessages.reverse()),
        abortSignal: abortController.signal,
      })

      for await (const delta of result.textStream) {
        fullContent += delta
        pendingBuffer += delta

        writeSseEvent(res, "delta", delta)

        if (pendingBuffer.length >= 200) {
          pendingBuffer = ""
          enqueuePersist(fullContent)
        }
      }

      pendingBuffer = ""
      enqueuePersist(fullContent)
      await writeChain

      const completedMessage = await prisma.message.update({
        where: { id: assistantMessage.id },
        data: {
          content: fullContent,
          status: "COMPLETED",
          errorMessage: null,
        },
        select: {
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
        },
      })

      await prisma.chat.update({
        where: { id: chatId },
        data: { lastMessageAt: new Date() },
      })

      writeSseEvent(
        res,
        "done",
        JSON.stringify({
          ...completedMessage,
          createdAt: completedMessage.createdAt.toISOString(),
          updatedAt: completedMessage.updatedAt.toISOString(),
        }),
      )
      res.end()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"

      pendingBuffer = ""
      enqueuePersist(fullContent)
      await writeChain

      const failedMessage = await prisma.message.update({
        where: { id: assistantMessage.id },
        data: {
          content: fullContent,
          status: "FAILED",
          errorMessage,
        },
        select: {
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
        },
      })

      writeSseEvent(
        res,
        "error",
        JSON.stringify({
          message: errorMessage,
          assistantMessage: {
            ...failedMessage,
            createdAt: failedMessage.createdAt.toISOString(),
            updatedAt: failedMessage.updatedAt.toISOString(),
          },
        }),
      )
      res.end()
    } finally {
      clearInterval(pingInterval)
      clearInterval(persistInterval)
    }
  }
}
