"use client";
import { useGraphStore } from "@/store/useGraphStore";
import { Plus, Minus, Maximize } from "lucide-react";

export default function ZoomDock() {
  const { cy } = useGraphStore();

  const handleZoom = (factor: number) => {
    if (!cy) return;

    // Check if there is a selected node
    const selected = cy.$(":selected");

    if (selected.nonempty()) {
      // 1. Calculate New Zoom Level
      const currentZoom = cy.zoom();
      const newZoom = currentZoom * factor;

      // 2. INSTANT ZOOM (No Animation)
      cy.zoom(newZoom);
      cy.center(selected);
    } else {
      // Default: Zoom on center of screen
      const currentZoom = cy.zoom();
      const w = cy.width();
      const h = cy.height();
      const pan = cy.pan();

      const newZoom = currentZoom * factor;

      // Calculate new pan to keep center stable
      const newPan = {
        x: (pan.x - w / 2) * factor + w / 2,
        y: (pan.y - h / 2) * factor + h / 2,
      };

      // INSTANT VIEWPORT UPDATE
      cy.viewport({ zoom: newZoom, pan: newPan });
    }
  };

  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 p-1.5 rounded-lg shadow-xl z-40">
      <button
        onClick={() => handleZoom(1.4)}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition"
      >
        <Plus className="w-4 h-4" />
      </button>

      <button
        onClick={() => cy?.fit(undefined, 50)}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition"
      >
        <Maximize className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleZoom(0.7)}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}
