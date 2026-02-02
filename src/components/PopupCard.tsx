"use client";
import { useGraphStore } from "@/store/useGraphStore";
import { X } from "lucide-react";
import Draggable from "react-draggable";
import { useRef } from "react";

export default function PopupCard() {
  const { popup, closePopup, cy, moduleColors } = useGraphStore();
  const nodeRef = useRef(null);

  if (!popup.isOpen || !popup.data) return null;

  const { data } = popup;

  const getNodeColor = (modName: string) => {
    return moduleColors[modName] || "#94a3b8";
  };

  const handleJump = (nodeId: string) => {
    if (!cy) return;
    const node = cy.getElementById(nodeId);

    if (node.nonempty()) {
      cy.animate(
        {
          center: { eles: node },
          zoom: 1.5,
        },
        {
          duration: 500,
          easing: "ease-in-out-cubic",
        },
      );

      node.emit("tap");
    }
  };

  return (
    <Draggable nodeRef={nodeRef} handle=".handle">
      <div
        ref={nodeRef}
        className="absolute top-25 right-6 w-72 bg-(--card-bg) backdrop-blur-md border border-(--border) rounded-xl shadow-2xl z-50 overflow-hidden"
      >
        <div className="handle p-4 border-b border-(--border) flex justify-between items-start cursor-grab active:cursor-grabbing bg-(--bg)/50">
          {/* Fix: Added flex-1 and min-w-0 to prevent text from breaking layout */}
          <div className="flex-1 min-w-0 mr-4">
            <span
              className="text-[10px] font-bold uppercase block mb-1"
              style={{ color: getNodeColor(data.module) }}
            >
              {data.module}
            </span>
            <h2
              className="text-sm font-bold text-(--text-main) leading-tight truncate"
              style={{
                letterSpacing: "0px",
                textTransform: "none",
                fontVariant: "normal",
                wordSpacing: "normal",
              }}
              title={data.fullLabel}
            >
              {data.fullLabel}
            </h2>
          </div>
          <button
            onClick={closePopup}
            className="text-(--text-sub) hover:text-(--text-main) transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="text-xs font-bold text-(--text-sub) uppercase mb-2">
            Connections ({data.connections})
          </div>

          <ul className="max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {data.neighbors.map((n, i) => (
              <li
                key={i}
                onClick={() => handleJump(n.id)}
                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-(--border) cursor-pointer text-sm text-(--text-main) transition-colors"
                title="Click to focus on this node"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: getNodeColor(n.module) }}
                ></div>
                {/* Fix: Added truncate and flex-1 to list items */}
                <span
                  className="truncate flex-1 min-w-0"
                  style={{
                    letterSpacing: "0px",
                    textTransform: "none",
                    fontVariant: "normal",
                  }}
                >
                  {n.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Draggable>
  );
}
