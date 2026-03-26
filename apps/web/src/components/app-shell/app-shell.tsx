import { BottomTabBar } from "./bottom-tab-bar";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <Sidebar />
      <Topbar />
      <BottomTabBar />
      <main
        className="app-content"
        style={{
          marginLeft: 56,
          marginTop: 54,
          padding: "24px 28px 48px",
          minHeight: "calc(100vh - 54px)",
          background: "var(--bg)",
        }}
      >
        {children}
      </main>
      <style>{`
        @media (max-width: 767px) {
          .app-content {
            margin-left: 0 !important;
            padding-bottom: 106px !important;
          }
        }
      `}</style>
    </>
  );
}
