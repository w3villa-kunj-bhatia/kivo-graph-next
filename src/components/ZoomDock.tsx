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
      cy.zoom(currentZoom * factor);
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

  const handleFit = () => {
    if (!cy) return;
    // Removing the manual PAN offset. 
    // High top padding forces the graph to zoom out to fit the remaining window height.
    cy.fit(undefined, {
      padding: { top: 120, bottom: 40, left: 40, right: 40 }
    } as any);
  };

  const btnClass = `
    p-2.5 rounded-xl transition-all duration-200 
    text-(--text-main) bg-(--card-bg)/80 border border-(--border) backdrop-blur-md
    hover:bg-(--border) hover:scale-105 active:scale-95
    flex items-center justify-center
  `;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-1.5 p-1.5 z-100 pointer-events-auto">
      <button onClick={() => handleZoom(1.2)} className={btnClass} title="Zoom In">
        <Plus className="w-4 h-4 stroke-[2.5px]" />
      </button>
      <button onClick={handleFit} className={btnClass} title="Reset View">
        <Maximize className="w-4 h-4 stroke-[2.5px]" />
      </button>
      <button onClick={() => handleZoom(0.8)} className={btnClass} title="Zoom Out">
        <Minus className="w-4 h-4 stroke-[2.5px]" />
      </button>
    </div>
  );
}