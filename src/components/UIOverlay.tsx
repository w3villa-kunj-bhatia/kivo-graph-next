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
  ChevronDown,
  Save,
} from "lucide-react";
import { processGraphData } from "@/utils/graphUtils";
import { useState, useEffect, useMemo, useRef } from "react";
import { getGraphStyles } from "@/utils/graphStyles";
import CompanySelector from "./CompanySelector";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { getActiveGraph, saveGraphLayout } from "@/app/actions/graphActions";
import ConfirmationModal from "./ConfirmationModal";
import Toast from "./Toast";

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
    nodePositions,
    setNodePositions,
    isSaving,
    setIsSaving,
  } = useGraphStore();

  const { data: session, status } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [nodeList, setNodeList] = useState<any[]>([]);

  const [toastState, setToastState] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({ message: "", type: null });

  const isAdmin = session?.user?.role === "admin";

  const handleSaveLayout = async () => {
    if (!cy || cy.destroyed()) return;

    setIsSaving(true);
    const positions: Record<string, { x: number; y: number }> = {};

    cy.nodes().forEach((node: any) => {
      if (!node.isParent() || node.data("isGroup")) {
        positions[node.id()] = node.position();
      }
    });

    const finalPositions = { ...nodePositions, ...positions };
    setNodePositions(finalPositions);

    const result = await saveGraphLayout(finalPositions, "global");
    setIsSaving(false);

    if (result.success) {
      setToastState({ message: "Layout saved successfully!", type: "success" });
    } else {
      setToastState({ message: "Failed to save layout.", type: "error" });
    }
  };

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
          const { nodePositions: savedPositions } = useGraphStore.getState();
          const hasSavedPositions = Object.keys(savedPositions).length > 0;

          const nodesWithPositions = elements.nodes.map((node) => {
            const savedPos = savedPositions[node.data.id];
            return savedPos ? { ...node, position: savedPos } : node;
          });

          elements.nodes = nodesWithPositions;
          setGraphData(elements);

          if (cy.destroyed()) return;

          cy.elements().remove();
          cy.add(elements.nodes);

          const validNodeIds = new Set(
            elements.nodes.map((n: any) => n.data.id),
          );
          const safeEdges = elements.edges.filter(
            (edge: any) =>
              validNodeIds.has(edge.data.source) &&
              validNodeIds.has(edge.data.target),
          );

          cy.add(safeEdges);

          const layoutConfig: any = hasSavedPositions
            ? {
                name: "preset",
                animate: true,
                fit: true,
                padding: { top: 250, bottom: 50, left: 50, right: 50 },
              }
            : {
                name: "fcose",
                animate: true,
                randomize: true,
                fit: true,
                padding: { top: 250, bottom: 50, left: 50, right: 50 },
                animationDuration: 1000,
                nodeRepulsion: 4500,
                idealEdgeLength: 100,
              };

          cy.layout(layoutConfig).run();

          cy.fit(
            undefined as any,
            {
              padding: { top: 140, bottom: 40, left: 40, right: 40 },
            } as any,
          );

          const currentPan = cy.pan();
          cy.pan({ x: currentPan.x, y: currentPan.y + 60 });

          setStats(elements.nodes.length, elements.edges.length);
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
    const exportData = {
      nodes: cy
        .nodes()
        .map((n) => ({ data: n.data(), position: n.position() })),
      edges: cy.edges().map((e) => ({ data: e.data() })),
    };
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

  // FIXED QUICK SEARCH LOGIC
  useEffect(() => {
    if (!searchTerm.trim() || !cy || cy.destroyed()) {
      setSuggestions([]);
      return;
    }

    const matches = cy
      .nodes("[!isGroup]")
      .filter((n) => {
        const label = (
          n.data("fullLabel") ||
          n.data("label") ||
          ""
        ).toLowerCase();
        return label.includes(searchTerm.toLowerCase());
      })
      .map((n) => n.data());

    setSuggestions(matches);
  }, [searchTerm, cy]);

  const getNodeColor = (modName: string) => moduleColors[modName] || "#94a3b8";

  return (
    <div className="absolute top-0 left-0 w-full z-50 pointer-events-auto">
      <Toast
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState({ message: "", type: null })}
      />

      <ConfirmationModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={() => signOut({ callbackUrl: "/login" })}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        isDangerous={true}
      />

      <nav
        className={`
        w-full bg-(--card-bg)/80 backdrop-blur-xl border-b border-(--border) 
        px-4 py-2 lg:py-3 flex flex-col lg:flex-row items-center lg:justify-between shadow-sm transition-all duration-300
        ${isMobileMenuOpen ? "h-screen lg:h-auto" : "h-auto"}
      `}
      >
        <div className="flex items-center justify-between w-full lg:w-auto shrink-0 z-30">
          <div className="flex items-center gap-2">
            <div className="bg-linear-to-br from-blue-500 to-blue-700 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <ChartNetwork className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-(--text-main) text-sm tracking-tight">
                Kivo Graph
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {nodesCount > 0 ? `${nodesCount} Nodes` : "No Data"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2.5 text-(--text-main) bg-(--bg) border border-(--border) rounded-xl hover:bg-(--border) transition-all"
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
          w-full lg:flex-1 lg:flex lg:items-center lg:justify-end gap-3 transition-all duration-300
          ${isMobileMenuOpen ? "flex flex-col mt-6 opacity-100" : "hidden lg:flex"}
        `}
        >
          {isAdmin && (
            <div className="flex items-center gap-2 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg lg:mr-2">
              <MousePointerClick className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                Right Click For More Options
              </span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-5 lg:flex gap-2 shrink-0">
              {isAdmin && (
                <>
                  <button
                    onClick={handleSaveLayout}
                    disabled={isSaving}
                    className={`p-2.5 rounded-xl transition border flex justify-center items-center group ${
                      isSaving
                        ? "bg-(--border) opacity-50 cursor-not-allowed"
                        : "bg-(--bg) border-(--border) text-(--text-main) hover:border-green-500/50 hover:bg-green-500/5"
                    }`}
                    title="Save Layout"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 group-hover:text-green-500" />
                    )}
                  </button>

                  <button
                    onClick={handleDownloadJSON}
                    className="p-2.5 rounded-xl transition bg-(--bg) border border-(--border) text-(--text-main) hover:border-blue-500/50 hover:bg-blue-500/5 flex justify-center items-center group"
                    title="Download JSON"
                  >
                    <Download className="w-4 h-4 group-hover:text-blue-500" />
                  </button>
                </>
              )}
              <button
                onClick={handleExportImage}
                className="p-2.5 rounded-xl transition bg-(--bg) border border-(--border) text-(--text-main) hover:bg-(--border) flex justify-center items-center"
                title="Capture Image"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  toggleFilterPanel();
                  setIsMobileMenuOpen(false);
                }}
                className="p-2.5 lg:px-4 rounded-xl transition bg-(--bg) border border-(--border) text-(--text-main) hover:bg-(--border) flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                <span className="text-xs font-semibold lg:hidden min-[1250px]:inline">
                  Filters
                </span>
              </button>
              <button
                onClick={toggleTheme}
                className="p-2.5 flex items-center justify-center bg-(--bg) border border-(--border) rounded-xl hover:bg-(--border) transition text-(--text-main)"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <CompanySelector />
              <div className="relative group shrink-0">
                <select
                  className="h-10 rounded-xl border border-(--border) bg-(--bg) text-(--text-main) text-sm pl-3 pr-10 outline-none cursor-pointer w-full sm:w-36 min-[1250px]:w-44 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none"
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
                        className="bg-(--card-bg)"
                      >
                        {groupedNodes[module].map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.fullLabel}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-(--text-sub) pointer-events-none group-focus-within:text-blue-500" />
              </div>

              <div className="relative w-full sm:w-55 min-[1250px]:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-(--text-sub)" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 h-10 text-sm bg-(--bg) text-(--text-main) border border-(--border) rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                />

                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-(--card-bg) border border-(--border) rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto z-60 backdrop-blur-lg">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => jumpToNode(s.id)}
                        className="w-full px-4 py-2.5 text-left text-xs hover:bg-blue-500/10 flex justify-between items-center text-(--text-main) border-b border-(--border) last:border-none transition-colors"
                      >
                        <span className="font-medium truncate mr-2">
                          {s.fullLabel || s.label}
                        </span>
                        <span
                          className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border shrink-0"
                          style={{
                            color: getNodeColor(s.module),
                            borderColor: `${getNodeColor(s.module)}40`,
                            backgroundColor: `${getNodeColor(s.module)}10`,
                          }}
                        >
                          {s.module}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              className="relative shrink-0 pt-4 lg:pt-0 lg:ml-2 border-t lg:border-t-0 border-(--border)"
              ref={profileRef}
            >
              {status === "loading" ? (
                <div className="w-10 h-10 rounded-full bg-(--border) animate-pulse"></div>
              ) : session ? (
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-10 h-10 mx-auto lg:mx-0 flex items-center justify-center bg-linear-to-tr from-orange-500 to-orange-600 text-white rounded-full hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95 ring-2 ring-(--bg)"
                >
                  <User className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="w-full lg:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 h-10 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  <LogIn className="w-4 h-4" /> <span>Login</span>
                </button>
              )}

              {isProfileOpen && session && (
                <div className="absolute bottom-full lg:bottom-auto lg:top-full right-0 lg:right-0 mb-4 lg:mb-0 lg:mt-3 w-64 bg-(--card-bg) border border-(--border) rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-70 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-(--border) mb-1">
                    <p className="text-sm font-bold text-(--text-main) truncate">
                      {session.user?.name}
                    </p>
                    <p className="text-[11px] text-(--text-sub) truncate mb-2">
                      {session.user?.email}
                    </p>
                    <span className="text-[9px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full uppercase font-black tracking-widest">
                      {session.user?.role}
                    </span>
                  </div>
                  {session.user?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-(--text-main) hover:bg-(--border) rounded-xl transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 opacity-70" /> Admin
                      Panel
                    </Link>
                  )}
                  <button
                    onClick={() => setIsSignOutModalOpen(true)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors w-full text-left font-medium"
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
