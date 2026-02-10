"use client";

import { useActionState, useEffect, useState, useRef, useMemo } from "react";
import {
  saveCompany,
  deleteCompany,
  getCompanies,
  getStatistics,
} from "@/app/actions/companyActions";
import {
  getUsers,
  toggleUserRole,
  deleteUser,
} from "@/app/actions/userActions";
import { uploadGraph, getGraphLogs } from "@/app/actions/graphActions";
import {
  saveModule,
  deleteModule,
  getModules,
} from "@/app/actions/moduleActions";
import { savePolicy, getCompanyPolicies } from "@/app/actions/policyActions";
import { COLORS, PRESET_COLORS, MODULE_FEATURES } from "@/utils/constants";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";
import Toast from "@/components/Toast";
import { useGraphStore } from "@/store/useGraphStore";
import {
  User,
  LogOut,
  Home,
  Building2,
  Users,
  Layers,
  Pencil,
  Trash,
  Shield,
  Search,
  Sun,
  Moon,
  FileJson,
  UploadCloud,
  PlusCircle,
  Trash2,
  Link as LinkIcon,
  FileUp,
  Check,
  Activity,
  Calendar,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

type SortOption = "name-asc" | "name-desc" | "modules-most" | "modules-least";
type Tab = "companies" | "users" | "modules" | "logs";

export default function AdminPage() {
  const { isDarkMode, toggleTheme } = useGraphStore();
  const [activeTab, setActiveTab] = useState<Tab>("companies");
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [dynamicModules, setDynamicModules] = useState<any[]>([]);
  const [stats, setStats] = useState({
    companyCount: 0,
    userCount: 0,
    moduleCount: 0,
  });

  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<
    "all" | "admin" | "user"
  >("all");
  const [moduleSearch, setModuleSearch] = useState("");
  const [moduleTypeFilter, setModuleTypeFilter] = useState<
    "all" | "default" | "custom"
  >("all");
  const [logSearch, setLogSearch] = useState("");
  const [logDateFilter, setLogDateFilter] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formModules, setFormModules] = useState<Set<string>>(new Set());
  const [moduleFeatures, setModuleFeatures] = useState<
    Record<string, Set<string>>
  >({});
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [moduleName, setModuleName] = useState("");
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [selectedModuleColor, setSelectedModuleColor] = useState("#3b82f6");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const uploadFormRef = useRef<HTMLFormElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({ message: "", type: null });

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDangerous: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    isDangerous: false,
    onConfirm: () => {},
  });

  const [uploadState, uploadAction, isUploading] = useActionState(uploadGraph, {
    success: false,
    message: "",
  });
  const [moduleState, moduleAction, isModulePending] = useActionState(
    saveModule,
    { success: false, message: "" },
  );

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (uploadState?.success) {
      setToast({
        message: uploadState.message || "Graph updated successfully",
        type: "success",
      });
      setSelectedFileName(null);
      if (uploadFormRef.current) uploadFormRef.current.reset();
      fetchData();
    } else if (uploadState?.message) {
      setToast({ message: uploadState.message, type: "error" });
    }
  }, [uploadState]);

  useEffect(() => {
    if (moduleState?.success) {
      setToast({ message: moduleState.message, type: "success" });
      resetModuleForm();
      fetchData();
    } else if (moduleState?.message) {
      setToast({ message: moduleState.message, type: "error" });
    }
  }, [moduleState]);

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

  async function fetchData() {
    try {
      const [companyData, userData, statsData, logsData, modulesData] =
        await Promise.all([
          getCompanies(),
          getUsers(),
          getStatistics(),
          getGraphLogs(),
          getModules(),
        ]);
      setCompanies(companyData);
      setUsers(userData);
      setStats(statsData);
      setLogs(logsData);
      setDynamicModules(modulesData);
    } catch (error) {
      console.error(error);
    }
  }

  const sortedCompanies = useMemo(() => {
    const sorted = [...companies];
    switch (sortOption) {
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "modules-most":
        return sorted.sort(
          (a, b) =>
            (b.allowedModules?.length || 0) - (a.allowedModules?.length || 0),
        );
      case "modules-least":
        return sorted.sort(
          (a, b) =>
            (a.allowedModules?.length || 0) - (b.allowedModules?.length || 0),
        );
      default:
        return sorted;
    }
  }, [companies, sortOption]);

  const allAvailableModules = useMemo(() => {
    const dynamicNames = dynamicModules.map((m) => m.name);
    const defaultNames = Object.keys(COLORS);
    return Array.from(new Set([...defaultNames, ...dynamicNames]));
  }, [dynamicModules]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const combinedModules = useMemo(() => {
    const defaultMods = Object.entries(COLORS).map(([name, color]) => ({
      _id: `default-${name}`,
      name,
      color,
      type: "default" as const,
    }));
    const customMods = dynamicModules.map((m) => ({
      ...m,
      type: "custom" as const,
    }));
    return [...defaultMods, ...customMods];
  }, [dynamicModules]);

  const filteredModules = useMemo(() => {
    return combinedModules.filter((m) => {
      const matchesSearch = m.name
        .toLowerCase()
        .includes(moduleSearch.toLowerCase());
      const matchesType =
        moduleTypeFilter === "all" || m.type === moduleTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [combinedModules, moduleSearch, moduleTypeFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.fileName.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.uploaderEmail.toLowerCase().includes(logSearch.toLowerCase());
      let matchesDate = true;
      if (logDateFilter) {
        const logDate = new Date(log.uploadedAt).toISOString().split("T")[0];
        matchesDate = logDate === logDateFilter;
      }
      return matchesSearch && matchesDate;
    });
  }, [logs, logSearch, logDateFilter]);

  const uploadLogs = useMemo(
    () => filteredLogs.filter((log) => !log.fileName.startsWith("Manual")),
    [filteredLogs],
  );
  const activityLogs = useMemo(
    () => filteredLogs.filter((log) => log.fileName.startsWith("Manual")),
    [filteredLogs],
  );

  async function handleEdit(company: any) {
    setActiveTab("companies");
    setEditingId(company._id);
    setFormName(company.name);
    setFormModules(new Set(company.allowedModules));
    const policies = await getCompanyPolicies(company._id);
    const featureMap: Record<string, Set<string>> = {};
    Object.keys(policies).forEach((mod) => {
      featureMap[mod] = new Set(policies[mod]);
    });
    setModuleFeatures(featureMap);
  }

  function handleEditModule(mod: any) {
    if (mod.type === "default") return;
    setEditingModuleId(mod._id);
    setModuleName(mod.name);
    setSelectedModuleColor(mod.color);
  }

  function resetModuleForm() {
    setEditingModuleId(null);
    setModuleName("");
    setSelectedModuleColor("#3b82f6");
  }

  function toggleModule(mod: string) {
    const newSet = new Set(formModules);
    if (newSet.has(mod)) newSet.delete(mod);
    else newSet.add(mod);
    setFormModules(newSet);
  }

  function toggleFeature(mod: string, feature: string) {
    setModuleFeatures((prev) => {
      const currentFeatures = new Set(prev[mod] || []);
      if (currentFeatures.has(feature)) currentFeatures.delete(feature);
      else currentFeatures.add(feature);
      return { ...prev, [mod]: currentFeatures };
    });
  }

  function toggleAllFeatures(mod: string) {
    const features = MODULE_FEATURES[mod] || [];
    setModuleFeatures((prev) => {
      const currentFeatures = prev[mod] || new Set();
      if (currentFeatures.size === features.length) {
        const next = { ...prev };
        delete next[mod];
        return next;
      } else {
        return { ...prev, [mod]: new Set(features) };
      }
    });
  }

  function resetForm() {
    setEditingId(null);
    setFormName("");
    setFormModules(new Set());
    setModuleFeatures({});
  }

  async function handleCompanySubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingCompany(true);
    const formData = new FormData();
    if (editingId) formData.append("id", editingId);
    formData.append("name", formName);
    const moduleArray = Array.from(formModules);
    moduleArray.forEach((m) => formData.append("modules", m));
    formData.append(
      "modulesConfig",
      JSON.stringify(
        moduleArray.map((m) => ({
          moduleId: m,
          features: Array.from(moduleFeatures[m] || []),
        })),
      ),
    );
    try {
      const result = await saveCompany(null, formData);
      if (result.success) {
        let targetId = editingId;
        if (!targetId) {
          const refreshedCompanies = await getCompanies();
          const newCompany = refreshedCompanies.find(
            (c: any) => c.name === formName,
          );
          if (newCompany) targetId = newCompany._id;
        }
        if (targetId) {
          await Promise.all(
            Array.from(formModules).map((mod) =>
              savePolicy(targetId!, mod, Array.from(moduleFeatures[mod] || [])),
            ),
          );
        }
        setToast({ message: result.message, type: "success" });
        resetForm();
        fetchData();
      } else {
        setToast({ message: result.message, type: "error" });
      }
    } catch {
      setToast({ message: "An unexpected error occurred", type: "error" });
    } finally {
      setIsSavingCompany(false);
    }
  }

  const getLogDisplayData = (fileName: string) => {
    if (fileName.startsWith("Manual Add:"))
      return {
        type: "NODE ADDED",
        details: fileName.replace("Manual Add: ", ""),
        icon: PlusCircle,
        style:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    if (fileName.startsWith("Manual Delete:"))
      return {
        type: "DELETED",
        details: fileName.replace("Manual Delete: ", ""),
        icon: Trash2,
        style:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      };
    if (fileName.startsWith("Manual Connect:"))
      return {
        type: "CONNECTED",
        details: fileName.replace("Manual Connect: ", ""),
        icon: LinkIcon,
        style: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      };
    if (fileName.startsWith("Manual Disconnect:"))
      return {
        type: "DISCONNECTED",
        details: fileName.replace("Manual Disconnect: ", ""),
        icon: LinkIcon,
        style:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    return {
      type: "FILE UPLOAD",
      details: fileName,
      icon: FileUp,
      style:
        "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    };
  };

  const navItems = [
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "users", label: "Users", icon: Users },
    { id: "modules", label: "Modules", icon: Layers },
    { id: "logs", label: "Activity Log", icon: Activity },
  ];

  return (
    <div className="h-screen w-full bg-(--bg) text-(--text-main) flex overflow-hidden transition-colors duration-300">
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-100">
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, message: "" })}
        />
      </div>

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        isDangerous={confirmation.isDangerous}
      />

      <aside className="h-full w-64 bg-(--card-bg) border-r border-(--border) flex flex-col z-50 shrink-0">
        <div className="h-16 flex items-center gap-3 px-4 border-b border-(--border) bg-linear-to-r from-orange-500/5 to-transparent">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-md">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-(--text-main)">
              Admin Dashboard
            </h1>
            <p className="text-[8px] font-bold text-(--text-sub) uppercase tracking-widest">
              Control Panel
            </p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${isActive ? "bg-(--card-hover) shadow-sm text-(--text-main)" : "text-(--text-sub) hover:bg-orange-500/10 hover:text-(--text-main)"}`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />
                )}
                <item.icon
                  className={`w-4 h-4 ${isActive ? "text-orange-500" : "text-(--text-sub) group-hover:text-orange-500"}`}
                  strokeWidth={2.5}
                />
                <span className="text-sm font-bold tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 space-y-2 border-t border-(--border)">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-(--card-hover) hover:bg-orange-500/10 transition-all text-(--text-main)"
          >
            <Home className="w-4 h-4 text-(--text-sub)" strokeWidth={2.5} />
            <span className="text-sm font-bold">Graph View</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-(--card-hover) hover:bg-orange-500/10 transition-all border border-(--border) text-(--text-main)"
          >
            {isDarkMode ? (
              <Moon className="w-4 h-4 text-(--text-sub)" strokeWidth={2.5} />
            ) : (
              <Sun className="w-4 h-4 text-(--text-sub)" strokeWidth={2.5} />
            )}
            <span className="text-sm font-bold">
              {isDarkMode ? "Dark Mode" : "Light Mode"}
            </span>
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-(--card-hover) hover:bg-orange-500/10 transition-all text-(--text-main)"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                {session?.user?.name?.charAt(0) || "A"}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-xs font-bold truncate">
                  {session?.user?.name || "Admin"}
                </p>
                <p className="text-[10px] text-(--text-sub) truncate">
                  {session?.user?.email}
                </p>
              </div>
            </button>
            {isProfileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-(--card-bg) border border-(--border) rounded-xl shadow-xl p-2 z-50">
                <button
                  onClick={() =>
                    setConfirmation({
                      isOpen: true,
                      title: "Sign Out?",
                      message:
                        "Are you sure you want to sign out? You will need to log in again to access the admin panel.",
                      isDangerous: true,
                      onConfirm: () => signOut({ callbackUrl: "/login" }),
                    })
                  }
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-bold">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden p-4">
        <header className="shrink-0 h-16 bg-(--card-bg) border border-(--border) rounded-2xl shadow-sm flex items-center justify-between px-6 mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black capitalize text-(--text-main)">
              {activeTab}
            </h2>
            <div className="h-6 w-px bg-(--border)" />
            <span className="text-xs font-bold text-(--text-sub) uppercase tracking-widest">
              Console
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--card-hover) hover:bg-emerald-500/10 transition-colors border border-(--border) text-(--text-main)">
            <TrendingUp
              className="w-3.5 h-3.5 text-emerald-500"
              strokeWidth={2.5}
            />
            <span className="text-[10px] font-bold">Kivo Dependency Graph</span>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
          {[
            {
              label: "Companies",
              count: stats.companyCount,
              icon: Building2,
              color: "orange",
            },
            {
              label: "Users",
              count: stats.userCount,
              icon: Users,
              color: "sky",
            },
            {
              label: "Modules",
              count: stats.moduleCount,
              icon: Layers,
              color: "purple",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-(--card-bg) border border-(--border) rounded-2xl p-4 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] font-bold text-(--text-sub) uppercase tracking-widest mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-(--text-main)">
                  {stat.count}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}
              >
                <stat.icon
                  className={`w-5 h-5 text-${stat.color}-500`}
                  strokeWidth={2.5}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-(--card-bg) border border-(--border) rounded-2xl shadow-lg overflow-hidden flex flex-col">
          {activeTab === "companies" && (
            <div className="flex-1 flex divide-x divide-(--border) overflow-hidden">
              <div className="w-196 flex flex-col bg-(--card-hover) overflow-hidden">
                <div className="p-4 border-b border-(--border) flex justify-between items-center shrink-0">
                  <h3 className="text-sm font-black text-(--text-main)">
                    {editingId ? "Edit" : "Add New"} Company
                  </h3>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="text-xs font-bold text-orange-600 hover:text-orange-500 hover:underline transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                  <form
                    id="company-form"
                    onSubmit={handleCompanySubmit}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-[16px] font-bold text-(--text-sub) uppercase mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Acme Corp"
                        className="w-full px-3 py-2.5 rounded-xl border border-(--border) text-sm font-bold focus:ring-2 focus:ring-orange-500/20 outline-none bg-(--input-bg) text-(--text-main)"
                      />
                    </div>
                    <div>
                      <label className="block text-[16px] font-bold text-(--text-sub) uppercase mb-2">
                        Module Access
                      </label>
                      <div className="space-y-2">
                        {allAvailableModules.map((mod) => (
                          <div
                            key={mod}
                            onClick={() => toggleModule(mod)}
                            className={`cursor-pointer rounded-xl border px-3 py-2.5 flex items-center justify-between transition-all ${formModules.has(mod) ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-(--card-bg) border-(--border) text-(--text-main) hover:border-orange-500/50 hover:bg-orange-500/5"}`}
                          >
                            <span className="text-sm font-bold">{mod}</span>
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${formModules.has(mod) ? "bg-white border-white" : "border-(--border)"}`}
                            >
                              {formModules.has(mod) && (
                                <Check
                                  className="w-3 h-3 text-orange-500"
                                  strokeWidth={4}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {Array.from(formModules).some(
                      (m) => MODULE_FEATURES[m],
                    ) && (
                      <div className="pt-4 border-t border-(--border)">
                        <label className="block text-[16px] font-bold text-(--text-sub) uppercase mb-2">
                          Granular Permissions
                        </label>
                        <div className="space-y-4">
                          {Array.from(formModules).map((mod) => {
                            const features = MODULE_FEATURES[mod];
                            if (!features) return null;
                            return (
                              <div
                                key={mod}
                                className="bg-(--input-bg) border border-(--border) rounded-xl overflow-hidden"
                              >
                                <div className="px-3 py-2 bg-(--card-hover) border-b border-(--border) flex justify-between items-center">
                                  <span className="text-[16px] font-black uppercase text-(--text-main)">
                                    {mod}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleAllFeatures(mod)}
                                    className="text-[12px] font-bold text-orange-600 hover:text-orange-500 hover:underline transition-colors"
                                  >
                                    Toggle All
                                  </button>
                                </div>
                                <div className="p-2 grid grid-cols-2 gap-x-4 gap-y-1">
                                  {features.map((feat) => (
                                    <label
                                      key={feat}
                                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-orange-500/10 cursor-pointer transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={
                                          moduleFeatures[mod]?.has(feat) ||
                                          false
                                        }
                                        onChange={() =>
                                          toggleFeature(mod, feat)
                                        }
                                        className="rounded border-(--border) text-orange-500 focus:ring-orange-500/20"
                                      />
                                      <span className="text-sm font-semibold text-(--text-main) truncate">
                                        {feat}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </form>
                </div>
                <div className="p-4 border-t border-(--border) shrink-0 bg-(--card-bg)">
                  <button
                    form="company-form"
                    disabled={isSavingCompany}
                    className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-orange-600 hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isSavingCompany
                      ? "Saving..."
                      : editingId
                        ? "Update Company"
                        : "Create Company"}
                  </button>
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden bg-(--bg)">
                <div className="p-4 border-b border-(--border) bg-(--card-bg) flex items-center justify-between shrink-0">
                  <span className="text-[12px] font-black text-(--text-sub) uppercase tracking-widest">
                    Registry ({sortedCompanies.length})
                  </span>
                  <select
                    value={sortOption}
                    onChange={(e) =>
                      setSortOption(e.target.value as SortOption)
                    }
                    className="text-xs font-bold border border-(--border) rounded-lg px-2 py-1.5 outline-none bg-(--input-bg) text-(--text-main) hover:border-orange-500 focus:border-orange-500 transition-colors"
                  >
                    <option value="name-asc">Name: A-Z</option>
                    <option value="name-desc">Name: Z-A</option>
                    <option value="modules-most">Modules: Most</option>
                    <option value="modules-least">Modules: Least</option>
                  </select>
                </div>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 gap-3">
                    {sortedCompanies.map((company) => (
                      <div
                        key={company._id}
                        className={`p-4 rounded-xl border flex items-center justify-between group transition-all duration-200 ${editingId === company._id ? "bg-orange-500/10 border-orange-500 ring-1 ring-orange-500/20" : "bg-(--card-bg) border-(--border) hover:border-orange-500/50 hover:bg-orange-500/5 hover:shadow-sm"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border shadow-sm ${editingId === company._id ? "bg-orange-500/20 text-orange-500 border-orange-500" : "bg-(--bg) text-(--text-sub) border-(--border)"}`}
                          >
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4
                              className={`font-bold text-sm ${editingId === company._id ? "text-orange-500" : "text-(--text-main)"}`}
                            >
                              {company.name}
                            </h4>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {company.allowedModules?.map((m: string) => (
                                <span
                                  key={m}
                                  className="text-[9px] font-bold bg-(--bg) border border-(--border) px-1.5 py-0.5 rounded text-(--text-sub) uppercase tracking-wide"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(company)}
                            className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500 hover:text-white transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmation({
                                isOpen: true,
                                title: "Delete Company?",
                                message: "This cannot be undone.",
                                isDangerous: true,
                                onConfirm: async () => {
                                  const res = await deleteCompany(company._id);
                                  if (res.success) fetchData();
                                },
                              })
                            }
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-(--bg)">
              <div className="p-4 border-b border-(--border) bg-(--card-bg) flex gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-sub)" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-(--border) text-sm font-bold bg-(--input-bg) text-(--text-main) hover:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-colors"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value as any)}
                  className="px-4 py-2.5 rounded-xl border border-(--border) text-xs font-bold bg-(--input-bg) text-(--text-main) hover:border-sky-500 outline-none transition-colors"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="user">Users</option>
                </select>
              </div>
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  {filteredUsers.map((user, index) => (
                    <div
                      key={user._id}
                      className="p-4 rounded-xl border border-(--border) bg-(--card-bg) hover:shadow-md hover:border-sky-500/50 hover:bg-sky-500/5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-(--text-sub) w-6">
                            {index + 1}
                          </span>
                          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-(--text-main)">
                              {user.name}
                            </p>
                            <p className="text-xs text-(--text-sub) font-medium">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${user.role === "admin" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"}`}
                          >
                            {user.role}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                setConfirmation({
                                  isOpen: true,
                                  title: "Change Role?",
                                  message: "Confirm role update",
                                  isDangerous: false,
                                  onConfirm: async () => {
                                    const res = await toggleUserRole(
                                      user._id,
                                      user.role,
                                    );
                                    if (res.success) fetchData();
                                  },
                                })
                              }
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${user.role === "admin" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500 hover:text-white" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"}`}
                            >
                              {user.role === "admin" ? (
                                <ArrowDownCircle className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpCircle className="w-3.5 h-3.5" />
                              )}
                              {user.role === "admin" ? "Demote" : "Promote"}
                            </button>
                            <button
                              onClick={() =>
                                setConfirmation({
                                  isOpen: true,
                                  title: "Delete User?",
                                  message: "Confirm deletion",
                                  isDangerous: true,
                                  onConfirm: async () => {
                                    const res = await deleteUser(user._id);
                                    if (res.success) fetchData();
                                  },
                                })
                              }
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "modules" && (
            <div className="flex-1 flex divide-x divide-(--border) overflow-hidden">
              <div className="w-96 flex flex-col bg-(--card-hover) overflow-hidden">
                <div className="p-4 border-b border-(--border) flex justify-between items-center shrink-0">
                  <h3 className="text-sm font-black text-(--text-main)">
                    {editingModuleId ? "Edit" : "New"} Module
                  </h3>
                  {editingModuleId && (
                    <button
                      onClick={resetModuleForm}
                      className="text-xs font-bold text-purple-600 hover:text-purple-500 hover:underline transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                  <form
                    id="module-form"
                    action={moduleAction}
                    className="space-y-6"
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={editingModuleId || ""}
                    />
                    <div>
                      <label className="block text-[10px] font-bold text-(--text-sub) uppercase mb-2">
                        Module Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={moduleName}
                        onChange={(e) => setModuleName(e.target.value)}
                        placeholder="e.g. Finance"
                        className="w-full px-3 py-2.5 rounded-xl border border-(--border) text-sm font-bold bg-(--input-bg) text-(--text-main) focus:ring-2 focus:ring-purple-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-(--text-sub) uppercase mb-2">
                        Branding Color
                      </label>
                      <input
                        type="hidden"
                        name="color"
                        value={selectedModuleColor}
                      />
                      <div className="flex flex-wrap gap-3">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSelectedModuleColor(c)}
                            className={`w-10 h-10 rounded-xl transition-all ${selectedModuleColor === c ? "scale-110 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900" : "hover:scale-105"}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <div className="relative w-10 h-10 rounded-xl border-2 border-dashed border-(--border) flex items-center justify-center hover:bg-purple-500/10 transition-colors">
                          <input
                            type="color"
                            value={selectedModuleColor}
                            onChange={(e) =>
                              setSelectedModuleColor(e.target.value)
                            }
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <PlusCircle className="w-5 h-5 text-(--text-sub)" />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="p-4 border-t border-(--border) shrink-0 bg-(--card-bg)">
                  <button
                    form="module-form"
                    disabled={isModulePending}
                    className="w-full bg-purple-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-purple-600 hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isModulePending ? "Saving..." : "Save Module"}
                  </button>
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden bg-(--bg)">
                <div className="p-4 border-b border-(--border) bg-(--card-bg) flex gap-3 shrink-0">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-sub)" />
                    <input
                      type="text"
                      placeholder="Search modules..."
                      value={moduleSearch}
                      onChange={(e) => setModuleSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-(--border) text-sm font-bold bg-(--input-bg) text-(--text-main) hover:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors"
                    />
                  </div>
                  <select
                    value={moduleTypeFilter}
                    onChange={(e) => setModuleTypeFilter(e.target.value as any)}
                    className="px-4 py-2.5 rounded-xl border border-(--border) text-xs font-bold bg-(--input-bg) text-(--text-main) hover:border-purple-500 outline-none transition-colors"
                  >
                    <option value="all">All Types</option>
                    <option value="default">System</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    {filteredModules.map((mod) => (
                      <div
                        key={mod._id}
                        className={`p-4 rounded-xl border border-(--border) flex items-center justify-between transition-all hover:shadow-md hover:border-purple-500/50 hover:bg-purple-500/5 ${mod.type === "default" ? "bg-(--card-hover) opacity-80" : "bg-(--card-bg)"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-xl shadow-sm border border-(--border)"
                            style={{ backgroundColor: mod.color }}
                          />
                          <div>
                            <p className="font-bold text-sm text-(--text-main)">
                              {mod.name}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${mod.type === "default" ? "bg-slate-500/10 text-slate-600 border-slate-500/20" : "bg-purple-500/10 text-purple-600 border-purple-500/20"}`}
                            >
                              {mod.type}
                            </span>
                          </div>
                        </div>
                        {mod.type === "custom" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditModule(mod)}
                              className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white transition-all border border-purple-500/20"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmation({
                                  isOpen: true,
                                  title: "Delete Module?",
                                  message: "Confirm module deletion",
                                  isDangerous: true,
                                  onConfirm: async () => {
                                    const res = await deleteModule(mod._id);
                                    if (res.success) fetchData();
                                  },
                                })
                              }
                              className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="flex-1 flex overflow-hidden">
              <div className="w-[30%] flex flex-col p-6 bg-(--card-hover) border-r border-(--border)">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-black text-(--text-main)">
                      Graph Update
                    </h3>
                  </div>
                  <p className="text-[10px] font-bold text-(--text-sub) uppercase tracking-widest">
                    Deploy JSON Configuration
                  </p>
                </div>
                <form
                  ref={uploadFormRef}
                  action={uploadAction}
                  className="flex-1 flex flex-col gap-6"
                >
                  <input
                    type="hidden"
                    name="uploaderEmail"
                    value={session?.user?.email || ""}
                  />
                  <div className="flex-1 min-h-37.5 border-2 border-dashed border-(--border) rounded-2xl flex flex-col items-center justify-center relative hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group bg-(--card-bg)">
                    <FileJson
                      className={`w-12 h-12 mb-4 transition-all ${selectedFileName ? "text-emerald-500 scale-110" : "text-(--text-sub) group-hover:text-emerald-500"}`}
                    />
                    <label className="absolute inset-0 cursor-pointer w-full h-full z-10">
                      <input
                        type="file"
                        name="file"
                        accept=".json"
                        required
                        onChange={(e) =>
                          setSelectedFileName(e.target.files?.[0]?.name || null)
                        }
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                    <div className="text-center px-4">
                      {selectedFileName ? (
                        <>
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 break-all">
                            {selectedFileName}
                          </p>
                          <p className="text-[12px] text-emerald-500 mt-1 font-bold">
                            Ready for deployment
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-(--text-main)">
                            Click or drag JSON here
                          </p>
                          <p className="text-[12px] text-(--text-sub) mt-1">
                            Updates the graph structure
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    disabled={isUploading || !selectedFileName}
                    className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isUploading ? (
                      "Deploying..."
                    ) : (
                      <>
                        <Check className="w-4 h-4" strokeWidth={3} />
                        Apply Changes
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden bg-(--bg)">
                <div className="p-4 border-b border-(--border) bg-(--card-bg) flex gap-4 shrink-0">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-sub)" />
                    <input
                      type="text"
                      placeholder="Search logs..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-(--border) text-sm font-bold bg-(--input-bg) text-(--text-main) hover:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors"
                    />
                  </div>
                  <div className="relative flex items-center">
                    <button
                      onClick={() => dateInputRef.current?.showPicker()}
                      className="flex items-center gap-3 px-4 py-2 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all cursor-pointer group"
                    >
                      <Calendar className="w-4 h-4 transition-colors group-hover:text-white" />
                      <span className="text-xs font-bold min-w-20text-left">
                        {logDateFilter || "dd/mm/yyyy"}
                      </span>
                    </button>
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={logDateFilter}
                      onChange={(e) => setLogDateFilter(e.target.value)}
                      className="absolute inset-0 opacity-0 pointer-events-none"
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col divide-y divide-(--border) overflow-hidden">
                  <div className="h-1/2 flex flex-col overflow-hidden">
                    <div className="px-6 py-3 bg-(--card-hover) border-b border-(--border) flex justify-between items-center shrink-0">
                      <span className="text-[12px] font-black uppercase text-(--text-sub) tracking-widest">
                        File Upload History
                      </span>
                      <span className="text-[12px] font-bold bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded-full">
                        {uploadLogs.length}
                      </span>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-(--card-bg) border-b border-(--border) z-10">
                          <tr>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-(--text-sub)">
                              File Name
                            </th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-(--text-sub)">
                              User
                            </th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-(--text-sub)">
                              Timestamp
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border)">
                          {uploadLogs.map((log) => (
                            <tr
                              key={log._id}
                              className="hover:bg-emerald-500/5 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600 border border-violet-500/20">
                                    <FileUp className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-bold text-(--text-main)">
                                    {log.fileName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs font-medium text-(--text-sub)">
                                {log.uploaderEmail}
                              </td>
                              <td className="px-6 py-4 text-xs text-(--text-sub)">
                                {new Date(log.uploadedAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="h-1/2 flex flex-col overflow-hidden">
                    <div className="px-6 py-3 bg-(--card-hover) border-b border-(--border) flex justify-between items-center shrink-0">
                      <span className="text-[12px] font-black uppercase text-(--text-sub) tracking-widest">
                        Manual Actions
                      </span>
                      <span className="text-[12px] font-bold bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded-full">
                        {activityLogs.length}
                      </span>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-(--card-bg) border-b border-(--border) z-10">
                          <tr>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-(--text-sub)">
                              Action Type
                            </th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-(--text-sub)">
                              Details
                            </th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-(--text-sub)">
                              User
                            </th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-(--text-sub)">
                              Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border)">
                          {activityLogs.map((log) => {
                            const display = getLogDisplayData(log.fileName);
                            const Icon = display.icon;
                            return (
                              <tr
                                key={log._id}
                                className="hover:bg-emerald-500/5 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <div
                                    className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-[9px] font-black tracking-widest ${display.style}`}
                                  >
                                    <Icon
                                      className="w-3 h-3"
                                      strokeWidth={2.5}
                                    />
                                    {display.type}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-(--text-main)">
                                  {display.details}
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-(--text-sub)">
                                  {log.uploaderEmail}
                                </td>
                                <td className="px-6 py-4 text-xs text-(--text-sub)">
                                  {new Date(
                                    log.uploadedAt,
                                  ).toLocaleTimeString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
