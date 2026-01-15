import { createFileRoute } from "@tanstack/react-router"
import { Send } from "lucide-react"
import { useEffect, useRef } from "react"
import { Button } from "../../components/ui/button"
import { trpc } from "../../lib/trpc"
import { cn } from "../../lib/utils"

export const Route = createFileRoute("/_authenticated/chats/$chatId")({
  component: ChatView,
})

function ChatView() {
  const { chatId } = Route.useParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    data: messages,
    isLoading,
    isError,
  } = trpc.message.list.useQuery({ chatId }, { enabled: !!chatId })

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally re-run when messages length changes to scroll to new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages?.length])

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
        {messages?.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages?.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <MessageComposer chatId={chatId} />
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

function MessageComposer({ chatId }: { chatId: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const utils = trpc.useUtils()

  const createMessage = trpc.message.create.useMutation({
    onSuccess: () => {
      // Invalidate both message list and chat list (to update lastMessageAt order)
      utils.message.list.invalidate({ chatId })
      utils.chat.list.invalidate()
      // Clear textarea
      if (textareaRef.current) {
        textareaRef.current.value = ""
        textareaRef.current.style.height = "auto"
      }
    },
  })

  const handleSubmit = () => {
    const content = textareaRef.current?.value.trim()
    if (!content || createMessage.isPending) return
    createMessage.mutate({ chatId, content })
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
      <div className="mx-auto flex max-w-3xl gap-2">
        <textarea
          ref={textareaRef}
          placeholder="Type a message..."
          className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={createMessage.isPending}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          isLoading={createMessage.isPending}
          disabled={createMessage.isPending}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  )
}
