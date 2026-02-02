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
  Controller: { label: "Controllers", icon: "gamepad" },
  Service: { label: "Services", icon: "cogs" },
  Model: { label: "Models / Entities", icon: "database" },
};

export const TOPOLOGY_TYPES = {
  orphan: { label: "Orphans (Unused)", icon: "unlink" },
  hub: { label: "Hubs (>5 Links)", icon: "network" },
  normal: { label: "Standard Nodes", icon: "circle" },
};

export const PRESET_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
  "#84cc16", "#a855f7", "#64748b", "#d946ef", "#fbbf24",
  "#22c55e", "#0ea5e9", "#e11d48", "#7c3aed", "#f43f5e", 
];