import { createFileRoute } from "@tanstack/react-router"
import { MessageSquarePlus } from "lucide-react"

export const Route = createFileRoute("/_authenticated/")({
  component: IndexPage,
})

function IndexPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <MessageSquarePlus className="mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        Welcome to Ask Cosmos
      </h2>
      <p className="max-w-md text-muted-foreground">
        Select a chat from the sidebar or create a new one to get started.
      </p>
    </div>
  )
}
