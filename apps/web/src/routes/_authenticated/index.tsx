import {
  createFileRoute,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import { MessageSquarePlus, Send } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "../../components/ui/button"
import { trpc } from "../../lib/trpc"

export const Route = createFileRoute("/_authenticated/")({
  component: IndexPage,
})

function getNewChatNonce(state: unknown) {
  if (!state || typeof state !== "object") return "initial"
  const value = (state as { newChatNonce?: unknown }).newChatNonce
  return typeof value === "string" && value.length > 0 ? value : "initial"
}

function IndexPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const utils = trpc.useUtils()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: aiCatalog } = trpc.ai.catalog.useQuery(undefined, {
    staleTime: Number.POSITIVE_INFINITY,
  })

  const defaultProviderId = aiCatalog?.defaults.providerId ?? "openrouter"
  const defaultModelId = aiCatalog?.defaults.modelId ?? "openai/gpt-4o-mini"

  const newChatNonce = useMemo(
    () => getNewChatNonce(location.state),
    [location.state],
  )

  const [providerId, setProviderId] = useState<string | null>(null)
  const [modelId, setModelId] = useState<string | null>(null)

  // Initialize provider/model from catalog defaults once loaded
  useEffect(() => {
    setProviderId((prev) => prev ?? defaultProviderId)
    setModelId((prev) => prev ?? defaultModelId)
  }, [defaultProviderId, defaultModelId])

  // Reset the composer when "New Chat" is clicked (even if already on "/")
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally only reset when newChatNonce changes, not when defaults change
  useEffect(() => {
    setProviderId(defaultProviderId)
    setModelId(defaultModelId)
    setErrorMessage(null)

    const textarea = textareaRef.current
    if (textarea) {
      textarea.value = ""
      textarea.style.height = "auto"
    }
  }, [newChatNonce])

  const createFirstMessage = trpc.message.createInNewChat.useMutation()

  // Use effective values that fall back to defaults when state is null
  const effectiveProviderId = providerId ?? defaultProviderId
  const effectiveModelId = modelId ?? defaultModelId

  const handleSubmit = () => {
    const content = textareaRef.current?.value.trim()
    if (!content || createFirstMessage.isPending) return

    setErrorMessage(null)

    createFirstMessage
      .mutateAsync({
        content,
        providerId: effectiveProviderId,
        modelId: effectiveModelId,
      })
      .then((newMessage) => {
        const chatId = newMessage.chatId

        utils.message.list.setData({ chatId }, [newMessage])
        utils.chat.list.invalidate()

        if (textareaRef.current) {
          textareaRef.current.value = ""
          textareaRef.current.style.height = "auto"
        }

        navigate({
          to: "/chats/$chatId",
          params: { chatId },
        })
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to send",
        )
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
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex h-full flex-col items-center justify-center text-center">
          <MessageSquarePlus className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Start a new chat
          </h2>
          <p className="max-w-md text-muted-foreground">
            Send your first message below to create the conversation.
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-background p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              value={effectiveProviderId}
              onChange={(e) => setProviderId(e.target.value)}
              disabled={
                createFirstMessage.isPending ||
                (aiCatalog?.providers?.length ?? 0) <= 1
              }
            >
              {(aiCatalog?.providers?.length ?? 0) > 0 ? (
                aiCatalog?.providers.map((provider) => (
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
              value={effectiveModelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={
                createFirstMessage.isPending ||
                (aiCatalog?.models?.length ?? 0) === 0
              }
            >
              {(aiCatalog?.models?.length ?? 0) > 0 ? (
                aiCatalog?.models
                  .filter((m) => m.providerId === effectiveProviderId)
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

          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}

          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              placeholder="Type a message..."
              className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={1}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              disabled={createFirstMessage.isPending}
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              isLoading={createFirstMessage.isPending}
              disabled={createFirstMessage.isPending}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
