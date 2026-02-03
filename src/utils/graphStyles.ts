import cytoscape from "cytoscape";
import { COLORS as DEFAULT_COLORS } from "./constants";

export const getGraphStyles = (
  isDark: boolean,
  customColors: Record<string, string> = {},
): Array<any> => {
  const bg = isDark ? "#0f172a" : "#f1f5f9";
  const fg = isDark ? "#f1f5f9" : "#0f172a";
  const highlightColor = "#ef4444";

  const COLORS = { ...DEFAULT_COLORS, ...customColors };
  const fallbackColor = COLORS.Other || "#94a3b8";

  return [
    {
      selector: "node[?isGroup]",
      style: {
        shape: "round-rectangle",
        "background-opacity": 0,
        "border-width": 2,
        "border-color": ((e: any) =>
          COLORS[e.data("module")] || fallbackColor) as any,
        "border-style": "dashed",
        label: "data(label)",
        "font-size": 40,
        "font-weight": "bold",
        color: ((e: any) => COLORS[e.data("module")] || fallbackColor) as any,
        "text-valign": "top",
        "text-margin-y": -20,
        padding: 40,
        "text-background-opacity": 0,
      },
    },
    {
      selector: "node[!isGroup]",
      style: {
        label: "data(label)",
        "text-valign": "bottom",
        "text-margin-y": 6,
        color: fg,
        "font-size": 14,
        "font-weight": "bold",
        width: "mapData(weight, 0, 100, 40, 100)",
        height: "mapData(weight, 0, 100, 40, 100)",
        "background-color": ((e: any) =>
          COLORS[e.data("module")] || fallbackColor) as any,
        "text-background-color": bg,
        "text-background-opacity": 0.8,
        "text-background-padding": 2,
        "text-background-shape": "round-rectangle",
      },
    },
    {
      selector: "node[archetype = 'Feature']",
      style: {
        shape: "round-rectangle",
        width: 140,
        height: 32,
        "font-size": 11,
        "font-weight": "normal",
        "text-valign": "center",
        "text-halign": "center",
        "text-margin-y": 0,
        "background-opacity": 0.9,
        "border-width": 1,
        "border-style": "solid",
        "border-color": fg,
        "text-background-opacity": 0,
        color: isDark ? "#fff" : "#000",
      },
    },
    {
      selector: "node[complexity='high']",
      style: {
        "border-width": 4,
        "border-color": "#ef4444",
        "border-style": "double",
      },
    },
    {
      selector: "edge",
      style: {
        width: 1,
        "line-color": isDark ? "#475569" : "#cbd5e1",
        "curve-style": "bezier",
        opacity: 0.4,
        "target-arrow-shape": "triangle",
        "target-arrow-color": isDark ? "#475569" : "#cbd5e1",
        "arrow-scale": 0.8,
      },
    },
    {
      selector: "edge[type='inheritance']",
      style: {
        width: 3,
        "line-color": isDark ? "#94a3b8" : "#64748b",
        "target-arrow-color": isDark ? "#94a3b8" : "#64748b",
      },
    },
    {
      selector: "edge[type='usage']",
      style: {
        "line-style": "dashed",
        opacity: 0.6,
      },
    },
    {
      selector: ".dimmed",
      style: {
        opacity: 0.1,
        label: "",
      },
    },
    {
      selector: ".highlight",
      style: {
        "z-index": 999,
        opacity: 1,
        color: highlightColor,
        "text-background-opacity": 1,
      },
    },
    {
      selector: "edge.highlight",
      style: {
        "line-color": highlightColor,
        "target-arrow-color": highlightColor,
        width: 4,
        opacity: 1,
        "arrow-scale": 1.5,
        "z-index": 999,
      },
    },
    {
      selector: ":selected",
      style: {
        "border-width": 4,
        "border-color": "#fff",
        "border-opacity": 0.8,
      },
    },
  ];
};
