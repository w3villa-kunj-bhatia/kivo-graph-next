"use client";

import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import expandCollapse from "cytoscape-expand-collapse";
import { useGraphStore } from "@/store/useGraphStore";
import { getGraphStyles } from "@/utils/graphStyles";
import { highlightNode, clearHighlights } from "@/utils/graphInteraction";

cytoscape.use(fcose);
if (typeof cytoscape("core", "expandCollapse") === "undefined") {
  cytoscape.use(expandCollapse);
}

export default function GraphCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCy, isDarkMode, openPopup, closePopup, popup } = useGraphStore();
  const cyRef = useRef<cytoscape.Core | null>(null);

  // 1. Initialize Graph
  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      style: getGraphStyles(isDarkMode),
      minZoom: 0.05,
      maxZoom: 3,
      wheelSensitivity: 0.2,
    });

    // Initialize Extension
    (cyRef.current as any).expandCollapse({
      layoutBy: null,
      fisheye: false,
      animate: true,
      undoable: false,
    });

    setCy(cyRef.current);

    // --- EVENT LISTENERS ---

    // Tap on Background: Clear & Close
    cyRef.current.on("tap", (e) => {
      if (e.target === cyRef.current) {
        closePopup(); // This will trigger the cleanup effect below
      }
    });

    // Tap on Node
    cyRef.current.on("tap", "node[!isGroup]", (e) => {
      const node = e.target;
      const d = node.data();

      highlightNode(cyRef.current!, node.id());

      const neighbors = node.neighborhood("node[!isGroup]").map((n: any) => ({
        label: n.data("label"),
        module: n.data("module"),
      }));

      openPopup({
        id: d.id,
        label: d.label,
        fullLabel: d.fullLabel,
        module: d.module,
        connections: node.degree(false),
        neighbors: neighbors,
      });
    });

    return () => {
      if (cyRef.current) cyRef.current.destroy();
    };
  }, [setCy]);

  // 2. THEME FIX: Force update styles when Dark Mode changes
  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.json({ style: getGraphStyles(isDarkMode) } as any);
    }
  }, [isDarkMode]);

  // 3. DESELECTION FIX: Listen for Popup Close
  useEffect(() => {
    if (!popup.isOpen && cyRef.current) {
      // Clear visual highlights
      clearHighlights(cyRef.current);
      // Deselect the actual node in Cytoscape logic
      cyRef.current.elements().unselect();
    }
  }, [popup.isOpen]);

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen absolute top-0 left-0 z-0 bg-slate-50 dark:bg-slate-900 transition-colors duration-300"
    />
  );
}
