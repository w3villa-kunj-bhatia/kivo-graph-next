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
      const pan = cy.pan(); // pan is an object {x, y}

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
    // UPDATED: Using CSS variables for Card Background and Border
    <div className="absolute bottom-6 right-6 flex flex-col gap-1.5 bg-(--card-bg) backdrop-blur-md border border-(--border) p-1.5 rounded-lg shadow-xl z-40">
      <button
        onClick={() => handleZoom(1.4)}
        // UPDATED: Using CSS variables for Hover and Text
        className="p-2 hover:bg-(--border) rounded text-(--text-main) transition"
      >
        <Plus className="w-4 h-4" />
      </button>

      <button
        onClick={() => cy?.fit(undefined, 50)}
        // UPDATED: Using CSS variables for Hover and Text
        className="p-2 hover:bg-(--border) rounded text-(--text-main) transition"
      >
        <Maximize className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleZoom(0.7)}
        // UPDATED: Using CSS variables for Hover and Text
        className="p-2 hover:bg-(--border) rounded text-(--text-main) transition"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}
