import { Link } from "react-router-dom";

type CompactRailKey = "flows" | "epics" | "artifacts" | "library" | "status" | "history" | "palette";

interface CompactRailProps {
  activeKey: CompactRailKey;
}

const PRIMARY_ITEMS: Array<{ key: CompactRailKey; label: string; icon: string; to: string }> = [
  { key: "flows", label: "Flows", icon: "account_tree", to: "/sequencer" },
  { key: "epics", label: "Epics", icon: "auto_stories", to: "/board" },
  { key: "artifacts", label: "Artifacts", icon: "history_edu", to: "/inspector" },
  { key: "library", label: "Library", icon: "shelves", to: "/cards" },
];

const FOOTER_ITEMS: Array<{ key: CompactRailKey; label: string; icon: string; to: string }> = [
  { key: "status", label: "Flow status", icon: "query_stats", to: "/board" },
  { key: "history", label: "Run history", icon: "database", to: "/runs" },
  { key: "palette", label: "Palette", icon: "grid_view", to: "/prompt-reforger" },
];

function RailLink({
  active,
  icon,
  label,
  to,
}: {
  active: boolean;
  icon: string;
  label: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className={`mock-compact-rail-link ${active ? "mock-compact-rail-link-active" : ""}`}
      aria-current={active ? "page" : undefined}
      title={label}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </Link>
  );
}

export function CompactRail({ activeKey }: CompactRailProps) {
  return (
    <aside className="mock-compact-rail" aria-label="Workspace rail">
      <div className="mock-compact-rail-group">
        {PRIMARY_ITEMS.map((item) => (
          <RailLink
            key={item.key}
            active={item.key === activeKey}
            icon={item.icon}
            label={item.label}
            to={item.to}
          />
        ))}
      </div>
      <div className="mock-compact-rail-group mock-compact-rail-group-footer">
        {FOOTER_ITEMS.map((item) => (
          <RailLink
            key={item.key}
            active={item.key === activeKey}
            icon={item.icon}
            label={item.label}
            to={item.to}
          />
        ))}
      </div>
    </aside>
  );
}
