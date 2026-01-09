import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { GoogleIcon } from "../components/icons/google";
import { Logo } from "../components/icons/logo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { signIn } from "../lib/auth-client";
import { cn } from "../lib/utils";

interface LoginPageProps {
  onNavigateToSignup?: () => void;
}

export function LoginPage({ onNavigateToSignup }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { error } = await signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || "Invalid email or password");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      });
    } catch {
      setError("Failed to sign in with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-8">
      {/* Card Container */}
      <div className="w-full max-w-sm space-y-8">
        {/* Logo & Header */}
        <div className="flex flex-col items-center space-y-4 text-center">
          <Logo className="h-20 w-20" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome to
            </h1>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Ask Cosmos.
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Sign up or Log in to continue.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
          {/* Error Alert */}
          {error && (
            <div
              className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              icon={<Mail className="h-5 w-5" />}
              error={fieldErrors.email}
              disabled={isLoading || isGoogleLoading}
              autoComplete="email"
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              icon={<Lock className="h-5 w-5" />}
              error={fieldErrors.password}
              disabled={isLoading || isGoogleLoading}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              isLoading={isLoading}
              disabled={isGoogleLoading}
            >
              Continue with Email
            </Button>
          </form>

          {/* Google Sign In */}
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              disabled={isLoading}
            >
              {!isGoogleLoading && <GoogleIcon className="h-5 w-5" />}
              Continue with Google
            </Button>
          </div>

          {/* Forgot Password */}
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onNavigateToSignup}
            className={cn(
              "font-semibold text-primary hover:text-primary/90",
              "underline-offset-4 hover:underline",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "rounded-sm",
            )}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
