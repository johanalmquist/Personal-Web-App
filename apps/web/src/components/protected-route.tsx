import { useAuth } from "../contexts/auth-context";
import { LoginPage } from "../pages/login";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    // Prevent flash of login screen while session is being restored
    return null;
  }

  if (!session) {
    // Proper <Navigate to="/login"> wired in JOH-25 when Tanstack Router is added
    return <LoginPage />;
  }

  return <>{children}</>;
}
