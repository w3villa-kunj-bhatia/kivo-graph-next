import { create } from "zustand";
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

  isFilterPanelOpen: boolean;
  activeFilters: Set<string>;

  // --- Company Context ---
  selectedCompanyId: string | null;
  allowedModules: Set<string>; // The "Hard Limit" set by Admin
  // -----------------------

  popup: {
    isOpen: boolean;
    data: PopupData | null;
  };

  setCy: (cy: cytoscape.Core) => void;
  setStats: (n: number, e: number) => void;
  toggleTheme: () => void;
  toggleFilterPanel: () => void;
  toggleFilter: (key: string) => void;
  resetFilters: () => void;
  openPopup: (data: PopupData) => void;
  closePopup: () => void;

  // --- Context Action ---
  setCompanyContext: (companyId: string | null, allowedKeys: string[]) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  cy: null,
  nodesCount: 0,
  edgesCount: 0,
  isDarkMode: true,
  isFilterPanelOpen: false,

  // Default: All filters active
  activeFilters: new Set([
    ...Object.keys(COLORS),
    ...Object.keys(COMPLEXITY_TYPES),
    ...Object.keys(ARCHETYPES),
    ...Object.keys(TOPOLOGY_TYPES),
  ]),

  // Default: No company selected, so ALL modules are allowed
  selectedCompanyId: null,
  allowedModules: new Set(Object.keys(COLORS)),

  popup: { isOpen: false, data: null },

  setCy: (cy) => set({ cy }),
  setStats: (n, e) => set({ nodesCount: n, edgesCount: e }),

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
      // Reset only to what is ALLOWED for the current company
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

  // --- FIXED LOGIC HERE ---
  setCompanyContext: (companyId, allowedKeys) => {
    const { cy } = get();

    // 1. Determine Effective Keys
    // If companyId exists, use its keys. If NULL, use ALL COLORS.
    const effectiveKeys = companyId ? allowedKeys : Object.keys(COLORS);

    const newAllowed = new Set(effectiveKeys);

    // 2. Update State
    set({
      selectedCompanyId: companyId,
      allowedModules: newAllowed,
      // Reset active filters to match the new allowed list
      activeFilters: new Set([
        ...effectiveKeys,
        ...Object.keys(COMPLEXITY_TYPES),
        ...Object.keys(ARCHETYPES),
        ...Object.keys(TOPOLOGY_TYPES),
      ]),
    });

    // 3. Update Cytoscape Graph
    if (cy) {
      cy.batch(() => {
        // Hide everything first
        cy.elements().style("display", "none");

        // Loop over EFFECTIVE keys (this was the bug fix)
        effectiveKeys.forEach((key) => {
          cy.elements(`[module = "${key}"]`).style("display", "element");
        });

        // Show edges
        cy.edges().style("display", "element");
      });
    }
  },
}));
