"use client";

import { useGraphStore } from "@/store/useGraphStore";
import {
  COMPLEXITY_TYPES,
  TOPOLOGY_TYPES,
  ARCHETYPES,
} from "@/utils/constants";
import { Check } from "lucide-react";
import clsx from "clsx";
import { useEffect } from "react";
import { applyFiltersToGraph } from "@/utils/graphInteraction";

export default function FilterPanel() {
  const {
    isFilterPanelOpen,
    activeFilters = new Set<string>(),
    toggleFilter,
    resetFilters,
    cy,
    allowedModules,
    selectedCompanyId,
    moduleColors,
  } = useGraphStore();

  useEffect(() => {
    if (cy) {
      applyFiltersToGraph(cy, activeFilters);
    }
  }, [activeFilters, cy]);

  const renderSection = (title: string, items: Record<string, any>) => (
    <div className="mb-6">
      <h3 className="text-[12px] font-bold text-(--text-sub) uppercase tracking-widest border-b border-(--border) pb-2 mb-2 opacity-70">
        {title}
      </h3>
      <div className="flex flex-col gap-1">
        {Object.entries(items || {}).map(([key, config]) => {
          if (
            title === "Modules" &&
            selectedCompanyId &&
            allowedModules &&
            !allowedModules.has(key)
          ) {
            return null;
          }

          const color =
            typeof config === "string" ? config : config.color || "#94a3b8";
          const label = typeof config === "string" ? key : config.label;
          const isActive = activeFilters.has(key);

          return (
            <div
              key={key}
              onClick={() => toggleFilter(key)}
              className="flex items-center justify-between group py-1 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    "w-4 h-4 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                    isActive ? "scale-110 shadow-sm" : "opacity-40",
                  )}
                  style={{
                    borderColor: color,
                    backgroundColor: isActive ? color : "transparent",
                  }}
                >
                  {isActive && (
                    <Check className="w-3 h-3 text-white stroke-[3px]" />
                  )}
                </div>
                <span
                  className={clsx(
                    "text-xs font-bold transition-colors",
                    isActive
                      ? "text-(--text-main)"
                      : "text-(--text-sub) opacity-50",
                  )}
                >
                  {label}
                </span>
              </div>

              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className={clsx(
        "absolute top-25 w-60 bg-(--card-bg) backdrop-blur-xl border border-(--border) rounded-4xl shadow-2xl z-40 transition-all duration-500 ease-in-out max-h-[75vh] flex flex-col overflow-hidden",
        isFilterPanelOpen
          ? "translate-x-6 opacity-100"
          : "-translate-x-full opacity-0",
      )}
    >
      <div className="p-6 pb-4 sticky top-0 bg-transparent z-10 flex justify-between items-center border-b border-(--border)/50">
        <span className="text-xs font-black text-(--text-sub) tracking-[0.2em]">
          FILTERS
        </span>
        <button
          onClick={resetFilters}
          className="text-[11px] text-blue-500 font-bold hover:text-blue-400 transition-colors uppercase"
        >
          Reset
        </button>
      </div>

      <div className="p-6 pt-4 overflow-y-auto custom-scrollbar">
        {renderSection("Risk Levels", COMPLEXITY_TYPES)}
        {renderSection("Topology", TOPOLOGY_TYPES)}
        {renderSection("Layers", ARCHETYPES)}
        {renderSection("Modules", moduleColors)}
      </div>
    </div>
  );
}
