"use client";

import { useGraphStore } from "@/store/useGraphStore";
import {
  Search,
  Upload,
  Sun,
  Moon,
  Filter,
  Camera,
  Projector,
} from "lucide-react";
import { processGraphData } from "@/utils/graphUtils";
import { useState, useEffect } from "react"; // <--- Ensure useEffect is imported
import { COLORS } from "@/utils/constants";

export default function UIOverlay() {
  const {
    cy,
    nodesCount,
    setStats,
    isDarkMode,
    toggleTheme,
    toggleFilterPanel,
  } = useGraphStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // --- THEME SYNC FIX ---
  // This forces the <html> tag to update when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // ... (Keep the rest of your existing code: handleFileUpload, handleExport, etc.)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... your existing upload logic
    const file = e.target.files?.[0];
    if (!file || !cy) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const elements = processGraphData(json);
        cy.elements().remove();
        cy.add(elements.nodes);
        cy.add(elements.edges);
        // Cast to 'any' to fix strict type error
        const layoutConfig: any = {
          name: "fcose",
          animate: true,
          randomize: true,
          animationDuration: 1000,
          nodeRepulsion: 4500,
          idealEdgeLength: 100,
        };
        cy.layout(layoutConfig).run();
        setStats(elements.nodes.length, elements.edges.length);
      } catch (err) {
        alert("Error parsing JSON");
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (!cy) return;
    const jpg = cy.jpg({
      full: true,
      quality: 1,
      scale: 2,
      bg: isDarkMode ? "#0f172a" : "#f8fafc",
    });
    const link = document.createElement("a");
    link.href = jpg;
    link.download = "kivo-graph.jpg";
    link.click();
  };

  // Search Logic
  useEffect(() => {
    if (!searchTerm || !cy) {
      setSuggestions([]);
      return;
    }
    const matches = cy
      .nodes("[!isGroup]")
      .filter((n) =>
        (n.data("fullLabel") || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
      .map((n) => n.data());
    setSuggestions(matches.slice(0, 10));
  }, [searchTerm, cy]);

  const jumpToNode = (id: string) => {
    if (!cy) return;
    const node = cy.getElementById(id);
    if (node.nonempty()) {
      cy.zoom({ level: 1.5, position: node.position() }); // Instant jump
      cy.center(node);
      node.emit("tap");
      setSuggestions([]);
      setSearchTerm("");
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-50 flex justify-between items-start">
      {/* ... Your existing JSX for Left Nav, Legend, Right Nav ... */}
      {/* Just ensuring the Theme Button calls toggleTheme correctly */}
      {/* Example of where the button is:
          <div className="bg-white/90 dark:bg-slate-800/90 ...">
             ...
             <button onClick={toggleTheme} ...>
                {isDarkMode ? <Sun /> : <Moon />}
             </button>
          </div>
       */}
      {/* PASTE YOUR EXISTING JSX RETURN HERE (It was correct in previous steps) */}

      <div className="flex gap-4 items-center pointer-events-auto">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur p-2 px-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white">
            <Projector className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">
              Kivo Graph
            </h1>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
              {nodesCount > 0 ? `${nodesCount} Nodes` : "Upload JSON"}
            </span>
          </div>
        </div>

        <div className="hidden md:flex bg-white/90 dark:bg-slate-800/90 backdrop-blur p-2 px-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 gap-6 h-12 items-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <div className="w-6 h-0 border-t-2 border-slate-400"></div> Direct
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <div className="w-6 h-0 border-t-2 border-dashed border-slate-400"></div>{" "}
            Usage
          </div>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur p-2 rounded-xl shadow-lg pointer-events-auto flex gap-2 border border-slate-200 dark:border-slate-700 items-center">
        <button
          onClick={handleExport}
          className="btn-icon text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition"
          title="Export Image"
        >
          <Camera className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFilterPanel}
          className="btn-icon text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition flex items-center gap-2 text-xs font-semibold px-3"
          title="Filters"
        >
          <Filter className="w-4 h-4" /> Filters
        </button>

        <div className="relative group">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm bg-slate-100 dark:bg-slate-900 border-none rounded-lg focus:ring-2 ring-blue-500 outline-none dark:text-white w-48 transition-all focus:w-64"
            />
          </div>
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => jumpToNode(s.id)}
                  className="px-3 py-2 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 flex justify-between items-center text-slate-700 dark:text-slate-200"
                >
                  <span>{s.fullLabel}</span>
                  <span
                    className="text-[10px] uppercase font-bold px-1.5 rounded border opacity-70"
                    style={{
                      color: COLORS[s.module],
                      borderColor: COLORS[s.module],
                    }}
                  >
                    {s.module}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

        <label className="cursor-pointer flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition text-xs font-bold shadow-sm shadow-blue-500/20">
          <Upload className="w-4 h-4" /> Upload
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition text-slate-700 dark:text-white"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
