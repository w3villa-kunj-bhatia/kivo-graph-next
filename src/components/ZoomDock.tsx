"use client";
import { useGraphStore } from "@/store/useGraphStore";
import { Plus, Minus, Maximize } from "lucide-react";

export default function ZoomDock() {
  const { cy } = useGraphStore();

  const handleZoom = (factor: number) => {
    if (!cy) return;

    const selected = cy.$(":selected");

    if (selected.nonempty()) {
      const currentZoom = cy.zoom();
      const newZoom = currentZoom * factor;

      cy.zoom(newZoom);
      cy.center(selected);
    } else {
      const currentZoom = cy.zoom();
      const w = cy.width();
      const h = cy.height();
      const pan = cy.pan();
      const newZoom = currentZoom * factor;

      const newPan = {
        x: (pan.x - w / 2) * factor + w / 2,
        y: (pan.y - h / 2) * factor + h / 2,
      };

      cy.viewport({ zoom: newZoom, pan: newPan });
    }
  };

  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-1.5 bg-(--card-bg) backdrop-blur-md border border-(--border) p-1.5 rounded-lg shadow-xl z-100">
      <button
        onClick={() => handleZoom(1.4)}
        className="p-2 hover:bg-(--border) rounded text-(--text-main) transition"
      >
        <Plus className="w-4 h-4" />
      </button>

      <button
        onClick={() => cy?.fit(undefined, 50)}
        className="p-2 hover:bg-(--border) rounded text-(--text-main) transition"
      >
        <Maximize className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleZoom(0.7)}
        className="p-2 hover:bg-(--border) rounded text-(--text-main) transition"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}
