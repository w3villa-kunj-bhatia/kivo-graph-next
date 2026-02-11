"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import expandCollapse from "cytoscape-expand-collapse";
import { useGraphStore } from "@/store/useGraphStore";
import { getGraphStyles } from "@/utils/graphStyles";
import {
  highlightNode,
  clearHighlights,
  applyFiltersToGraph,
} from "@/utils/graphInteraction";
import { useSession } from "next-auth/react";
import NodeModal from "./GraphEditor/NodeModal";
import ConfirmationModal from "./ConfirmationModal";
import {
  addNodeToGraph,
  addEdgeToGraph,
  deleteGraphElement,
  disconnectNodes,
  saveGraphLayout,
  getGraphLayout,
} from "@/app/actions/graphActions";
import { getModules } from "@/app/actions/moduleActions";
import { COLORS as DEFAULT_COLORS } from "@/utils/constants";
import Toast from "./Toast";

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
    connectionMode,
    setConnectionMode,
    disconnectionMode,
    setDisconnectionMode,
    addNode,
    addEdge,
    removeElement,
    moduleColors,
    setModuleColors,
    activeFilters,
  } = useGraphStore();

  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [toastState, setToastState] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({ message: "", type: null });

  const layoutContext = "global";

  useEffect(() => {
    async function loadLayout() {
      const savedPositions = await getGraphLayout(layoutContext);
      if (savedPositions && Object.keys(savedPositions).length > 0) {
        setNodePositions(savedPositions);
      }
    }
    loadLayout();
  }, [setNodePositions, layoutContext]);

  const handleSaveLayout = async () => {
    if (!cyRef.current) return;

    setIsSaving(true);
    const positions: Record<string, { x: number; y: number }> = {};

    cyRef.current.nodes().forEach((node) => {
      if (!node.isParent() || node.data("isGroup")) {
        positions[node.id()] = node.position();
      }
    });

    const finalPositions = { ...nodePositions, ...positions };
    setNodePositions(finalPositions);

    const result = await saveGraphLayout(finalPositions, layoutContext);

    setIsSaving(false);

    if (result.success) {
      setToastState({ message: "Layout saved successfully!", type: "success" });
    } else {
      setToastState({ message: "Failed to save layout.", type: "error" });
    }
  };

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "node" | "edge" | "bg";
    targetId?: string;
  } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 });

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

  useEffect(() => {
    async function fetchDynamicModules() {
      try {
        const dynamicModules = await getModules();
        const mergedColors = { ...DEFAULT_COLORS };
        dynamicModules.forEach((m: any) => {
          mergedColors[m.name] = m.color;
        });
        setModuleColors(mergedColors);
      } catch (err) {
        console.error("Failed to fetch modules", err);
      }
    }
    fetchDynamicModules();
  }, [setModuleColors]);

  useEffect(() => {
    if (cyRef.current && !cyRef.current.destroyed()) {
      cyRef.current.json({
        style: getGraphStyles(isDarkMode, moduleColors),
      } as any);
    }
  }, [isDarkMode, moduleColors]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!cyRef.current) {
      const cy = cytoscape({
        container: containerRef.current,
        style: getGraphStyles(isDarkMode, moduleColors),
        minZoom: 0.05,
        maxZoom: 3,
        wheelSensitivity: 0.2,
      });

      (cy as any).expandCollapse({
        layoutBy: null,
        fisheye: false,
        animate: true,
        undoable: false,
      });

      cyRef.current = cy;
      setCy(cy);

      cy.on("dragfree", "node", (e) => {
        const node = e.target;
        const pos = node.position();
        setNodePositions({ [node.id()]: { x: pos.x, y: pos.y } });
      });

      cy.on("cxttap", (e) => {
        if (!isAdmin) return;

        const target = e.target;
        const isBg = target === cy;
        const { clientX, clientY } = e.originalEvent;

        setClickPos(e.position);

        setTimeout(() => {
          setContextMenu({
            x: clientX,
            y: clientY,
            type: isBg ? "bg" : target.isNode() ? "node" : "edge",
            targetId: isBg ? undefined : target.id(),
          });
        }, 10);
      });

      cy.on("tap", (e) => {
        setContextMenu(null);
        const target = e.target;
        if (target === cy) {
          closePopup();
          return;
        }

        if (target.isNode && target.isNode()) {
          const targetId = target.id();
          const state = useGraphStore.getState();

          if (state.connectionMode.isActive) {
            const sourceId = state.connectionMode.sourceId;
            if (sourceId && sourceId !== targetId) {
              handleCreateEdge(sourceId, targetId);
              return;
            }
          }

          if (state.disconnectionMode.isActive) {
            const sourceId = state.disconnectionMode.sourceId;
            if (sourceId && sourceId !== targetId) {
              handleDisconnectNode(sourceId, targetId);
              return;
            }
          }
        }
      });

      cy.on("tap", "node[!isGroup]", (e) => {
        const state = useGraphStore.getState();
        if (state.connectionMode.isActive || state.disconnectionMode.isActive)
          return;

        const node = e.target;
        const d = node.data();

        highlightNode(cy, node.id());

        const neighbors = node.neighborhood("node[!isGroup]").map((n: any) => ({
          id: n.id(),
          label: n.data("fullLabel") || n.data("label"),
          module: n.data("module"),
        }));

        openPopup({
          id: d.id,
          label: d.label,
          fullLabel: d.fullLabel || d.label,
          module: d.module,
          connections: node.degree(false),
          neighbors: neighbors,
        });
      });
    }
  }, [setCy, isAdmin]);

  useEffect(() => {
    if (graphData && cyRef.current) {
      const cy = cyRef.current;

      cy.batch(() => {
        cy.elements().remove();

        const nodesWithPositions = graphData.nodes.map((node) => {
          const savedPos = nodePositions[node.data.id];
          return savedPos ? { ...node, position: savedPos } : node;
        });

        cy.add(nodesWithPositions);

        const validNodeIds = new Set(
          nodesWithPositions.map((n: any) => n.data.id),
        );
        const safeEdges = graphData.edges.filter((edge: any) => {
          return (
            validNodeIds.has(edge.data.source) &&
            validNodeIds.has(edge.data.target)
          );
        });

        cy.add(safeEdges);

        if (activeFilters) {
          applyFiltersToGraph(cy, activeFilters);
        }
      });

      const hasSavedPositions = Object.keys(nodePositions).length > 0;
      const hasNewUnpositionedNodes = graphData.nodes.some(
        (node) => !nodePositions[node.data.id],
      );

      if (hasSavedPositions && !hasNewUnpositionedNodes) {
        cy.layout({
          name: "preset",
          fit: true,
          padding: 50,
          animate: false,
        } as any).run();
      } else {
        if (hasSavedPositions) {
          cy.nodes()
            .filter((n) => !!nodePositions[n.id()])
            .lock();
        }

        const layout = cy.layout({
          name: "fcose",
          randomize: !hasSavedPositions,
          animate: false,
          fit: true,
          quality: "default",
          packComponents: true,
          tile: true,
          nodeRepulsion: 6500,
          idealEdgeLength: 80,
          edgeElasticity: 0.45,
          nestingFactor: 0.1,
          gravity: 0.25,
          numIter: 2500,
          nodeDimensionsIncludeLabels: true,
          tilingPaddingVertical: 50,
          tilingPaddingHorizontal: 50,
          stop: () => {
            if (hasSavedPositions) {
              cy.nodes().unlock();
            }
          },
        } as any);

        layout.run();
      }
    }
  }, [graphData, nodePositions]);

  useEffect(() => {
    if (!popup.isOpen && cyRef.current && !cyRef.current.destroyed()) {
      clearHighlights(cyRef.current);
      cyRef.current.elements().unselect();
    }
  }, [popup.isOpen]);

  const handleCreateNode = async (data: any) => {
    const newNode = { ...data, ...clickPos };
    addNode(newNode);
    await addNodeToGraph(newNode);
  };

  const handleCreateEdge = async (source: string, target: string) => {
    const edgeId = `e-${source}-${target}-${Date.now()}`;
    const newEdge = { id: edgeId, source, target };
    addEdge(newEdge);
    setConnectionMode(false, null);
    await addEdgeToGraph(newEdge);
  };

  const handleDisconnectNode = async (source: string, target: string) => {
    const cy = cyRef.current;
    if (!cy) return;

    const sourceNode = cy.getElementById(source);
    const targetNode = cy.getElementById(target);
    const edges = sourceNode.edgesWith(targetNode);

    if (edges.length === 0) {
      setDisconnectionMode(false, null);
      return;
    }

    edges.remove();
    setDisconnectionMode(false, null);

    await disconnectNodes(source, target);
  };

  const initiateDelete = () => {
    if (!contextMenu?.targetId) return;
    const id = contextMenu.targetId;
    const type = contextMenu.type;

    setContextMenu(null);

    setConfirmation({
      isOpen: true,
      title: `Delete ${type === "node" ? "Node" : "Edge"}?`,
      message: `Are you sure you want to delete this ${type}? This action will be logged.`,
      isDangerous: true,
      onConfirm: async () => {
        removeElement(id);
        await deleteGraphElement(id);
      },
    });
  };

  const startConnection = () => {
    if (contextMenu?.targetId) {
      setConnectionMode(true, contextMenu.targetId);
      setContextMenu(null);
    }
  };

  const startDisconnection = () => {
    if (contextMenu?.targetId) {
      setDisconnectionMode(true, contextMenu.targetId);
      setContextMenu(null);
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

      <Toast
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState({ message: "", type: null })}
      />

      {isAdmin && (
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={handleSaveLayout}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-lg shadow-md hover:opacity-90 transition disabled:opacity-50 font-medium text-sm"
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-white/50 dark:border-slate-900/50 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Save Layout
              </>
            )}
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        isDangerous={confirmation.isDangerous}
      />

      {connectionMode.isActive && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            onClick={() => setConnectionMode(false, null)}
            className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition flex items-center gap-2 font-semibold text-sm"
          >
            <span>Select a target node to connect...</span>
            <span className="bg-white/20 px-2 rounded text-xs">Cancel</span>
          </div>
        </div>
      )}

      {disconnectionMode.isActive && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            onClick={() => setDisconnectionMode(false, null)}
            className="bg-red-600 text-white px-6 py-2 rounded-full shadow-lg cursor-pointer hover:bg-red-700 transition flex items-center gap-2 font-semibold text-sm"
          >
            <span>Select a node to disconnect...</span>
            <span className="bg-white/20 px-2 rounded text-xs">Cancel</span>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(null);
          }}
        />
      )}

      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-gray-200 dark:border-slate-700 py-1 min-w-44 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.type === "bg" && (
            <button
              onClick={() => {
                setModalOpen(true);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 transition-colors"
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
              <button
                onClick={startDisconnection}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200"
              >
                Disconnect from...
              </button>
              <div className="h-px bg-gray-100 dark:bg-slate-700 my-1" />
              <button
                onClick={initiateDelete}
                className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 text-sm font-medium"
              >
                Delete Node
              </button>
            </>
          )}

          {contextMenu.type === "edge" && (
            <button
              onClick={initiateDelete}
              className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 text-sm font-medium"
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
        onContextMenu={(e) => e.preventDefault()}
        className="w-screen h-screen absolute top-0 left-0 z-0 bg-(--bg) transition-colors duration-300"
      />
    </>
  );
}
