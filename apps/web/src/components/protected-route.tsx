import { Navigate } from "@tanstack/react-router";
import { useAuth } from "../contexts/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
