import { useLocation } from "@tanstack/react-router";
import { useAuth } from "../../contexts/auth-context";
import { useTopbarActionsSlot } from "../../contexts/topbar-actions-context";

const pathLabels: Record<string, string> = {
  "": "Finance",
  budget: "Finance",
  master: "Master Budget",
  monthly: "Monthly Budgets",
  "pre-registered": "Pre-registered Entries",
  tags: "Tags",
  export: "Export",
};

function getGreeting(hour: number): string {
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

function formatDate(): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments
    .map((seg) => pathLabels[seg] ?? seg)
    .filter((label, i, arr) => arr.indexOf(label) === i); // dedupe "Finance"

  if (crumbs.length === 0) {
    return (
      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
        Finance
      </span>
    );
  }

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 15, fontWeight: 400, color: "var(--text-3)" }}>
        Finance
      </span>
      {crumbs.map((crumb, i) => (
        <span
          key={crumb}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span style={{ opacity: 0.4, color: "var(--text-3)", fontSize: 15 }}>
            ›
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: i === crumbs.length - 1 ? 600 : 400,
              color: i === crumbs.length - 1 ? "var(--text)" : "var(--text-3)",
            }}
          >
            {crumb}
          </span>
        </span>
      ))}
    </span>
  );
}

export function Topbar() {
  const { user } = useAuth();
  const actions = useTopbarActionsSlot();
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "";

  const hour = new Date().getHours();

  return (
    <header
      className="topbar"
      style={{
        position: "fixed",
        top: 0,
        left: 56,
        right: 0,
        height: 54,
        zIndex: 100,
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {isDashboard ? (
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
            {getGreeting(hour)}
            {displayName ? `, ${displayName}` : ""} · {formatDate()}
          </span>
        ) : (
          <Breadcrumb pathname={location.pathname} />
        )}
      </div>
      {actions && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      )}
      <style>{`
        @media (max-width: 767px) {
          .topbar { left: 0 !important; }
        }
      `}</style>
    </header>
  );
}
