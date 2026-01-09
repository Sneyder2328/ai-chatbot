import { useState } from "react";
import { GoogleIcon } from "../components/icons/google";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { signIn, signUp } from "../lib/auth-client";
import { cn } from "../lib/utils";

interface SignupPageProps {
  onNavigateToLogin?: () => void;
}

export function SignupPage({ onNavigateToLogin }: SignupPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      errors.name = "Name is required";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

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

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
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
      const { error } = await signUp.email({
        email,
        password,
        name: name.trim(),
      });

      if (error) {
        setError(error.message || "Failed to create account");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      });
    } catch {
      setError("Failed to sign up with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  const clearFieldError = (field: keyof typeof fieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started with your free account
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
          {/* Error Alert */}
          {error && (
            <div
              className="mb-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Google Sign Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignUp}
            isLoading={isGoogleLoading}
            disabled={isLoading}
          >
            {!isGoogleLoading && <GoogleIcon className="h-5 w-5" />}
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
              }}
              error={fieldErrors.name}
              disabled={isLoading || isGoogleLoading}
              autoComplete="name"
            />

            <Input
              type="email"
              label="Email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              error={fieldErrors.email}
              disabled={isLoading || isGoogleLoading}
              autoComplete="email"
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              error={fieldErrors.password}
              disabled={isLoading || isGoogleLoading}
              autoComplete="new-password"
            />

            <Input
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError("confirmPassword");
              }}
              error={fieldErrors.confirmPassword}
              disabled={isLoading || isGoogleLoading}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isGoogleLoading}
            >
              Create account
            </Button>
          </form>

          {/* Terms */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{" "}
            <a
              href="/terms"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className={cn(
              "font-medium text-primary hover:text-primary/90",
              "underline-offset-4 hover:underline",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "rounded-sm",
            )}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
