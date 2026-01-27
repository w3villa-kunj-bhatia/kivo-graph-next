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
}

export const useGraphStore = create<GraphState>((set, get) => ({
  cy: null,
  nodesCount: 0,
  edgesCount: 0,
  isDarkMode: true,
  isFilterPanelOpen: false,

  activeFilters: new Set([
    ...Object.keys(COLORS),
    ...Object.keys(COMPLEXITY_TYPES),
    ...Object.keys(ARCHETYPES),
    ...Object.keys(TOPOLOGY_TYPES),
  ]),

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
    set({
      activeFilters: new Set([
        ...Object.keys(COLORS),
        ...Object.keys(COMPLEXITY_TYPES),
        ...Object.keys(ARCHETYPES),
        ...Object.keys(TOPOLOGY_TYPES),
      ]),
    }),

  openPopup: (data) => set({ popup: { isOpen: true, data } }),

  closePopup: () => {
    const { cy } = get();
    if (cy) {
      cy.elements().removeClass("highlight dimmed");
      cy.$(":selected").unselect();
    }
    set({ popup: { isOpen: false, data: null } });
  },
}));
