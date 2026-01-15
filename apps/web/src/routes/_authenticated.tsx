import {
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import { MessageSquare, Plus } from "lucide-react"
import { Button } from "../components/ui/button"
import { signOut, useSession } from "../lib/auth-client"
import { trpc } from "../lib/trpc"
import { cn } from "../lib/utils"

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { data: session, isPending: isSessionPending } = useSession()
  const navigate = useNavigate()

  // Show loading state while checking session
  if (isSessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Please sign in to continue
          </p>
          <Button onClick={() => navigate({ to: "/login" })}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <h1 className="text-lg font-semibold text-foreground">
            {session.user.name || session.user.email}
          </h1>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </header>
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function ChatSidebar() {
  const utils = trpc.useUtils()
  const navigate = useNavigate()

  const { data: chats, isLoading } = trpc.chat.list.useQuery()

  const createChat = trpc.chat.create.useMutation({
    onSuccess: (newChat) => {
      utils.chat.list.invalidate()
      navigate({ to: "/chats/$chatId", params: { chatId: newChat.id } })
    },
  })

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      <div className="p-3">
        <Button
          className="w-full justify-start gap-2"
          onClick={() => createChat.mutate({})}
          isLoading={createChat.isPending}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : chats?.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            No chats yet
          </p>
        ) : (
          <nav className="flex flex-col gap-1 p-2">
            {chats?.map((chat) => (
              <ChatListItem key={chat.id} chat={chat} />
            ))}
          </nav>
        )}
      </div>
    </aside>
  )
}

function ChatListItem({
  chat,
}: {
  chat: { id: string; title: string; createdAt: string }
}) {
  const navigate = useNavigate()
  const location = useLocation()

  // Extract chatId from pathname if we're on a chat route
  const match = location.pathname.match(/^\/chats\/([^/]+)$/)
  const currentChatId = match ? match[1] : null
  const isActive = currentChatId === chat.id

  return (
    <button
      type="button"
      onClick={() =>
        navigate({ to: "/chats/$chatId", params: { chatId: chat.id } })
      }
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      <span className="truncate">{chat.title}</span>
    </button>
  )
}
