import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { httpBatchLink } from "@trpc/client"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { trpc } from "./lib/trpc"
import { routeTree } from "./routeTree.gen"

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
  interface HistoryState {
    newChatNonce?: string
  }
}

const queryClient = new QueryClient()

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000"
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${apiUrl}/api/trpc`,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: "include" })
      },
    }),
  ],
})

const rootElement = document.getElementById("root")
if (!rootElement) {
  console.error("Failed to find the root element")
  throw new Error("Failed to find the root element")
}

createRoot(rootElement).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
)
