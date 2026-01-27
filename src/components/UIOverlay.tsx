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
import { useState, useEffect, useMemo } from "react";
import { COLORS } from "@/utils/constants";
import { getGraphStyles } from "@/utils/graphStyles";

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

  const [nodeList, setNodeList] = useState<any[]>([]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (cy) {
      cy.style(getGraphStyles(isDarkMode));
    }
  }, [isDarkMode, cy]);

  useEffect(() => {
    if (!cy) return;

    const nodes = cy.nodes("[!isGroup]").map((n) => ({
      id: n.id(),
      label: n.data("label"),
      fullLabel: n.data("fullLabel") || n.data("label"),
      module: n.data("module") || "Other",
    }));

    nodes.sort((a, b) => a.fullLabel.localeCompare(b.fullLabel));
    setNodeList(nodes);
  }, [nodesCount, cy]);

  const groupedNodes = useMemo(() => {
    const groups: Record<string, any[]> = {};
    nodeList.forEach((node) => {
      if (!groups[node.module]) groups[node.module] = [];
      groups[node.module].push(node);
    });
    return groups;
  }, [nodeList]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        alert("Error parsing JSON: " + err);
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

  const jumpToNode = (id: string) => {
    if (!cy) return;
    const node = cy.getElementById(id);
    if (node.nonempty()) {
      cy.zoom({ level: 1.5, position: node.position() });
      cy.center(node);
      node.emit("tap");
      setSuggestions([]);
      setSearchTerm("");
    }
  };

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

  return (
    <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex gap-4 items-center pointer-events-auto">
        <div className="bg-(--card-bg) backdrop-blur-md p-2 px-4 rounded-xl shadow-lg border border-(--border) flex items-center gap-3">
          <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white">
            <Projector className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-(--text-main) text-sm leading-tight">
              Kivo Dependency Graph
            </h1>
            <span className="text-[10px] font-semibold text-(--text-sub) bg-(--bg) border border-(--border) px-1.5 py-0.5 rounded">
              {nodesCount > 0 ? `${nodesCount} Nodes` : "Upload JSON"}
            </span>
          </div>
        </div>

        <div className="hidden md:flex bg-(--card-bg) backdrop-blur-md p-2 px-4 rounded-xl shadow-lg border border-(--border) gap-6 h-12 items-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-(--text-sub)">
            <div className="w-6 h-0 border-t-2 border-solid border-(--text-sub) opacity-60"></div>{" "}
            Direct
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-(--text-sub)">
            <div className="w-6 h-0 border-t-2 border-dashed border-(--text-sub) opacity-60"></div>{" "}
            Usage
          </div>
        </div>
      </div>

      <div className="bg-(--card-bg) backdrop-blur-md p-2 rounded-xl shadow-lg pointer-events-auto flex flex-wrap gap-2 border border-(--border) items-center">
        <button
          onClick={handleExport}
          className="p-2 rounded-lg transition hover:bg-(--border) text-(--text-main)"
          title="Export Image"
        >
          <Camera className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFilterPanel}
          className="flex items-center gap-2 text-xs font-semibold px-3 p-2 rounded-lg transition hover:bg-(--border) text-(--text-main)"
          title="Filters"
        >
          <Filter className="w-4 h-4" />{" "}
          <span className="hidden sm:inline">Filters</span>
        </button>

        <select
          className="h-9 rounded-lg border border-(--border) bg-(--bg) text-(--text-main) text-xs px-2 outline-none cursor-pointer w-32 md:w-48 focus:border-(--accent)"
          onChange={(e) => jumpToNode(e.target.value)}
          defaultValue=""
          style={{ appearance: "auto" }} 
        >
          <option value="" disabled>
            Select Node ({nodeList.length})...
          </option>
          {Object.keys(groupedNodes)
            .sort()
            .map((module) => (
              <optgroup
                key={module}
                label={module}
                className="text-(--text-main) bg-(--bg)"
              >
                {groupedNodes[module].map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.fullLabel}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>

        <div className="relative group">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-(--text-sub)" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm bg-(--bg) text-(--text-main) border border-(--border) rounded-lg outline-none w-32 md:w-48 transition-all focus:w-40 md:focus:w-56 focus:border-(--accent)"
            />
          </div>
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-(--card-bg) border border-(--border) rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => jumpToNode(s.id)}
                  className="px-3 py-2 text-xs cursor-pointer hover:bg-(--border) flex justify-between items-center text-(--text-main)"
                >
                  <span className="truncate max-w-[70%]">{s.fullLabel}</span>
                  <span
                    className="text-[10px] uppercase font-bold px-1.5 rounded border opacity-70 whitespace-nowrap"
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

        <div className="w-px h-6 bg-(--border) mx-1"></div>

        <label className="cursor-pointer flex items-center justify-center gap-2 bg-(--accent) hover:opacity-90 text-white py-2 px-4 rounded-lg transition text-xs font-bold shadow-sm">
          <Upload className="w-4 h-4" />{" "}
          <span className="hidden sm:inline">Upload</span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center bg-(--bg) border border-(--border) rounded-lg hover:bg-(--border) transition text-(--text-main)"
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
