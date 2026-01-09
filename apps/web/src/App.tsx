import { useState } from "react";
import { signOut, useSession } from "./lib/auth-client";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";

type AuthPage = "login" | "signup";

function App() {
  const { data: session, isPending } = useSession();
  const [authPage, setAuthPage] = useState<AuthPage>("login");

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If user is authenticated, show the main app
  if (session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome, {session.user.name || session.user.email}!
          </h1>
          <p className="text-muted-foreground">
            You are signed in to Ask Cosmos.
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Show auth pages for unauthenticated users
  if (authPage === "login") {
    return <LoginPage onNavigateToSignup={() => setAuthPage("signup")} />;
  }

  return <SignupPage onNavigateToLogin={() => setAuthPage("login")} />;
}

export default App;
