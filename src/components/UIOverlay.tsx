"use client";

import { useGraphStore } from "@/store/useGraphStore";
import {
  Search,
  Sun,
  Moon,
  Filter,
  Camera,
  ChartNetwork,
  User,
  LogOut,
  LayoutDashboard,
  LogIn,
  Menu,
  X,
  Download,
  MousePointerClick,
} from "lucide-react";
import { processGraphData } from "@/utils/graphUtils";
import { useState, useEffect, useMemo, useRef } from "react";
import { getGraphStyles } from "@/utils/graphStyles";
import CompanySelector from "./CompanySelector";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { getActiveGraph } from "@/app/actions/graphActions";

export default function UIOverlay() {
  const {
    cy,
    nodesCount,
    setStats,
    isDarkMode,
    toggleTheme,
    toggleFilterPanel,
    setGraphData,
    setIsLoading,
    moduleColors,
  } = useGraphStore();

  const { data: session, status } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [nodeList, setNodeList] = useState<any[]>([]);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (cy && !cy.destroyed()) {
      cy.style(getGraphStyles(isDarkMode, moduleColors));
    }
  }, [isDarkMode, cy, moduleColors]);

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
    if (!cy || cy.destroyed()) return;

    const nodes = cy.nodes("[!isGroup]").map((n) => ({
      id: n.id(),
      label: n.data("label"),
      fullLabel: n.data("fullLabel") || n.data("label"),
      module: n.data("module") || "Other",
    }));

    nodes.sort((a, b) => a.fullLabel.localeCompare(b.fullLabel));
    setNodeList(nodes);
  }, [nodesCount, cy]);

  useEffect(() => {
    let isMounted = true;

    async function initGraph() {
      setIsLoading(true);
      try {
        const data = await getActiveGraph();

        if (!isMounted) return;
        if (!cy || cy.destroyed()) {
          setIsLoading(false);
          return;
        }

        if (data) {
          const elements = processGraphData(data);

          const { nodePositions } = useGraphStore.getState();
          const hasSavedPositions = Object.keys(nodePositions).length > 0;

          const nodesWithPositions = elements.nodes.map((node) => {
            const savedPos = nodePositions[node.data.id];
            if (savedPos) {
              return { ...node, position: savedPos };
            }
            return node;
          });
          elements.nodes = nodesWithPositions;

          setGraphData(elements);

          if (cy.destroyed()) return;

          cy.elements().remove();
          cy.add(elements.nodes);

          const validNodeIds = new Set(
            elements.nodes.map((n: any) => n.data.id),
          );

          const safeEdges = elements.edges.filter((edge: any) => {
            const hasSource = validNodeIds.has(edge.data.source);
            const hasTarget = validNodeIds.has(edge.data.target);
            return hasSource && hasTarget;
          });

          cy.add(safeEdges);

          const layoutConfig: any = hasSavedPositions
            ? {
                name: "preset",
                animate: true,
                fit: true,
                padding: 50,
              }
            : {
                name: "fcose",
                animate: true,
                randomize: true,
                animationDuration: 1000,
                nodeRepulsion: 4500,
                idealEdgeLength: 100,
              };

          if (!cy.destroyed()) {
            cy.layout(layoutConfig).run();
            setStats(elements.nodes.length, elements.edges.length);
          }
        }
      } catch (err) {
        console.error("Failed to load active graph:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (cy && !cy.destroyed()) {
      initGraph();
    }

    return () => {
      isMounted = false;
    };
  }, [cy, setGraphData, setStats, setIsLoading]);

  const groupedNodes = useMemo(() => {
    const groups: Record<string, any[]> = {};
    nodeList.forEach((node) => {
      if (!groups[node.module]) groups[node.module] = [];
      groups[node.module].push(node);
    });
    return groups;
  }, [nodeList]);

  const handleDownloadJSON = () => {
    if (!cy || cy.destroyed()) return;
    const nodes = cy.nodes().map((n) => ({
      data: n.data(),
      position: n.position(),
    }));
    const edges = cy.edges().map((e) => ({
      data: e.data(),
    }));
    const exportData = { nodes, edges };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement("a");
    link.href = dataStr;
    link.download = `kivo-graph-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  const handleExportImage = () => {
    if (!cy || cy.destroyed()) return;
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
    if (!cy || cy.destroyed()) return;
    const node = cy.getElementById(id);
    if (node.nonempty()) {
      cy.zoom({ level: 1.5, position: node.position() });
      cy.center(node);
      node.emit("tap");
      setSuggestions([]);
      setSearchTerm("");
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    if (!searchTerm || !cy || cy.destroyed()) {
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

    setSuggestions(matches);
  }, [searchTerm, cy]);

  const getNodeColor = (modName: string) => {
    return moduleColors[modName] || "#94a3b8";
  };

  return (
    <div className="absolute top-0 left-0 w-full z-50 pointer-events-auto">
      <nav
        className={`
        relative w-full bg-(--card-bg)/95 backdrop-blur-md border-b border-(--border) 
        px-3 py-2 flex flex-col lg:flex-row items-center lg:justify-between shadow-sm transition-all
        ${isMobileMenuOpen ? "h-auto" : ""}
      `}
      >
        <div className="flex items-center justify-between w-full lg:w-auto z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
              <ChartNetwork className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-(--text-main) text-sm leading-tight truncate">
                Dependency Graph
              </h1>
              <span className="text-[10px] font-semibold text-(--text-sub) bg-(--bg) border border-(--border) px-1.5 py-0.5 rounded inline-block whitespace-nowrap">
                {nodesCount > 0 ? `${nodesCount} Nodes` : "No Data"}
              </span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-6 ml-6">
            <div className="w-px h-8 bg-(--border)"></div>
            <div className="flex items-center gap-2 text-xs font-semibold text-(--text-sub)">
              <div className="w-6 h-0 border-t-2 border-solid border-(--text-sub) opacity-60"></div>{" "}
              Direct
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-(--text-sub)">
              <div className="w-6 h-0 border-t-2 border-dashed border-(--text-sub) opacity-60"></div>{" "}
              Usage
            </div>
          </div>

          {isAdmin && (
            <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-lg ml-6">
              <MousePointerClick className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span className="text-[12px] font-medium text-orange-700 dark:text-orange-300 whitespace-nowrap">
                Right-Click to Add/Delete/Disconnect Nodes
              </span>
            </div>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-(--text-main) hover:bg-(--border) rounded-lg transition"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        <div
          className={`
          w-full lg:w-auto lg:flex lg:items-center gap-2 xl:gap-3 transition-all duration-300 ease-in-out
          ${
            isMobileMenuOpen
              ? "flex flex-col mt-4 opacity-100 max-h-[85vh] overflow-y-auto pb-6"
              : "hidden lg:flex lg:opacity-100"
          }
        `}
        >
          <div
            className={`flex gap-2 ${isMobileMenuOpen ? "justify-between mb-2" : "shrink-0"}`}
          >
            {isAdmin && (
              <button
                onClick={handleDownloadJSON}
                className="p-2.5 rounded-lg hover:bg-(--border) text-(--text-main) border border-(--border) flex items-center justify-center"
                title="Download JSON"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleExportImage}
              className="p-2.5 rounded-lg hover:bg-(--border) text-(--text-main) border border-(--border) flex items-center justify-center"
              title="Export Image"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                toggleFilterPanel();
                setIsMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-lg hover:bg-(--border) text-(--text-main) border border-(--border) flex items-center gap-2 text-xs font-medium"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden xl:inline">Filters</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-2 lg:gap-2">
            <div className="w-full lg:w-48 xl:w-60">
              <CompanySelector className="w-full" />
            </div>

            <select
              className="h-10 w-full lg:w-32 xl:w-40 rounded-lg border border-(--border) bg-(--bg) text-(--text-main) text-xs px-2 outline-none cursor-pointer focus:border-(--accent) focus:ring-1 focus:ring-(--accent)"
              onChange={(e) => jumpToNode(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>
                Find Node...
              </option>
              {Object.keys(groupedNodes)
                .sort()
                .map((module) => (
                  <optgroup key={module} label={module}>
                    {groupedNodes[module].map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.fullLabel}
                      </option>
                    ))}
                  </optgroup>
                ))}
            </select>

            <div className="relative group w-full lg:w-40 xl:w-56 transition-all duration-300">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-(--text-sub)" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 pl-9 pr-3 w-full text-sm bg-(--bg) text-(--text-main) border border-(--border) rounded-lg outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)"
                />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute top-full right-0 w-full lg:w-64 mt-2 bg-(--card-bg) border border-(--border) rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto z-50">
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => jumpToNode(s.id)}
                      className="px-3 py-2 text-xs cursor-pointer hover:bg-(--border) flex justify-between items-center text-(--text-main)"
                    >
                      <span className="truncate max-w-[70%]">
                        {s.fullLabel}
                      </span>
                      <span
                        className="text-[10px] uppercase font-bold px-1.5 rounded border opacity-70 whitespace-nowrap"
                        style={{
                          color: getNodeColor(s.module),
                          borderColor: getNodeColor(s.module),
                        }}
                      >
                        {s.module}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-px h-8 bg-(--border)"></div>

          <div className="flex items-center gap-2 mt-2 lg:mt-0 lg:ml-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-(--bg) border border-(--border) rounded-lg hover:bg-(--border) text-(--text-main)"
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
                  className="w-9 h-9 flex items-center justify-center bg-orange-600 text-white rounded-full hover:bg-orange-700 transition"
                >
                  <User className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4" /> <span>Login</span>
                </button>
              )}

              {isProfileOpen && session && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-(--card-bg) border border-(--border) rounded-xl shadow-2xl p-2 z-50">
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
        </div>
      </nav>
    </div>
  );
}
