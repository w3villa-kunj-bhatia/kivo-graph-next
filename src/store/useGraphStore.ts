import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import cytoscape from "cytoscape";
import {
  COLORS as DEFAULT_COLORS,
  COMPLEXITY_TYPES,
  ARCHETYPES,
  TOPOLOGY_TYPES,
} from "@/utils/constants";

interface PopupData {
  id: string;
  label: string;
  module: string;
  fullLabel: string;
  connections: number;
  neighbors: any[];
}

interface GraphState {
  cy: cytoscape.Core | null;
  nodesCount: number;
  edgesCount: number;
  isDarkMode: boolean;
  isLoading: boolean;
  isSaving: boolean; 

  graphData: { nodes: any[]; edges: any[] } | null;
  nodePositions: Record<string, { x: number; y: number }>;

  isFilterPanelOpen: boolean;
  activeFilters: Set<string>;

  selectedCompanyId: string | null;
  allowedModules: Set<string>;

  popup: {
    isOpen: boolean;
    data: PopupData | null;
  };

  connectionMode: {
    isActive: boolean;
    sourceId: string | null;
  };

  disconnectionMode: {
    isActive: boolean;
    sourceId: string | null;
  };

  moduleColors: Record<string, string>;

  setCy: (cy: cytoscape.Core | null) => void;
  setGraphData: (data: { nodes: any[]; edges: any[] } | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSaving: (loading: boolean) => void; 

  setNodePositions: (
    positions: Record<string, { x: number; y: number }>,
  ) => void;

  setStats: (n: number, e: number) => void;
  toggleTheme: () => void;
  toggleFilterPanel: () => void;
  toggleFilter: (key: string) => void;
  resetFilters: () => void;
  openPopup: (data: PopupData) => void;
  closePopup: () => void;
  setCompanyContext: (companyId: string | null, allowedKeys: string[]) => void;

  setConnectionMode: (isActive: boolean, sourceId?: string | null) => void;
  setDisconnectionMode: (isActive: boolean, sourceId?: string | null) => void;

  addNode: (node: any) => void;
  addEdge: (edge: any) => void;
  removeElement: (id: string) => void;

  setModuleColors: (colors: Record<string, string>) => void;
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      cy: null,
      nodesCount: 0,
      edgesCount: 0,
      isDarkMode: true,
      isLoading: true,
      isSaving: false, 
      graphData: null,

      nodePositions: {},

      isFilterPanelOpen: false,

      moduleColors: { ...DEFAULT_COLORS },

      activeFilters: new Set([
        ...Object.keys(DEFAULT_COLORS),
        ...Object.keys(COMPLEXITY_TYPES),
        ...Object.keys(ARCHETYPES),
        ...Object.keys(TOPOLOGY_TYPES),
      ]),

      selectedCompanyId: null,
      allowedModules: new Set(Object.keys(DEFAULT_COLORS)),

      popup: { isOpen: false, data: null },

      connectionMode: { isActive: false, sourceId: null },
      disconnectionMode: { isActive: false, sourceId: null },

      setCy: (cy) => set({ cy }),
      setGraphData: (data) => set({ graphData: data }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsSaving: (loading) => set({ isSaving: loading }),
      setStats: (n, e) => set({ nodesCount: n, edgesCount: e }),

      setNodePositions: (positions) =>
        set((state) => ({
          nodePositions: { ...state.nodePositions, ...positions },
        })),

      toggleTheme: () => {
        set((s) => {
          const newMode = !s.isDarkMode;
          if (newMode) document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
          return { isDarkMode: newMode };
        });
      },

      toggleFilterPanel: () =>
        set((s) => ({ isFilterPanelOpen: !s.isFilterPanelOpen })),

      toggleFilter: (key) =>
        set((s) => {
          const newSet = new Set(s.activeFilters);
          if (newSet.has(key)) newSet.delete(key);
          else newSet.add(key);
          return { activeFilters: newSet };
        }),

      resetFilters: () => {
        const { allowedModules } = get();
        set({
          activeFilters: new Set([
            ...Array.from(allowedModules),
            ...Object.keys(COMPLEXITY_TYPES),
            ...Object.keys(ARCHETYPES),
            ...Object.keys(TOPOLOGY_TYPES),
          ]),
        });
      },

      openPopup: (data) => set({ popup: { isOpen: true, data } }),

      closePopup: () => {
        const { cy } = get();
        if (cy) {
          cy.elements().removeClass("highlight dimmed");
          cy.$(":selected").unselect();
        }
        set({ popup: { isOpen: false, data: null } });
      },

      setCompanyContext: (companyId, allowedKeys) => {
        const { cy, moduleColors } = get();
        const effectiveKeys = companyId
          ? allowedKeys
          : Object.keys(moduleColors);
        const newAllowed = new Set(effectiveKeys);

        set({
          selectedCompanyId: companyId,
          allowedModules: newAllowed,
          activeFilters: new Set([
            ...effectiveKeys,
            ...Object.keys(COMPLEXITY_TYPES),
            ...Object.keys(ARCHETYPES),
            ...Object.keys(TOPOLOGY_TYPES),
          ]),
        });

        if (cy && !cy.destroyed()) {
          cy.batch(() => {
            cy.elements().style("display", "none");
            effectiveKeys.forEach((key) => {
              cy.elements(`[module = "${key}"]`).style("display", "element");
            });
            cy.edges().style("display", "element");
          });
        }
      },

      setConnectionMode: (isActive, sourceId = null) =>
        set({ connectionMode: { isActive, sourceId } }),

      setDisconnectionMode: (isActive, sourceId = null) =>
        set({ disconnectionMode: { isActive, sourceId } }),

      addNode: (node) => {
        const { cy } = get();
        if (cy) {
          cy.add({
            group: "nodes",
            data: node,
            position: { x: node.x || 0, y: node.y || 0 },
          });
          const currentNodes = get().graphData?.nodes || [];
          set((state) => ({
            nodesCount: state.nodesCount + 1,
            graphData: {
              ...state.graphData!,
              nodes: [...currentNodes, { data: node }],
            },
          }));
        }
      },

      addEdge: (edge) => {
        const { cy } = get();
        if (cy) {
          cy.add({ group: "edges", data: edge });
          const currentEdges = get().graphData?.edges || [];
          set((state) => ({
            edgesCount: state.edgesCount + 1,
            graphData: {
              ...state.graphData!,
              edges: [...currentEdges, { data: edge }],
            },
          }));
        }
      },

      removeElement: (id) => {
        const { cy, graphData } = get();

        if (cy) {
          const el = cy.getElementById(id);
          if (el.nonempty()) {
            el.remove();
          }
        }

        if (graphData) {
          const newNodes = graphData.nodes.filter((n) => n.data.id !== id);
          const newEdges = graphData.edges.filter((e) => e.data.id !== id);

          set({
            graphData: {
              nodes: newNodes,
              edges: newEdges,
            },
            nodesCount: newNodes.length,
            edgesCount: newEdges.length,
          });
        }
      },

      setModuleColors: (colors) => {
        const { allowedModules, selectedCompanyId, activeFilters } = get();

        let newAllowed = allowedModules;
        if (!selectedCompanyId) {
          newAllowed = new Set(Object.keys(colors));
        }

        const newActiveFilters = new Set(activeFilters);
        Object.keys(colors).forEach((key) => {
          if (newAllowed.has(key)) {
            newActiveFilters.add(key);
          }
        });

        set({
          moduleColors: colors,
          allowedModules: newAllowed,
          activeFilters: newActiveFilters,
        });
      },
    }),
    {
      name: "graph-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        nodePositions: state.nodePositions,
        selectedCompanyId: state.selectedCompanyId,
        moduleColors: state.moduleColors,
      }),
    },
  ),
);
