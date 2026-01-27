export const COLORS: Record<string, string> = {
  HRMS: "#f97316",
  ATS: "#10b981",
  CRM: "#3b82f6",
  Projects: "#ec4899",
  AI: "#8b5cf6",
  Core: "#eab308",
  Comm: "#6366f1",
  Utils: "#64748b",
  Other: "#94a3b8",
};

export const COMPLEXITY_TYPES = {
  high: { label: "High Risk", color: "#ef4444" },
  normal: { label: "Normal", color: "#94a3b8" },
};

export const ARCHETYPES = {
  Controller: { label: "Controllers", icon: "gamepad" }, // using lucide names later
  Service: { label: "Services", icon: "cogs" },
  Model: { label: "Models / Entities", icon: "database" },
};

export const TOPOLOGY_TYPES = {
  orphan: { label: "Orphans (Unused)", icon: "unlink" },
  hub: { label: "Hubs (>5 Links)", icon: "network" },
  normal: { label: "Standard Nodes", icon: "circle" },
};
