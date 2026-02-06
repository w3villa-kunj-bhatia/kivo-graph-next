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
  TrendingUp,
  Pencil,
  Trash,
  X,
  ArrowUpDown,
  Shield,
  ShieldAlert,
  Search,
  Sun,
  Moon,
  History,
  FileJson,
  UploadCloud,
  CheckCircle,
  PlusCircle,
  Trash2,
  Link as LinkIcon,
  FileUp,
  Palette,
  Activity,
  Check,
  LayoutGrid,
  Filter,
  Calendar,
} from "lucide-react";

type SortOption = "name-asc" | "name-desc" | "modules-most" | "modules-least";
type Tab = "companies" | "users" | "logs" | "modules";

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

  // Filters & Search States
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

  // User Filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<
    "all" | "admin" | "user"
  >("all");

  // Module Filters
  const [moduleSearch, setModuleSearch] = useState("");
  const [moduleTypeFilter, setModuleTypeFilter] = useState<
    "all" | "default" | "custom"
  >("all");

  // Log Filters
  const [logSearch, setLogSearch] = useState("");
  const [logDateFilter, setLogDateFilter] = useState("");

  // Editing States
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
  const { data: session } = useSession();

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({
    message: "",
    type: null,
  });

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
    {
      success: false,
      message: "",
    },
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
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
      if (uploadFormRef.current) {
        uploadFormRef.current.reset();
      }
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
      console.error("Failed to fetch admin data", error);
    }
  }

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const sortedCompanies = useMemo(() => {
    const sorted = [...companies];
    switch (sortOption) {
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "modules-most":
        return sorted.sort(
          (a, b) => b.allowedModules.length - a.allowedModules.length,
        );
      case "modules-least":
        return sorted.sort(
          (a, b) => a.allowedModules.length - b.allowedModules.length,
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

  // --- Filtering Logic ---

  // Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  // Modules
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

  // Logs
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
    if (mod.type === "default") return; // Cannot edit default modules via this flow
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
    if (newSet.has(mod)) {
      newSet.delete(mod);
    } else {
      newSet.add(mod);
    }
    setFormModules(newSet);
  }

  function toggleFeature(mod: string, feature: string) {
    setModuleFeatures((prev) => {
      const currentFeatures = new Set(prev[mod] || []);
      if (currentFeatures.has(feature)) {
        currentFeatures.delete(feature);
      } else {
        currentFeatures.add(feature);
      }
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
        if (result.message.includes("successfully")) {
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
              Array.from(formModules).map((mod) => {
                const features = Array.from(moduleFeatures[mod] || []);
                return savePolicy(targetId!, mod, features);
              }),
            );
          }
        }

        showToast(result.message, "success");
        resetForm();
        fetchData();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      console.error(error);
      showToast("An unexpected error occurred", "error");
    } finally {
      setIsSavingCompany(false);
    }
  }

  function initiateDeleteCompany(id: string) {
    setConfirmation({
      isOpen: true,
      title: "Delete Company?",
      message: "This cannot be undone. All company data will be lost.",
      isDangerous: true,
      onConfirm: async () => {
        const res = await deleteCompany(id);
        if (res.success) {
          showToast("Company deleted successfully", "success");
          fetchData();
        } else {
          showToast("Failed to delete company", "error");
        }
      },
    });
  }

  function initiateToggleRole(id: string, currentRole: string) {
    if (
      session?.user?.email === users.find((u) => u._id === id)?.email &&
      currentRole === "admin"
    ) {
      setConfirmation({
        isOpen: true,
        title: "Demote Yourself?",
        message: "You will lose admin access immediately.",
        isDangerous: true,
        onConfirm: async () => {
          await toggleUserRole(id, currentRole);
          window.location.href = "/";
        },
      });
      return;
    }

    setConfirmation({
      isOpen: true,
      title: "Change User Role?",
      message: `Are you sure you want to change this user to ${currentRole === "admin" ? "User" : "Admin"}?`,
      isDangerous: false,
      onConfirm: async () => {
        const res = await toggleUserRole(id, currentRole);
        if (res.success) {
          showToast(res.message, "success");
          fetchData();
        } else {
          showToast(res.message, "error");
        }
      },
    });
  }

  function initiateDeleteUser(id: string) {
    if (session?.user?.email === users.find((u) => u._id === id)?.email) {
      showToast("Cannot delete your own account.", "error");
      return;
    }
    setConfirmation({
      isOpen: true,
      title: "Delete User?",
      message: "This user will be permanently removed.",
      isDangerous: true,
      onConfirm: async () => {
        const res = await deleteUser(id);
        if (res.success) {
          showToast(res.message, "success");
          fetchData();
        } else {
          showToast(res.message, "error");
        }
      },
    });
  }

  function initiateDeleteModule(id: string, name: string) {
    if (Object.keys(COLORS).includes(name)) {
      showToast("Cannot delete default modules", "error");
      return;
    }

    setConfirmation({
      isOpen: true,
      title: "Delete Module?",
      message: `Are you sure you want to delete '${name}'? Existing nodes with this module will default to fallback colors.`,
      isDangerous: true,
      onConfirm: async () => {
        const res = await deleteModule(id);
        if (res.success) {
          showToast(res.message, "success");
          fetchData();
        } else {
          showToast(res.message, "error");
        }
      },
    });
  }

  const getLogDisplayData = (fileName: string) => {
    if (fileName.startsWith("Manual Add:")) {
      return {
        type: "Node Added",
        details: fileName.replace("Manual Add: ", ""),
        icon: PlusCircle,
        style:
          "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400",
      };
    }
    if (fileName.startsWith("Manual Delete:")) {
      return {
        type: "Deleted",
        details: fileName.replace("Manual Delete: ", ""),
        icon: Trash2,
        style:
          "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",
      };
    }
    if (fileName.startsWith("Manual Connect:")) {
      return {
        type: "Connected",
        details: fileName.replace("Manual Connect: ", ""),
        icon: LinkIcon,
        style:
          "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400",
      };
    }
    return {
      type: "File Upload",
      details: fileName,
      icon: FileUp,
      style:
        "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400",
    };
  };

  return (
    <div className="h-screen bg-(--bg) text-(--text-main) flex flex-col overflow-hidden transition-colors duration-300 font-sans">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, message: "" })}
      />
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        isDangerous={confirmation.isDangerous}
      />

      {/* 1. Navbar */}
      <header className="shrink-0 h-16 bg-(--bg)/90 backdrop-blur-md border-b border-(--border) px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Kivo Admin</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-(--card-bg) text-(--text-sub) hover:text-(--text-main) transition-colors border border-transparent hover:border-(--border)"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 bg-(--card-bg) hover:bg-(--border) text-(--text-main) px-4 py-2 rounded-lg text-sm font-medium border border-(--border) transition-all"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Graph View</span>
          </Link>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-9 h-9 rounded-full bg-linear-to-tr from-orange-400 to-red-500 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            >
              <User className="w-5 h-5" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-3 w-64 bg-(--card-bg) border border-(--border) rounded-xl shadow-xl p-2 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 border-b border-(--border) mb-1">
                  <p className="text-sm font-bold text-(--text-main) truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-(--text-sub) truncate">
                    {session?.user?.email}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition w-full text-left font-medium"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
        {/* Stats Row */}
        <div className="shrink-0 grid grid-cols-3 gap-6">
          <div className="bg-(--card-bg) p-4 rounded-xl border border-(--border) shadow-sm flex items-center gap-4 hover:border-blue-500/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-(--text-sub) font-semibold uppercase tracking-wider">
                Companies
              </p>
              <p className="text-2xl font-bold text-(--text-main)">
                {stats.companyCount}
              </p>
            </div>
          </div>
          <div className="bg-(--card-bg) p-4 rounded-xl border border-(--border) shadow-sm flex items-center gap-4 hover:border-purple-500/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-(--text-sub) font-semibold uppercase tracking-wider">
                Users
              </p>
              <p className="text-2xl font-bold text-(--text-main)">
                {stats.userCount}
              </p>
            </div>
          </div>
          <div className="bg-(--card-bg) p-4 rounded-xl border border-(--border) shadow-sm flex items-center gap-4 hover:border-emerald-500/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-(--text-sub) font-semibold uppercase tracking-wider">
                Modules
              </p>
              <p className="text-2xl font-bold text-(--text-main)">
                {stats.moduleCount}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="shrink-0 border-b border-(--border) flex gap-6">
          {["companies", "users", "modules", "logs"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`
                pb-3 text-sm font-bold capitalize transition-all border-b-2 
                ${
                  activeTab === tab
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-(--text-sub) hover:text-(--text-main) hover:border-(--border)"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative rounded-xl border border-(--border) bg-(--card-bg) shadow-lg">
          {activeTab === "companies" && (
            <div className="h-full flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-(--border)">
              <div
                className={`xl:w-1/3 flex flex-col h-full transition-all duration-300 relative z-10 ${
                  editingId
                    ? "bg-orange-50/50 dark:bg-orange-950/30 border-r-2 border-orange-500/20"
                    : "bg-(--card-bg) border-r border-(--border)"
                }`}
              >
                <div
                  className={`shrink-0 p-6 border-b flex justify-between items-center transition-colors ${
                    editingId
                      ? "bg-orange-100/50 dark:bg-orange-900/40 border-orange-200 dark:border-orange-800"
                      : "bg-(--card-bg) border-(--border)"
                  }`}
                >
                  <h2 className="font-bold text-lg text-(--text-main)">
                    {editingId ? "Edit Company" : "New Company"}
                  </h2>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="text-xs flex items-center gap-1 bg-(--bg) px-2 py-1 rounded-full text-(--text-sub) hover:text-(--text-main)"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                  <form
                    id="company-form"
                    onSubmit={handleCompanySubmit}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-xs font-bold text-(--text-sub) uppercase mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Company Name..."
                        className="w-full px-3 py-2 rounded-lg bg-(--bg) border border-(--border) focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none text-(--text-main)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-(--text-sub) uppercase mb-2">
                        Modules
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {allAvailableModules.map((mod) => (
                          <div
                            key={mod}
                            onClick={() => toggleModule(mod)}
                            className={`
                              cursor-pointer rounded-lg border px-3 py-2 flex items-center gap-2 transition-all select-none
                              ${
                                formModules.has(mod)
                                  ? "bg-orange-50 dark:bg-orange-900/10 border-orange-500"
                                  : "bg-(--bg) border-(--border) hover:border-orange-300"
                              }
                            `}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${formModules.has(mod) ? "bg-orange-500 border-orange-500" : "border-slate-400"}`}
                            >
                              {formModules.has(mod) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm font-medium">{mod}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {Array.from(formModules).some(
                      (m) => MODULE_FEATURES[m],
                    ) && (
                      <div className="pt-2 border-t border-(--border)">
                        <label className="block text-xs font-bold text-(--text-sub) uppercase mb-3">
                          Features
                        </label>
                        <div className="space-y-3">
                          {Array.from(formModules).map((mod) => {
                            const features = MODULE_FEATURES[mod];
                            if (!features) return null;
                            const selectedCount =
                              moduleFeatures[mod]?.size || 0;
                            return (
                              <div
                                key={mod}
                                className="bg-(--bg) border border-(--border) rounded-lg overflow-hidden"
                              >
                                <div className="px-3 py-2 border-b border-(--border) flex justify-between items-center bg-(--card-bg)">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-xs uppercase text-(--text-main)">
                                      {mod}
                                    </h4>
                                    <span className="text-[10px] font-mono text-(--text-sub) bg-(--border) px-1.5 rounded">
                                      {selectedCount}/{features.length}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleAllFeatures(mod)}
                                    className="text-[10px] font-bold text-orange-600 hover:underline"
                                  >
                                    Toggle All
                                  </button>
                                </div>
                                <div className="p-2 grid grid-cols-1 gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                                  {features.map((feature) => (
                                    <label
                                      key={feature}
                                      className="flex items-center gap-2 p-1.5 rounded hover:bg-(--card-bg) cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={
                                          moduleFeatures[mod]?.has(feature) ||
                                          false
                                        }
                                        onChange={() =>
                                          toggleFeature(mod, feature)
                                        }
                                        className="rounded border-slate-400 text-orange-500 focus:ring-orange-500"
                                      />
                                      <span className="text-xs text-(--text-main)">
                                        {feature}
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
                <div className="shrink-0 p-4 border-t border-(--border) bg-(--card-bg)">
                  <button
                    form="company-form"
                    disabled={isSavingCompany}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 shadow-md"
                  >
                    {isSavingCompany
                      ? "Processing..."
                      : editingId
                        ? "Update Company"
                        : "Create Company"}
                  </button>
                </div>
              </div>

              <div className="xl:w-2/3 flex flex-col h-full">
                <div className="shrink-0 p-3 border-b border-(--border) flex items-center justify-between bg-(--card-bg)">
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-xs font-bold text-(--text-sub) uppercase">
                      Directory
                    </span>
                    <span className="text-xs bg-(--border) px-1.5 rounded text-(--text-main)">
                      {sortedCompanies.length}
                    </span>
                  </div>
                  <select
                    value={sortOption}
                    onChange={(e) =>
                      setSortOption(e.target.value as SortOption)
                    }
                    className="text-xs bg-(--bg) border border-(--border) rounded px-2 py-1 outline-none"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="modules-most">Modules (Most)</option>
                    <option value="modules-least">Modules (Least)</option>
                  </select>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                  {sortedCompanies.map((company) => (
                    <div
                      key={company._id}
                      className={`
                        p-4 rounded-xl border flex items-center justify-between group transition-all
                        ${
                          editingId === company._id
                            ? "bg-orange-50 dark:bg-orange-900/10 border-orange-500"
                            : "bg-(--bg) border-(--border) hover:border-orange-300 dark:hover:border-orange-700"
                        }
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-500 font-bold text-lg">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3
                            className={`font-bold text-sm ${editingId === company._id ? "text-orange-600" : "text-(--text-main)"}`}
                          >
                            {company.name}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {company.allowedModules
                              .slice(0, 4)
                              .map((m: string) => (
                                <span
                                  key={m}
                                  className="text-[10px] bg-(--card-bg) border border-(--border) px-1.5 py-0.5 rounded text-(--text-sub)"
                                >
                                  {m}
                                </span>
                              ))}
                            {company.allowedModules.length > 4 && (
                              <span className="text-[10px] text-(--text-sub) px-1">
                                +{company.allowedModules.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(company)}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => initiateDeleteCompany(company._id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "modules" && (
            <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-(--border)">
              <div
                className={`md:w-1/3 flex flex-col h-full transition-all duration-300 relative z-10 ${
                  editingModuleId
                    ? "bg-pink-50/50 dark:bg-pink-950/30 border-r-2 border-pink-500/20"
                    : "bg-(--card-bg) border-r border-(--border)"
                }`}
              >
                <div
                  className={`shrink-0 p-6 border-b flex justify-between items-center transition-colors ${
                    editingModuleId
                      ? "bg-pink-100/50 dark:bg-pink-900/40 border-pink-200 dark:border-pink-800"
                      : "bg-(--card-bg) border-(--border)"
                  }`}
                >
                  <h2 className="font-bold text-lg text-(--text-main)">
                    {editingModuleId ? "Edit Module" : "New Module"}
                  </h2>
                  {editingModuleId && (
                    <button
                      onClick={resetModuleForm}
                      className="text-xs flex items-center gap-1 bg-(--bg) px-2 py-1 rounded-full text-(--text-sub)"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  )}
                </div>
                <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                  <form
                    id="module-form"
                    action={moduleAction}
                    className="space-y-5"
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={editingModuleId || ""}
                    />
                    <div>
                      <label className="block text-xs font-bold text-(--text-sub) uppercase mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={moduleName}
                        onChange={(e) => setModuleName(e.target.value)}
                        placeholder="e.g. Finance"
                        className="w-full px-3 py-2 rounded-lg bg-(--bg) border border-(--border) focus:border-pink-500 outline-none text-(--text-main)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-(--text-sub) uppercase mb-2">
                        Color
                      </label>
                      <input
                        type="hidden"
                        name="color"
                        value={selectedModuleColor}
                      />
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedModuleColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedModuleColor === color ? "border-white ring-2 ring-pink-500 scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <div className="relative w-8 h-8 rounded-full border-2 border-dashed border-(--text-sub) flex items-center justify-center">
                          <input
                            type="color"
                            value={selectedModuleColor}
                            onChange={(e) =>
                              setSelectedModuleColor(e.target.value)
                            }
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <PlusCircle className="w-4 h-4 text-(--text-sub)" />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-(--text-sub)">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedModuleColor }}
                        />
                        {selectedModuleColor}
                      </div>
                    </div>
                  </form>
                </div>
                <div className="shrink-0 p-4 border-t border-(--border) bg-(--card-bg)">
                  <button
                    form="module-form"
                    disabled={isModulePending}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2.5 rounded-lg font-bold transition-all disabled:opacity-50"
                  >
                    {isModulePending ? "Saving..." : "Save Module"}
                  </button>
                </div>
              </div>
              <div className="md:w-2/3 flex flex-col h-full">
                <div className="shrink-0 p-3 border-b border-(--border) bg-(--card-bg) flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-(--text-sub)" />
                    <input
                      type="text"
                      placeholder="Search modules..."
                      value={moduleSearch}
                      onChange={(e) => setModuleSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 w-full bg-(--bg) border border-(--border) rounded-lg text-xs outline-none focus:border-pink-500"
                    />
                  </div>
                  <select
                    value={moduleTypeFilter}
                    onChange={(e) => setModuleTypeFilter(e.target.value as any)}
                    className="text-xs bg-(--bg) border border-(--border) rounded px-2 py-1.5 outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="default">System Default</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                  {filteredModules.map((mod) => (
                    <div
                      key={mod._id}
                      className={`
                        p-3 rounded-xl border flex items-center justify-between transition-all
                        ${
                          editingModuleId === mod._id
                            ? "bg-pink-50 dark:bg-pink-900/10 border-pink-500"
                            : "bg-(--card-bg) border-(--border) hover:border-pink-300"
                        }
                        ${mod.type === "default" ? "opacity-80 bg-(--bg)/50" : ""}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full border shadow-sm"
                          style={{ backgroundColor: mod.color }}
                        />
                        <div>
                          <p className="font-bold text-sm text-(--text-main)">
                            {mod.name}
                          </p>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${mod.type === "default" ? "bg-(--border) text-(--text-sub)" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"}`}
                          >
                            {mod.type === "default" ? "Default" : "Custom"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {mod.type === "custom" && (
                          <>
                            <button
                              onClick={() => handleEditModule(mod)}
                              className="p-2 text-(--text-sub) hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                initiateDeleteModule(mod._id, mod.name)
                              }
                              className="p-2 text-(--text-sub) hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {mod.type === "default" && (
                          <Shield className="w-4 h-4 text-(--text-sub) mr-2" />
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredModules.length === 0 && (
                    <p className="text-center text-xs text-(--text-sub) py-8">
                      No modules match filters
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="h-full flex flex-col">
              <div className="shrink-0 p-4 border-b border-(--border) flex justify-between items-center bg-(--card-bg) gap-4">
                <h2 className="font-bold text-lg text-(--text-main)">Users</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-(--text-sub)" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9 pr-3 py-1.5 bg-(--bg) border border-(--border) rounded-lg text-sm outline-none focus:border-orange-500 w-48 lg:w-64"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-(--text-sub) hover:scale-112 transition-transform" />
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value as any)}
                      className="pl-8 pr-3 py-1.5 bg-(--bg) border border-(--border) rounded-lg text-sm outline-none focus:border-orange-500 appearance-none cursor-pointer hover:scale-112 transition-transform"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admins Only</option>
                      <option value="user">Users Only</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-(--bg) sticky top-0 z-10 border-b border-(--border)">
                    <tr>
                      <th className="py-3 px-6 text-xs font-bold text-(--text-sub) uppercase">
                        Profile
                      </th>
                      <th className="py-3 px-6 text-xs font-bold text-(--text-sub) uppercase">
                        Role
                      </th>
                      <th className="py-3 px-6 text-xs font-bold text-(--text-sub) uppercase">
                        Joined
                      </th>
                      <th className="py-3 px-6 text-xs font-bold text-(--text-sub) uppercase text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="group hover:bg-(--bg)/50 transition-colors"
                      >
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-(--text-main)">
                                {user.name}
                              </p>
                              <p className="text-xs text-(--text-sub)">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          {user.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-bold">
                              <ShieldAlert className="w-3 h-3" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">
                              <User className="w-3 h-3" /> User
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-xs text-(--text-sub)">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 ">
                            <button
                              onClick={() =>
                                initiateToggleRole(user._id, user.role)
                              }
                              className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border hover:scale-112
                                ${
                                  user.role === "admin"
                                    ? "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 dark:border-orange-900/30 dark:bg-orange-900/10 dark:text-orange-400 dark:hover:bg-orange-900/20"
                                    : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-900/10 dark:text-blue-400 dark:hover:bg-blue-900/20 hover:scale-105 transition-transform"
                                }
                              `}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              {user.role === "admin" ? "Demote" : "Promote"}
                            </button>
                            <button
                              onClick={() => initiateDeleteUser(user._id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash className="w-4 h-4 hover:scale-112 transition-transform" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-8 text-xs text-(--text-sub)"
                        >
                          No users found matching filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
              {/* Left Column: Upload Form */}
              <div className="lg:w-1/3 flex flex-col h-full p-6 bg-(--bg)/30">
                <div className="shrink-0 mb-6">
                  <h2 className="text-lg font-bold text-(--text-main) flex items-center gap-2">
                    <UploadCloud className="w-5 h-5" /> Update Graph
                  </h2>
                  <p className="text-xs text-(--text-sub) mt-1">
                    Upload a standardized JSON file.
                  </p>
                </div>

                <form
                  ref={uploadFormRef}
                  action={uploadAction}
                  className="flex-1 flex flex-col gap-4"
                >
                  <input
                    type="hidden"
                    name="uploaderEmail"
                    value={session?.user?.email || ""}
                  />
                  <div className="flex-1 border-2 border-dashed border-(--border) rounded-xl flex flex-col items-center justify-center relative hover:border-orange-500/50 hover:bg-(--card-bg) transition-all">
                    <FileJson
                      className={`w-10 h-10 mb-3 ${selectedFileName ? "text-orange-500" : "text-(--text-sub)"}`}
                    />
                    <label className="absolute inset-0 cursor-pointer">
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
                    {selectedFileName ? (
                      <p className="text-xs font-bold text-orange-600 px-4 text-center break-all">
                        {selectedFileName}
                      </p>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-bold text-(--text-main)">
                          Drop JSON
                        </p>
                        <p className="text-[10px] text-(--text-sub)">
                          or click to browse
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    disabled={isUploading || !selectedFileName}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    {isUploading ? "Processing..." : "Upload & Activate"}
                  </button>
                </form>
              </div>

              {/* Right Column: Split into Top (Files) and Bottom (Audit) */}
              <div className="lg:w-2/3 flex flex-col h-full divide-y divide-(--border)">
                {/* Unified Filters for Logs */}
                <div className="shrink-0 p-3 bg-(--card-bg) border-b border-(--border) flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-(--text-sub)" />
                    <input
                      type="text"
                      placeholder="Search filename or email..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 w-full bg-(--bg) border border-(--border) rounded-lg text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={logDateFilter}
                      onChange={(e) => setLogDateFilter(e.target.value)}
                      className="pl-3 pr-2 py-1.5 bg-(--bg) border border-(--border) rounded-lg text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Top Half: Upload History */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="shrink-0 p-2 bg-(--bg)/30 border-b border-(--border) flex justify-between items-center px-4">
                    <span className="text-[10px] font-bold text-(--text-sub) uppercase">
                      Upload History
                    </span>
                    <span className="text-[10px] bg-(--card-bg) px-2 py-0.5 rounded text-(--text-sub)">
                      {uploadLogs.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-(--border)">
                        {uploadLogs.map((log) => (
                          <tr
                            key={log._id}
                            className="hover:bg-(--bg)/50 transition-colors group"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center shrink-0">
                                  <FileUp className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-sm font-bold text-(--text-main) truncate">
                                    {log.fileName}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-(--text-sub)">
                              {log.uploaderEmail}
                            </td>
                            <td className="py-3 px-4 text-xs text-(--text-sub) text-right">
                              {new Date(log.uploadedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Half: Manual Actions */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="shrink-0 p-2 bg-(--bg)/30 border-b border-(--border) flex justify-between items-center px-4">
                    <span className="text-[10px] font-bold text-(--text-sub) uppercase">
                      Manual Audit Trail
                    </span>
                    <span className="text-[10px] bg-(--card-bg) px-2 py-0.5 rounded text-(--text-sub)">
                      {activityLogs.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-(--border)">
                        {activityLogs.map((log) => {
                          const display = getLogDisplayData(log.fileName);
                          const LogIcon = display.icon;
                          return (
                            <tr
                              key={log._id}
                              className="hover:bg-(--bg)/50 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${display.style}`}
                                  >
                                    <LogIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-(--text-main)">
                                      {display.details}
                                    </p>
                                    <span className="text-[10px] uppercase text-(--text-sub)">
                                      {display.type}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-xs text-(--text-sub)">
                                {log.uploaderEmail}
                              </td>
                              <td className="py-3 px-4 text-xs text-(--text-sub) text-right">
                                {new Date(log.uploadedAt).toLocaleString()}
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
          )}
        </div>
      </main>
    </div>
  );
}
