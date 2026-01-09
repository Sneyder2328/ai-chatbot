import { useState } from "react"
import { ChatsPanel } from "./components/chats-panel"
import { signOut, useSession } from "./lib/auth-client"
import { LoginPage } from "./pages/login"
import { SignupPage } from "./pages/signup"

type AuthPage = "login" | "signup"

function App() {
  const { data: session, isPending } = useSession()
  const [authPage, setAuthPage] = useState<AuthPage>("login")

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // If user is authenticated, show the main app
  if (session?.user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">
              Welcome, {session.user.name || session.user.email}!
            </h1>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1">
          <ChatsPanel />
        </main>
      </div>
    )
  }

  // Show auth pages for unauthenticated users
  if (authPage === "login") {
    return <LoginPage onNavigateToSignup={() => setAuthPage("signup")} />
  }

  return <SignupPage onNavigateToLogin={() => setAuthPage("login")} />
}

export default App
