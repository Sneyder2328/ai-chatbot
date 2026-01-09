import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { trpc } from "./lib/trpc"

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
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
)
