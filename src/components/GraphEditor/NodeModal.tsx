"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import { COLORS } from "@/utils/constants";

interface NodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  position: { x: number; y: number };
}

export default function NodeModal({
  isOpen,
  onClose,
  onSubmit,
  position,
}: NodeModalProps) {
  const [label, setLabel] = useState("");
  const [moduleType, setModuleType] = useState(
    Object.keys(COLORS)[0] || "Core",
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id =
      label.toLowerCase().replace(/[^a-z0-9]/g, "-") +
      "-" +
      Math.floor(Math.random() * 1000);
    onSubmit({
      id,
      label,
      fullLabel: label,
      module: moduleType,
      complexity: "normal",
      archetype: "Service",
    });
    setLabel("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-80 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Add Node
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-500 hover:text-red-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Node Name
            </label>
            <input
              autoFocus
              className="w-full p-2 text-sm border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Auth Service"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Module
            </label>
            <select
              className="w-full p-2 text-sm border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={moduleType}
              onChange={(e) => setModuleType(e.target.value)}
            >
              {Object.keys(COLORS).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition text-sm"
          >
            Create Node
          </button>
        </form>
      </div>
    </div>
  );
}
