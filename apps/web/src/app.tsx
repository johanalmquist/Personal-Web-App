import { useAuth } from "./contexts/auth-context";
import { LoginPage } from "./pages/login";

export function App() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <LoginPage />;
  }

  // Placeholder until JOH-25 adds the app shell and routing
  return (
    <div style={{ padding: "40px", color: "var(--text)" }}>
      <h1>Welcome</h1>
    </div>
  );
}
