import {
  IconCalendar,
  IconClock,
  IconDeviceDesktopAnalytics,
  IconLayoutDashboard,
  IconReceipt,
  IconSettings,
  IconTag,
} from "@tabler/icons-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../../contexts/auth-context";

const navItems = [
  { icon: IconLayoutDashboard, label: "Dashboard", to: "/" as const },
  {
    icon: IconDeviceDesktopAnalytics,
    label: "Master Budget",
    to: "/budget/master" as const,
  },
  {
    icon: IconCalendar,
    label: "Monthly Budgets",
    to: "/budget/monthly" as const,
  },
  {
    icon: IconReceipt,
    label: "Transactions",
    to: "/budget/monthly" as const,
  },
  {
    icon: IconClock,
    label: "Pre-registered",
    to: "/budget/pre-registered" as const,
  },
  { icon: IconTag, label: "Tags", to: "/budget/tags" as const },
] as const;

function NavButton({
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
  const [hovered, setHovered] = useState(false);

  let navBg = "transparent";
  if (isActive) {
    navBg = "var(--accent-bg)";
  } else if (hovered) {
    navBg = "var(--surface-raised)";
  }

  let navColor = "var(--text-3)";
  if (isActive) {
    navColor = "var(--accent-soft)";
  } else if (hovered) {
    navColor = "var(--text-2)";
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
      }}
    >
      {isActive && (
        <div
          style={{
            position: "absolute",
            left: -9,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 18,
            background: "var(--accent)",
            borderRadius: "0 3px 3px 0",
          }}
        />
      )}
      <Link
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 38,
          height: 38,
          borderRadius: "var(--r-sm)",
          background: navBg,
          color: navColor,
          cursor: "pointer",
          border: "none",
          textDecoration: "none",
          transition: "background 0.15s, color 0.15s",
        }}
        to={to}
      >
        <Icon size={18} stroke={1.8} />
      </Link>
      {hovered && (
        <span
          style={{
            position: "absolute",
            left: "calc(100% + 12px)",
            top: "50%",
            transform: "translateY(-50%)",
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text)",
            padding: "5px 10px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--accent), #7048e8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "white",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [settingsHovered, setSettingsHovered] = useState(false);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "U";

  return (
    <aside
      className="sidebar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 56,
        height: "100vh",
        zIndex: 200,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0",
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "var(--r-sm)",
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          color: "white",
          margin: "11px auto 16px",
          flexShrink: 0,
        }}
      >
        J
      </div>

      {/* Nav items */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: 1,
          width: "100%",
          alignItems: "center",
          padding: "0 9px",
        }}
      >
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? currentPath === "/"
              : currentPath.startsWith(item.to);
          return (
            <NavButton
              icon={item.icon}
              isActive={isActive}
              key={item.label}
              label={item.label}
              to={item.to}
            />
          );
        })}
      </nav>

      {/* Bottom section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          paddingBottom: 12,
          paddingTop: 8,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onMouseEnter={() => setSettingsHovered(true)}
            onMouseLeave={() => setSettingsHovered(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: "var(--r-sm)",
              background: settingsHovered
                ? "var(--surface-raised)"
                : "transparent",
              color: settingsHovered ? "var(--text-2)" : "var(--text-3)",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            type="button"
          >
            <IconSettings size={18} stroke={1.8} />
          </button>
          {settingsHovered && (
            <span
              style={{
                position: "absolute",
                left: "calc(100% + 12px)",
                top: "50%",
                transform: "translateY(-50%)",
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text)",
                padding: "5px 10px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                zIndex: 100,
              }}
            >
              Settings
            </span>
          )}
        </div>
        <UserAvatar name={displayName} />
      </div>

      <style>{`
        @media (max-width: 767px) {
          .sidebar { display: none !important; }
        }
      `}</style>
    </aside>
  );
}
