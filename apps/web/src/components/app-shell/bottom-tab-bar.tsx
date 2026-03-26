import {
  IconHome,
  IconLayoutDashboard,
  IconPlus,
  IconReceipt,
  IconUser,
} from "@tabler/icons-react";
import { Link, useRouterState } from "@tanstack/react-router";

const tabs = [
  { icon: IconHome, label: "Home", to: "/" as const },
  {
    icon: IconLayoutDashboard,
    label: "Budget",
    to: "/budget/monthly" as const,
  },
] as const;

const rightTabs = [
  { icon: IconReceipt, label: "Log", to: "/budget/monthly" as const },
  { icon: IconUser, label: "Profile", to: "/" as const },
] as const;

function TabButton({
  icon: Icon,
  label,
  to,
  isActive,
}: {
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  label: string;
  to: string;
  isActive: boolean;
}) {
  return (
    <Link
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        flex: 1,
        color: isActive ? "var(--accent-soft)" : "var(--text-3)",
        textDecoration: "none",
        paddingBottom: 4,
      }}
      to={to}
    >
      <Icon size={20} stroke={1.8} />
      <span style={{ fontSize: 9, fontWeight: 600 }}>{label}</span>
    </Link>
  );
}

export function BottomTabBar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav
      className="bottom-tab-bar"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 58,
        zIndex: 200,
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
      }}
    >
      {tabs.map((tab) => (
        <TabButton
          icon={tab.icon}
          isActive={
            tab.to === "/"
              ? currentPath === "/"
              : currentPath.startsWith(tab.to)
          }
          key={tab.label}
          label={tab.label}
          to={tab.to}
        />
      ))}

      {/* Center FAB */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <button
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "var(--accent)",
            boxShadow: "0 4px 16px rgba(66,99,235,.5)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
          type="button"
        >
          <IconPlus size={22} stroke={2} />
        </button>
      </div>

      {rightTabs.map((tab) => (
        <TabButton
          icon={tab.icon}
          isActive={
            tab.to === "/"
              ? currentPath === "/"
              : currentPath.startsWith(tab.to)
          }
          key={tab.label}
          label={tab.label}
          to={tab.to}
        />
      ))}

      <style>{`
        @media (min-width: 768px) {
          .bottom-tab-bar { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
