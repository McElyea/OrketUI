import type { PropsWithChildren } from "react";

interface StatusPillProps extends PropsWithChildren {
  tone: "emerald" | "amber" | "rose" | "slate";
}

export function StatusPill({ tone, children }: StatusPillProps) {
  return <span className={`status-pill status-pill-${tone}`}>{children}</span>;
}
