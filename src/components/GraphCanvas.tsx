"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import expandCollapse from "cytoscape-expand-collapse";
import { useGraphStore } from "@/store/useGraphStore";
import { getGraphStyles } from "@/utils/graphStyles";
import { highlightNode, clearHighlights } from "@/utils/graphInteraction";
import { useSession } from "next-auth/react";
import NodeModal from "./GraphEditor/NodeModal";
import ConfirmationModal from "./ConfirmationModal"; // Imported ConfirmationModal
import {
  addNodeToGraph,
  addEdgeToGraph,
  deleteGraphElement,
} from "@/app/actions/graphActions";

cytoscape.use(fcose);
if (typeof cytoscape("core", "expandCollapse") === "undefined") {
  cytoscape.use(expandCollapse);
}

export default function GraphCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

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
    // New Store values
    connectionMode,
    setConnectionMode,
    addNode,
    addEdge,
    removeElement,
  } = useGraphStore();

  const cyRef = useRef<cytoscape.Core | null>(null);

  // --- EDITOR STATE ---
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "node" | "edge" | "bg";
    targetId?: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 }); // Pos for new node

  // --- CONFIRMATION STATE ---
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDangerous: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    isDangerous: false,
    onConfirm: () => {},
  });

  // --- INITIALIZATION ---
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

    // --- INTERACTION HANDLERS ---

    // 1. Right Click (Context Menu)
    cyRef.current.on("cxttap", (e) => {
      if (!isAdmin) return;
      const target = e.target;
      const isBg = target === cyRef.current;

      setClickPos(e.position); // Save Cytoscape coordinates for new node

      setContextMenu({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
        type: isBg ? "bg" : target.isNode() ? "node" : "edge",
        targetId: isBg ? undefined : target.id(),
      });
    });

    // 2. Left Click (Normal + Connection Logic)
    cyRef.current.on("tap", (e) => {
      setContextMenu(null); // Close menu

      // Connection Mode Logic
      if (
        useGraphStore.getState().connectionMode.isActive &&
        e.target.isNode()
      ) {
        const sourceId = useGraphStore.getState().connectionMode.sourceId;
        const targetId = e.target.id();

        if (sourceId && sourceId !== targetId) {
          handleCreateEdge(sourceId, targetId);
          return;
        }
      }

      // Popup Logic
      if (e.target === cyRef.current) {
        closePopup();
      }
    });

    cyRef.current.on("tap", "node[!isGroup]", (e) => {
      if (useGraphStore.getState().connectionMode.isActive) return;

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
  }, [setCy, isAdmin]); // Re-run if admin status changes

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

  // --- EDITOR HANDLERS ---
  const handleCreateNode = async (data: any) => {
    const newNode = { ...data, ...clickPos };
    addNode(newNode); // Optimistic UI
    await addNodeToGraph(newNode); // DB Save (Creates Log)
  };

  const handleCreateEdge = async (source: string, target: string) => {
    const edgeId = `e-${source}-${target}-${Date.now()}`;
    const newEdge = { id: edgeId, source, target };
    addEdge(newEdge);
    setConnectionMode(false, null);
    await addEdgeToGraph(newEdge); // DB Save (Creates Log)
  };

  // --- DELETE WITH CONFIRMATION ---
  const initiateDelete = () => {
    if (!contextMenu?.targetId) return;
    const id = contextMenu.targetId;
    const type = contextMenu.type;

    setContextMenu(null); // Close context menu

    setConfirmation({
      isOpen: true,
      title: `Delete ${type === "node" ? "Node" : "Edge"}?`,
      message: `Are you sure you want to delete this ${type}? This action will be logged.`,
      isDangerous: true,
      onConfirm: async () => {
        removeElement(id); // Optimistic UI
        await deleteGraphElement(id); // DB Save (Creates Log)
      },
    });
  };

  const startConnection = () => {
    if (contextMenu?.targetId) {
      setConnectionMode(true, contextMenu.targetId);
      setContextMenu(null);
      closePopup();
    }
  };

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-all duration-300">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900 animate-spin border-t-blue-600 dark:border-t-blue-500"></div>
          </div>
          <p className="mt-4 text-sm font-semibold text-gray-600 dark:text-gray-300 animate-pulse">
            Loading Graph...
          </p>
        </div>
      )}

      {/* --- CONFIRMATION MODAL --- */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        isDangerous={confirmation.isDangerous}
      />

      {/* --- CONNECTION MODE BANNER --- */}
      {connectionMode.isActive && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            onClick={() => setConnectionMode(false, null)}
            className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition flex items-center gap-2 font-semibold text-sm"
          >
            <span>Select a target node to connect...</span>
            <span className="bg-white/20 px-2 rounded text-xs">
              Click to Cancel
            </span>
          </div>
        </div>
      )}

      {/* --- CONTEXT MENU --- */}
      {contextMenu && (
        <div
          className="absolute z-50 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-gray-200 dark:border-slate-700 py-1 min-w-40 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          {contextMenu.type === "bg" && (
            <button
              onClick={() => {
                setModalOpen(true);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200"
            >
              Add Node Here
            </button>
          )}

          {contextMenu.type === "node" && (
            <>
              <button
                onClick={startConnection}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200"
              >
                Connect to...
              </button>
              <div className="h-px bg-gray-100 dark:bg-slate-700 my-1" />
              <button
                onClick={initiateDelete} // Triggers confirmation
                className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 text-sm"
              >
                Delete Node
              </button>
            </>
          )}

          {contextMenu.type === "edge" && (
            <button
              onClick={initiateDelete} // Triggers confirmation
              className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 text-sm"
            >
              Delete Edge
            </button>
          )}
        </div>
      )}

      <NodeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateNode}
        position={clickPos}
      />

      <div
        ref={containerRef}
        className="w-screen h-screen absolute top-0 left-0 z-0 bg-(--bg) transition-colors duration-300"
      />
    </>
  );
}
