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

  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      style: getGraphStyles(isDarkMode),
      minZoom: 0.05,
      maxZoom: 3,
      wheelSensitivity: 0.2,
    });

    (cyRef.current as any).expandCollapse({
      layoutBy: null,
      fisheye: false,
      animate: true,
      undoable: false,
    });

    setCy(cyRef.current);

    cyRef.current.on("tap", (e) => {
      if (e.target === cyRef.current) {
        closePopup();
      }
    });

    cyRef.current.on("tap", "node[!isGroup]", (e) => {
      const node = e.target;
      const d = node.data();

      highlightNode(cyRef.current!, node.id());

      const neighbors = node.neighborhood("node[!isGroup]").map((n: any) => ({
        id: n.id(),
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
      if (cyRef.current) {
        cyRef.current.destroy();
        setCy(null); 
      }
    };
  }, [setCy]);

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.json({ style: getGraphStyles(isDarkMode) } as any);
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!popup.isOpen && cyRef.current) {
      clearHighlights(cyRef.current);
      cyRef.current.elements().unselect();
    }
  }, [popup.isOpen]);

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen absolute top-0 left-0 z-0 bg-(--bg) transition-colors duration-300"
    />
  );
}
