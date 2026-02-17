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

  const moduleColor = getNodeColor(data.module);

  return (
    <Draggable nodeRef={nodeRef} handle=".handle">
      <div
        ref={nodeRef}
        className="absolute top-25 right-6 w-60 bg-(--card-bg) backdrop-blur-xl border border-(--border) rounded-4xl shadow-2xl z-50 overflow-hidden flex flex-col transition-all duration-300"
      >
        <div
          className="handle p-6 border-b border-(--border)/50 flex justify-between items-start cursor-grab active:cursor-grabbing"
          style={{ backgroundColor: `${moduleColor}10` }}
        >
          <div className="flex-1 min-w-0 mr-4">
            <span
              className="text-[12px] font-black uppercase block mb-1 tracking-[0.15em]"
              style={{ color: moduleColor }}
            >
              {data.module}
            </span>
            <h2
              className="text-base font-bold text-(--text-main) leading-tight truncate"
              title={data.fullLabel}
            >
              {data.fullLabel}
            </h2>
          </div>
          <button
            onClick={closePopup}
            className="p-1.5 rounded-full hover:bg-(--border) text-(--text-sub) hover:text-(--text-main) transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="text-[12px] font-bold text-(--text-sub) uppercase tracking-widest mb-2 opacity-60">
            Connections ({data.connections})
          </div>

          <ul className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar flex flex-col">
            {data.neighbors.map((n, i) => {
              const neighborColor = getNodeColor(n.module);
              return (
                <li
                  key={i}
                  onClick={() => handleJump(n.id)}
                  className="group flex items-center gap-2 py-1 px-3 rounded-2xl hover:bg-(--border)/50 cursor-pointer text-sm text-(--text-main) transition-all duration-200"
                  title="Click to focus on this node"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                    style={{ backgroundColor: neighborColor }}
                  ></div>
                  <span className="truncate flex-1 min-w-0 font-medium opacity-80 group-hover:opacity-100">
                    {n.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Draggable>
  );
}
