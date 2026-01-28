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

  const {
    setCy,
    isDarkMode,
    openPopup,
    closePopup,
    popup,
    graphData,
    nodePositions,
    setNodePositions,
    isLoading,
  } = useGraphStore();

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

    if (graphData) {
      const nodesWithPositions = graphData.nodes.map((node) => {
        const savedPos = nodePositions[node.data.id];
        if (savedPos) {
          return { ...node, position: savedPos };
        }
        return node;
      });

      cyRef.current.add(nodesWithPositions);
      cyRef.current.add(graphData.edges);

      const hasSavedPositions = Object.keys(nodePositions).length > 0;

      cyRef.current
        .layout({
          name: hasSavedPositions ? "preset" : "fcose",
          animate: false,
          randomize: false,
          nodeRepulsion: 4500,
          idealEdgeLength: 100,
          fit: !hasSavedPositions,
        } as any)
        .run();
    }

    setCy(cyRef.current);

    cyRef.current.on("dragfree", "node", (e) => {
      const node = e.target;
      const pos = node.position();

      setNodePositions({
        [node.id()]: { x: pos.x, y: pos.y },
      });
    });

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
    <>
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-all duration-300">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900 animate-spin border-t-blue-600 dark:border-t-blue-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full"></div>
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold text-gray-600 dark:text-gray-300 animate-pulse">
            Loading Graph...
          </p>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-screen h-screen absolute top-0 left-0 z-0 bg-(--bg) transition-colors duration-300"
      />
    </>
  );
}
