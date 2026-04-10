import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useUIStore } from "../state/uiStore";

function toolConfig(pathname: string): { placeholder?: string } {
  if (pathname.startsWith("/cards")) {
    return { placeholder: "Search Atelier..." };
  }
  if (pathname.startsWith("/board")) {
    return { placeholder: "Search boards..." };
  }
  if (pathname.startsWith("/runs")) {
    return { placeholder: "Search workspace..." };
  }
  if (pathname.startsWith("/sequencer")) {
    return { placeholder: "Search components..." };
  }
  return {};
}

export function AppShell() {
  const location = useLocation();
  const selectedCardId = useUIStore((state) => state.selectedCardId);
  const selectedRunId = useUIStore((state) => state.selectedRunId);
  const tools = toolConfig(location.pathname);
  const navItems = [
    { to: "/cards", label: "Cards" },
    { to: "/board", label: "Board" },
    { to: "/runs", label: "Runs" },
    { to: selectedRunId ? `/inspector/run/${selectedRunId}` : selectedCardId ? `/inspector/card/${selectedCardId}` : "/inspector", label: "Inspector" },
    { to: "/sequencer", label: "Sequencer" },
    { to: "/prompt-reforger", label: "Prompt Reforger" },
  ];

  return (
    <div className="mock-shell">
      <header className="mock-topbar">
        <div className="mock-topbar-left">
          <span className="mock-brand">Orket</span>
          <nav className="mock-topnav" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `mock-topnav-link ${isActive ? "mock-topnav-link-active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mock-topbar-tools">
          {tools.placeholder && (
            <label className="mock-search" aria-label="Workspace search">
              <span className="material-symbols-outlined">search</span>
              <input type="search" value="" readOnly placeholder={tools.placeholder} />
            </label>
          )}
          <button className="mock-icon-button" type="button" aria-label="Settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button className="mock-icon-button" type="button" aria-label="Help">
            <span className="material-symbols-outlined">help</span>
          </button>
          <div className="mock-avatar" aria-label="Workspace profile">
            OU
          </div>
        </div>
      </header>

      <main className="mock-shell-main">
        <Outlet />
      </main>
    </div>
  );
}
