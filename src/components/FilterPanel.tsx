"use client";
import { useGraphStore } from "@/store/useGraphStore";
import {
  COLORS,
  COMPLEXITY_TYPES,
  TOPOLOGY_TYPES,
  ARCHETYPES,
} from "@/utils/constants";
import { Check } from "lucide-react";
import clsx from "clsx";
import { useEffect } from "react";
import { applyFiltersToGraph } from "@/utils/graphInteraction";

export default function FilterPanel() {
  const { isFilterPanelOpen, activeFilters, toggleFilter, resetFilters, cy } =
    useGraphStore();

  // Apply filters whenever state changes
  useEffect(() => {
    if (cy) applyFiltersToGraph(cy, activeFilters);
  }, [activeFilters, cy]);

  const renderSection = (title: string, items: Record<string, any>) => (
    <div className="mb-4">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">
        {title}
      </h3>
      {Object.entries(items).map(([key, config]) => {
        // Handle color depending if it's a module string or object
        const color =
          typeof config === "string" ? config : config.color || "#94a3b8";
        const label = typeof config === "string" ? key : config.label;
        const isActive = activeFilters.has(key);

        return (
          <div
            key={key}
            onClick={() => toggleFilter(key)}
            className={clsx(
              "flex items-center gap-2 py-1.5 cursor-pointer text-xs transition-opacity",
              !isActive && "opacity-50",
            )}
          >
            <div
              className="w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center"
              style={{
                borderColor: color,
                backgroundColor: isActive ? color : "transparent",
              }}
            >
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className={clsx(
        "absolute top-20 left-6 w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-40 transition-transform duration-300 max-h-[80vh] overflow-y-auto flex flex-col",
        isFilterPanelOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="p-4 sticky top-0 bg-inherit z-10 flex justify-between items-center border-b border-slate-100 dark:border-slate-700/50">
        <span className="text-xs font-bold text-slate-500">FILTERS</span>
        <button
          onClick={resetFilters}
          className="text-xs text-blue-500 font-semibold hover:text-blue-600"
        >
          Reset
        </button>
      </div>

      <div className="p-4 pt-2">
        {renderSection("Risk Levels", COMPLEXITY_TYPES)}
        {renderSection("Topology", TOPOLOGY_TYPES)}
        {renderSection("Layers", ARCHETYPES)}
        {renderSection("Modules", COLORS)}
      </div>
    </div>
  );
}
