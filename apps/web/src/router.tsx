import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
} from "@tanstack/react-router";
import { AppShell } from "./components/app-shell/app-shell";
import { useAuth } from "./contexts/auth-context";
import { TopbarActionsProvider } from "./contexts/topbar-actions-context";
import { DashboardPage } from "./pages/dashboard";
import { ExportPage } from "./pages/export";
import { LoginPage } from "./pages/login";
import { MasterBudgetPage } from "./pages/master-budget";
import { MonthlyBudgetPage } from "./pages/monthly-budget";
import { MonthlyBudgetDetailPage } from "./pages/monthly-budget-detail";
import { PreRegisteredPage } from "./pages/pre-registered";
import { TagsPage } from "./pages/tags";
import { TransactionsPage } from "./pages/transactions";

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route (public)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Protected layout route (pathless — wraps all protected pages)
const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg)",
          color: "var(--text-3)",
          fontSize: 14,
        }}
      >
        Loading auth…
      </div>
    );
  }

  if (!auth.session) {
    return <Navigate to="/login" />;
  }

  return (
    <TopbarActionsProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </TopbarActionsProvider>
  );
}

// Protected child routes
const dashboardRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/",
  component: DashboardPage,
});

const masterBudgetRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/budget/master",
  component: MasterBudgetPage,
});

const monthlyBudgetRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/budget/monthly",
  component: MonthlyBudgetPage,
});

const monthlyBudgetDetailRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/budget/monthly/$id",
  component: MonthlyBudgetDetailPage,
});

const transactionsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/budget/monthly/$id/transactions",
  component: TransactionsPage,
});

const preRegisteredRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/budget/pre-registered",
  component: PreRegisteredPage,
});

const tagsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/budget/tags",
  component: TagsPage,
});

const exportRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/budget/export",
  component: ExportPage,
});

// Route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedLayoutRoute.addChildren([
    dashboardRoute,
    masterBudgetRoute,
    monthlyBudgetRoute,
    monthlyBudgetDetailRoute,
    transactionsRoute,
    preRegisteredRoute,
    tagsRoute,
    exportRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
