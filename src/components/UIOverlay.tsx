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
  User,
  LogOut,
  LayoutDashboard,
  LogIn,
} from "lucide-react";
import { processGraphData } from "@/utils/graphUtils";
import { useState, useEffect, useMemo, useRef } from "react";
import { COLORS } from "@/utils/constants";
import { getGraphStyles } from "@/utils/graphStyles";
import CompanySelector from "./CompanySelector";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const {
    cy,
    nodesCount,
    setStats,
    isDarkMode,
    toggleTheme,
    toggleFilterPanel,
  } = useGraphStore();

  const { data: session, status } = useSession(); 
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="absolute top-0 left-0 w-full z-50 pointer-events-auto">
      <nav className="relative w-full bg-(--card-bg)/90 backdrop-blur-md border-b border-(--border) px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm transition-all">
        <div className="flex items-center gap-6 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Projector className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-(--text-main) text-sm leading-tight">
                Kivo Dependency Graph
              </h1>
              <span className="text-[10px] font-semibold text-(--text-sub) bg-(--bg) border border-(--border) px-1.5 py-0.5 rounded">
                {nodesCount > 0 ? `${nodesCount} Nodes` : "No Data"}
              </span>
            </div>
          </div>

          <div className="hidden md:block w-px h-8 bg-(--border)"></div>

          <div className="hidden md:flex gap-6 items-center">
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

        <div className="z-10 w-full md:w-auto flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2">
          <CompanySelector />
        </div>

        <div className="flex flex-wrap items-center gap-2 z-10 justify-end w-full md:w-auto">
          <button
            onClick={handleExport}
            className="p-2 rounded-lg transition hover:bg-(--border) text-(--text-main) border border-transparent hover:border-(--border)"
            title="Export Image"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFilterPanel}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-(--border) text-(--text-main) border border-transparent hover:border-(--border)"
            title="Filters"
          >
            <Filter className="w-4 h-4" />{" "}
            <span className="hidden sm:inline">Filters</span>
          </button>

          <select
            className="h-9 rounded-lg border border-(--border) bg-(--bg) text-(--text-main) text-xs px-2 outline-none cursor-pointer w-32 md:w-40 focus:border-(--accent) focus:ring-1 focus:ring-(--accent)"
            onChange={(e) => jumpToNode(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Find Node...
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
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-(--text-sub)" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm bg-(--bg) text-(--text-main) border border-(--border) rounded-lg outline-none w-32 md:w-40 transition-all focus:w-40 md:focus:w-56 focus:border-(--accent) focus:ring-1 focus:ring-(--accent)"
              />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-(--card-bg) border border-(--border) rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto z-20">
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

          <div className="hidden sm:block w-px h-6 bg-(--border) mx-1"></div>

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

          <div className="relative" ref={profileRef}>
            {status === "loading" ? (
              <div className="w-9 h-9 rounded-full bg-gray-500/20 animate-pulse"></div>
            ) : session ? (
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-9 h-9 flex items-center justify-center bg-orange-600 text-white rounded-full hover:bg-orange-700 transition shadow-sm ring-2 ring-transparent focus:ring-orange-400"
              >
                <User className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => signIn()}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition"
              >
                <LogIn className="w-4 h-4" /> Login
              </button>
            )}

            {isProfileOpen && session && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-(--card-bg) border border-(--border) rounded-xl shadow-2xl p-2 flex flex-col gap-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 border-b border-(--border) mb-1">
                  <p className="text-sm font-bold text-(--text-main) truncate">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-(--text-sub) truncate">
                    {session.user?.email}
                  </p>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold mt-1 inline-block">
                    {session.user?.role}
                  </span>
                </div>

                {session.user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-(--text-main) hover:bg-(--border) rounded-lg transition"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Admin Panel
                  </Link>
                )}

                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition w-full text-left"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
