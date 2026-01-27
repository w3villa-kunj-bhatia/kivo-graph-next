"use client";
import { useGraphStore } from "@/store/useGraphStore";
import { X } from "lucide-react";
import Draggable from "react-draggable";
import { COLORS } from "@/utils/constants";
import { useRef } from "react";

export default function PopupCard() {
  const { popup, closePopup } = useGraphStore();
  const nodeRef = useRef(null);

  if (!popup.isOpen || !popup.data) return null;

  const { data } = popup;

  return (
    <Draggable nodeRef={nodeRef} handle=".handle">
      <div
        ref={nodeRef}
        // UPDATED: Using CSS variables for bg, border
        className="absolute top-24 right-6 w-72 bg-(--card-bg) backdrop-blur-md border border-(--border) rounded-xl shadow-2xl z-50 overflow-hidden"
      >
        {/* Header (Drag Handle) */}
        <div className="handle p-4 border-b border-(--border) flex justify-between items-start cursor-grab active:cursor-grabbing bg-(--bg)/50">
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider block mb-1"
              style={{ color: COLORS[data.module] }}
            >
              {data.module}
            </span>
            <h2 className="text-sm font-bold text-(--text-main) leading-tight">
              {data.fullLabel}
            </h2>
          </div>
          <button
            onClick={closePopup}
            // UPDATED: Text variables
            className="text-(--text-sub) hover:text-(--text-main) transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="text-[10px] font-bold text-(--text-sub) uppercase mb-2">
            Connections ({data.connections})
          </div>

          <ul className="max-h-40 overflow-y-auto pr-1 custom-scrollbar">
            {data.neighbors.map((n, i) => (
              <li
                key={i}
                // UPDATED: Hover and text variables
                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-(--border) cursor-pointer text-xs text-(--text-main)"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[n.module] }}
                ></div>
                <span className="truncate">{n.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Draggable>
  );
}
