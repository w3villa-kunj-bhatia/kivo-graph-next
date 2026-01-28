import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import cytoscape from "cytoscape";
import {
  COLORS,
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

  setCy: (cy: cytoscape.Core | null) => void;
  setGraphData: (data: { nodes: any[]; edges: any[] } | null) => void;

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
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      cy: null,
      nodesCount: 0,
      edgesCount: 0,
      isDarkMode: true,
      graphData: null,

      nodePositions: {},

      isFilterPanelOpen: false,

      activeFilters: new Set([
        ...Object.keys(COLORS),
        ...Object.keys(COMPLEXITY_TYPES),
        ...Object.keys(ARCHETYPES),
        ...Object.keys(TOPOLOGY_TYPES),
      ]),

      selectedCompanyId: null,
      allowedModules: new Set(Object.keys(COLORS)),

      popup: { isOpen: false, data: null },

      setCy: (cy) => set({ cy }),
      setGraphData: (data) => set({ graphData: data }),
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

      resetFilters: () =>
        set((s) => ({
          activeFilters: new Set([
            ...Array.from(s.allowedModules),
            ...Object.keys(COMPLEXITY_TYPES),
            ...Object.keys(ARCHETYPES),
            ...Object.keys(TOPOLOGY_TYPES),
          ]),
        })),

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
        const { cy } = get();
        const effectiveKeys = companyId ? allowedKeys : Object.keys(COLORS);
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
    }),
    {
      name: "graph-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        nodePositions: state.nodePositions,
        selectedCompanyId: state.selectedCompanyId,
      }),
    },
  ),
);
