import {
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import {
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Plus,
  Trash2,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
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
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <h1 className="text-lg font-semibold text-foreground">
            {session.user.name || session.user.email}
          </h1>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function ChatSidebar() {
  const navigate = useNavigate()

  const { data: chats, isLoading } = trpc.chat.list.useQuery()

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar:collapsed") === "true"
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("sidebar:collapsed", String(isCollapsed))
    } catch {
      // ignore
    }
  }, [isCollapsed])

  const handleNewChat = () => {
    navigate({ to: "/", state: { newChatNonce: crypto.randomUUID() } })
  }

  const sidebarWidthClass = isCollapsed ? "w-14" : "w-64"

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-[width] duration-200",
        sidebarWidthClass,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 p-3",
          isCollapsed && "flex-col p-2",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed((prev) => !prev)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(!isCollapsed && "order-2")}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>

        <Button
          className={cn(
            "w-full justify-start gap-2",
            isCollapsed && "w-10 justify-center px-0",
            !isCollapsed && "order-1",
          )}
          onClick={handleNewChat}
          size={isCollapsed ? "icon" : "default"}
          title={isCollapsed ? "New chat" : undefined}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && "New Chat"}
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
              <ChatListItem
                key={chat.id}
                chat={chat}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>
        )}
      </div>
    </aside>
  )
}

function ChatListItem({
  chat,
  isCollapsed,
}: {
  chat: {
    id: string
    title: string
    createdAt: string
    pinnedAt: string | null
    lastMessageAt: string | null
  }
  isCollapsed: boolean
}) {
  const utils = trpc.useUtils()
  const navigate = useNavigate()
  const location = useLocation()

  // Extract chatId from pathname if we're on a chat route
  const match = location.pathname.match(/^\/chats\/([^/]+)$/)
  const currentChatId = match ? match[1] : null
  const isActive = currentChatId === chat.id
  const isPinned = chat.pinnedAt != null

  const pinChat = trpc.chat.pin.useMutation({
    onSuccess: () => utils.chat.list.invalidate(),
  })

  const unpinChat = trpc.chat.unpin.useMutation({
    onSuccess: () => utils.chat.list.invalidate(),
  })

  const deleteChat = trpc.chat.delete.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate()
      if (isActive) {
        navigate({ to: "/" })
      }
    },
  })

  const title = useMemo(() => chat.title || "Untitled chat", [chat.title])

  return (
    <div
      className={cn(
        "group flex select-none items-center gap-2 rounded-md text-left text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        isCollapsed ? "px-2 py-2" : "px-3 py-2",
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          navigate({ to: "/chats/$chatId", params: { chatId: chat.id } })
        }}
        className={cn(
          "flex min-w-0 flex-1 cursor-pointer select-none items-center gap-2 text-left",
          isCollapsed && "justify-center",
        )}
        title={isCollapsed ? title : undefined}
      >
        <MessageSquare className="h-4 w-4 shrink-0" />
        {!isCollapsed && <span className="truncate select-none">{title}</span>}
      </button>

      {!isCollapsed && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (isPinned) {
                unpinChat.mutate({ chatId: chat.id })
              } else {
                pinChat.mutate({ chatId: chat.id })
              }
            }}
            disabled={pinChat.isPending || unpinChat.isPending}
            title={isPinned ? "Unpin" : "Pin"}
            className={cn(
              "transition-opacity",
              isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <Pin
              className={cn(
                "h-4 w-4",
                isPinned ? "fill-current" : "opacity-70",
              )}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              deleteChat.mutate({ chatId: chat.id })
            }}
            disabled={deleteChat.isPending}
            title="Delete"
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4 opacity-70" />
          </Button>
        </div>
      )}
    </div>
  )
}
