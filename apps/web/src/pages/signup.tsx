import { Lock, Mail, User } from "lucide-react"
import { useState } from "react"
import { GoogleIcon } from "../components/icons/google"
import { Logo } from "../components/icons/logo"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { signIn, signUp } from "../lib/auth-client"
import { cn } from "../lib/utils"

interface SignupPageProps {
  onNavigateToLogin?: () => void
}

export function SignupPage({ onNavigateToLogin }: SignupPageProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  const validateForm = () => {
    const errors: {
      name?: string
      email?: string
      password?: string
      confirmPassword?: string
    } = {}

    if (!name.trim()) {
      errors.name = "Name is required"
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters"
    }

    if (!email) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!password) {
      errors.password = "Password is required"
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    }

    if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const { error } = await signUp.email({
        email,
        password,
        name: name.trim(),
      })

      if (error) {
        setError(error.message || "Failed to create account")
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError(null)
    setIsGoogleLoading(true)
    try {
      await signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      })
    } catch {
      setError("Failed to sign up with Google. Please try again.")
      setIsGoogleLoading(false)
    }
  }

  const clearFieldError = (field: keyof typeof fieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

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
            Create an account to get started.
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
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                clearFieldError("name")
              }}
              icon={<User className="h-5 w-5" />}
              error={fieldErrors.name}
              disabled={isLoading || isGoogleLoading}
              autoComplete="name"
            />

            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearFieldError("email")
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
                setPassword(e.target.value)
                clearFieldError("password")
              }}
              icon={<Lock className="h-5 w-5" />}
              error={fieldErrors.password}
              disabled={isLoading || isGoogleLoading}
              autoComplete="new-password"
            />

            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                clearFieldError("confirmPassword")
              }}
              icon={<Lock className="h-5 w-5" />}
              error={fieldErrors.confirmPassword}
              disabled={isLoading || isGoogleLoading}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              isLoading={isLoading}
              disabled={isGoogleLoading}
            >
              Create Account
            </Button>
          </form>

          {/* Google Sign Up */}
          <div className="mt-4">
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
          </div>

          {/* Terms */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By signing up, you agree to our{" "}
            <a
              href="/terms"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Terms
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
              "font-semibold text-primary hover:text-primary/90",
              "underline-offset-4 hover:underline",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "rounded-sm",
            )}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  )
}

export default SignupPage
