import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { SignupPage } from "../pages/signup"

export const Route = createFileRoute("/signup")({
  component: SignupRoute,
})

function SignupRoute() {
  const navigate = useNavigate()

  return <SignupPage onNavigateToLogin={() => navigate({ to: "/login" })} />
}
