import type { AppRouter } from "@ai-chatbot/api/trpc"
import { createTRPCReact } from "@trpc/react-query"

export const trpc = createTRPCReact<AppRouter>()
