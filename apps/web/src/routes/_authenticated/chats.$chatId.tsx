import {
  createFileRoute,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import { Send } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "../../components/ui/button"
import { trpc } from "../../lib/trpc"
import { cn } from "../../lib/utils"

export const Route = createFileRoute("/_authenticated/chats/$chatId")({
  component: ChatView,
})

type StreamState =
  | {
      assistantMessageId: string
      content: string
      status: "STREAMING"
      errorMessage: null
      startedAt: string
    }
  | {
      assistantMessageId: string
      content: string
      status: "FAILED"
      errorMessage: string
      startedAt: string
    }
  | null

type AutostartState = {
  chatId: string
  userMessageId: string
  providerId: string
  modelId: string
}

function getAutostartState(
  state: unknown,
  chatId: string,
): AutostartState | null {
  if (!state || typeof state !== "object") return null

  const autostart = (state as { autostart?: unknown }).autostart
  if (!autostart || typeof autostart !== "object") return null

  const parsed = autostart as Partial<AutostartState>
  if (parsed.chatId !== chatId) return null
  if (typeof parsed.userMessageId !== "string") return null
  if (typeof parsed.providerId !== "string") return null
  if (typeof parsed.modelId !== "string") return null

  return {
    chatId: parsed.chatId,
    userMessageId: parsed.userMessageId,
    providerId: parsed.providerId,
    modelId: parsed.modelId,
  }
}

function ChatView() {
  const { chatId } = Route.useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const [streamState, setStreamState] = useState<StreamState>(null)

  const autostart = useMemo(
    () => getAutostartState(location.state, chatId),
    [chatId, location.state],
  )

  const {
    data: messages,
    isLoading,
    isError,
  } = trpc.message.list.useQuery({ chatId }, { enabled: !!chatId })

  const visibleMessages = useMemo(() => {
    if (!messages) return []
    if (streamState?.status !== "STREAMING") return messages

    return messages.filter(
      (message) =>
        !(message.role === "ASSISTANT" && message.status === "STREAMING"),
    )
  }, [messages, streamState?.status])

  const { data: aiCatalog } = trpc.ai.catalog.useQuery(undefined, {
    staleTime: Number.POSITIVE_INFINITY,
  })

  const defaultProviderId = aiCatalog?.defaults.providerId ?? "openrouter"
  const defaultModelId = aiCatalog?.defaults.modelId ?? "openai/gpt-4o-mini"

  const [providerId, setProviderId] = useState<string>(defaultProviderId)
  const [modelId, setModelId] = useState<string>(defaultModelId)

  useEffect(() => {
    if (autostart) {
      setProviderId(autostart.providerId)
      setModelId(autostart.modelId)
      return
    }

    setProviderId((prev) => prev || defaultProviderId)
    setModelId((prev) => prev || defaultModelId)
  }, [autostart, defaultModelId, defaultProviderId])

  const isStreaming = streamState?.status === "STREAMING"

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally re-run when messages length changes to scroll to new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [visibleMessages.length, streamState?.content.length])

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
      eventSourceRef.current = null
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">Failed to load messages</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {visibleMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {visibleMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {streamState && (
              <StreamingAssistantBubble
                assistantMessageId={streamState.assistantMessageId}
                content={streamState.content}
                startedAt={streamState.startedAt}
                errorMessage={streamState.errorMessage}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <MessageComposer
        chatId={chatId}
        autostart={autostart}
        onAutostartConsumed={() =>
          navigate({
            to: "/chats/$chatId",
            params: { chatId },
            replace: true,
            state: {},
          })
        }
        providerId={providerId}
        modelId={modelId}
        models={aiCatalog?.models ?? []}
        providers={aiCatalog?.providers ?? []}
        isStreaming={isStreaming}
        onProviderChange={setProviderId}
        onModelChange={setModelId}
        onStreamStart={(assistantMessageId) => {
          setStreamState({
            assistantMessageId,
            content: "",
            status: "STREAMING",
            errorMessage: null,
            startedAt: new Date().toISOString(),
          })
        }}
        onDelta={(delta) => {
          setStreamState((prev) => {
            if (!prev) return prev
            if (prev.status !== "STREAMING") return prev
            return { ...prev, content: prev.content + delta }
          })
        }}
        onStreamDone={() => {
          setStreamState(null)
        }}
        onStreamError={(message) => {
          setStreamState((prev) => {
            const fallback = {
              assistantMessageId: crypto.randomUUID(),
              content: "",
              status: "FAILED" as const,
              errorMessage: message,
              startedAt: new Date().toISOString(),
            }

            if (!prev) return fallback
            return { ...prev, status: "FAILED", errorMessage: message }
          })
        }}
        eventSourceRef={eventSourceRef}
      />
    </div>
  )
}

function MessageBubble({
  message,
}: {
  message: {
    id: string
    role: string
    content: string
    createdAt: string
  }
}) {
  const isUser = message.role === "USER"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            "mt-1 text-xs",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}

