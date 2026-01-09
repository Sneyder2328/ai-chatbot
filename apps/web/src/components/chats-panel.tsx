import { trpc } from "../lib/trpc"
import { Button } from "./ui/button"

export function ChatsPanel() {
  const utils = trpc.useUtils()

  const { data: chats, isLoading, isError, error } = trpc.chat.list.useQuery()

  const createChat = trpc.chat.create.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>Failed to load chats</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Button
        onClick={() => createChat.mutate({})}
        isLoading={createChat.isPending}
      >
        New Chat
      </Button>

      {chats.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No chats yet. Create one to get started!
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {chats.map((chat) => (
            <li
              key={chat.id}
              className="rounded-md border border-border bg-card p-3 transition-colors hover:bg-accent"
            >
              <p className="font-medium text-card-foreground">{chat.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(chat.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