function StreamingAssistantBubble({
  assistantMessageId,
  content,
  startedAt,
  errorMessage,
}: {
  assistantMessageId: string
  content: string
  startedAt: string
  errorMessage: string | null
}) {
  const showError = errorMessage && errorMessage.length > 0

  return (
    <div className="flex justify-start" key={assistantMessageId}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2",
          showError
            ? "border border-destructive bg-destructive/5 text-foreground"
            : "bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">
          {content.length > 0 ? content : "…"}
        </p>
        {showError && (
          <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(startedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}

function MessageComposer({
  chatId,
  autostart,
  onAutostartConsumed,
  providerId,
  modelId,
  providers,
  models,
  isStreaming,
  onProviderChange,
  onModelChange,
  onStreamStart,
  onDelta,
  onStreamDone,
  onStreamError,
  eventSourceRef,
}: {
  chatId: string
  autostart?: AutostartState | null
  onAutostartConsumed?: () => void
  providerId: string
  modelId: string
  providers: ReadonlyArray<string>
  models: ReadonlyArray<{
    id: string
    providerId: string
    label: string
    supportsVision: boolean
    supportsImageGen: boolean
  }>
  isStreaming: boolean
  onProviderChange: (providerId: string) => void
  onModelChange: (modelId: string) => void
  onStreamStart: (assistantMessageId: string) => void
  onDelta: (delta: string) => void
  onStreamDone: () => void
  onStreamError: (message: string) => void
  eventSourceRef: React.MutableRefObject<EventSource | null>
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autostartHandledRef = useRef<string | null>(null)
  const utils = trpc.useUtils()

  const apiUrl = useMemo(
    () => import.meta.env.VITE_API_URL ?? "http://localhost:3000",
    [],
  )

  const createMessage = trpc.message.create.useMutation()

  const openStream = useCallback(
    (params: {
      chatId: string
      userMessageId: string
      providerId: string
      modelId: string
    }) => {
      const streamUrl = new URL(`${apiUrl}/api/ai/stream`)
      streamUrl.searchParams.set("chatId", params.chatId)
      streamUrl.searchParams.set("userMessageId", params.userMessageId)
      streamUrl.searchParams.set("providerId", params.providerId)
      streamUrl.searchParams.set("modelId", params.modelId)

      eventSourceRef.current?.close()

      const eventSource = new EventSource(streamUrl.toString(), {
        withCredentials: true,
      })
      eventSourceRef.current = eventSource

      eventSource.addEventListener("delta", (event) => {
        if (!(event instanceof MessageEvent)) return
        onDelta(event.data)
      })

      eventSource.addEventListener("done", (event) => {
        if (!(event instanceof MessageEvent)) return

        eventSource.close()
        eventSourceRef.current = null

        onStreamDone()
        utils.message.list.invalidate({ chatId: params.chatId })
        utils.chat.list.invalidate()
      })

      eventSource.addEventListener("error", (event) => {
        // Connection-level error (no payload) OR server-sent `event: error`
        const payload =
          event instanceof MessageEvent && typeof event.data === "string"
            ? event.data
            : null

        eventSource.close()
        eventSourceRef.current = null

        try {
          if (payload) {
            const parsed = JSON.parse(payload) as { message?: string }
            onStreamError(parsed.message ?? "Streaming failed")
          } else {
            onStreamError("Connection lost while streaming")
          }
        } catch {
          onStreamError("Streaming failed")
        } finally {
          utils.message.list.invalidate({ chatId: params.chatId })
          utils.chat.list.invalidate()
        }
      })
    },
    [apiUrl, eventSourceRef, onDelta, onStreamDone, onStreamError, utils],
  )

  useEffect(() => {
    if (!autostart) return
    if (autostartHandledRef.current === autostart.userMessageId) return
    if (isStreaming || createMessage.isPending) return

    autostartHandledRef.current = autostart.userMessageId

    const assistantMessageId = crypto.randomUUID()
    onStreamStart(assistantMessageId)

    openStream({
      chatId,
      userMessageId: autostart.userMessageId,
      providerId: autostart.providerId,
      modelId: autostart.modelId,
    })

    onAutostartConsumed?.()
  }, [
    autostart,
    chatId,
    createMessage.isPending,
    isStreaming,
    onAutostartConsumed,
    onStreamStart,
    openStream,
  ])

  const handleSubmit = () => {
    const content = textareaRef.current?.value.trim()
    if (!content || createMessage.isPending || isStreaming) return

    createMessage
      .mutateAsync({ chatId, content })
      .then((newMessage) => {
        utils.message.list.setData({ chatId }, (old) => {
          if (!old) return [newMessage]
          return [...old, newMessage]
        })

        if (textareaRef.current) {
          textareaRef.current.value = ""
          textareaRef.current.style.height = "auto"
        }

        const assistantMessageId = crypto.randomUUID()
        onStreamStart(assistantMessageId)

        openStream({
          chatId,
          userMessageId: newMessage.id,
          providerId,
          modelId,
        })
      })
      .catch((error) => {
        onStreamError(error instanceof Error ? error.message : "Failed to send")
      })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter inserts newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={providerId}
            onChange={(e) => onProviderChange(e.target.value)}
            disabled={isStreaming || providers.length <= 1}
          >
            {providers.length > 0 ? (
              providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider === "openrouter" ? "OpenRouter" : provider}
                </option>
              ))
            ) : (
              <option value="openrouter">OpenRouter</option>
            )}
          </select>

          <select
            className="h-9 min-w-[11rem] flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={modelId}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={isStreaming || models.length === 0}
          >
            {models.length > 0 ? (
              models
                .filter((m) => m.providerId === providerId)
                .map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))
            ) : (
              <option value="openai/gpt-4o-mini">GPT-4o mini</option>
            )}
          </select>
        </div>

        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            rows={1}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={createMessage.isPending || isStreaming}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            isLoading={createMessage.isPending || isStreaming}
            disabled={createMessage.isPending || isStreaming}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
