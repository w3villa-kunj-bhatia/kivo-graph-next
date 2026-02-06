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
  ShieldAlert,
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
  Filter,
  ChevronRight,
  Activity,
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
        showToast(result.message, "success");
        resetForm();
        fetchData();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
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
    if (fileName.startsWith("Manual Add:"))
      return {
        type: "Node Added",
        details: fileName.replace("Manual Add: ", ""),
        icon: PlusCircle,
        style:
          "text-green-100 bg-green-50 border-green-100 dark:bg-green-500 dark:text-green-100",
      };
    if (fileName.startsWith("Manual Delete:"))
      return {
        type: "Deleted",
        details: fileName.replace("Manual Delete: ", ""),
        icon: Trash2,
        style:
          "text-red-100 bg-red-50 border-red-100 dark:bg-red-500 dark:text-red-100",
      };
    if (fileName.startsWith("Manual Connect:"))
      return {
        type: "Connected",
        details: fileName.replace("Manual Connect: ", ""),
        icon: LinkIcon,
        style:
          "text-blue-100 bg-blue-50 border-blue-100 dark:bg-blue-500 dark:text-blue-100",
      };
    if (fileName.startsWith("Manual Disconnect:"))
      return {
        type: "Disconnected",
        details: fileName.replace("Manual Disconnect: ", ""),
        icon: LinkIcon,
        style:
          "text-red-100 bg-red-50 border-red-100 dark:bg-red-500 dark:text-red-100",
      };
    return {
      type: "File Upload",
      details: fileName,
      icon: FileUp,
      style:
        "text-(--primary) bg-(--primary-subtle) border-(--primary) dark:border-(--primary)/50",
    };
  };

  const navItems = [
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "users", label: "Users", icon: Users },
    { id: "modules", label: "Modules", icon: Layers },
    { id: "logs", label: "Activity Logs", icon: Activity },
  ];

  return (
    <div className="h-screen bg-(--bg) text-(--text-main) flex overflow-hidden transition-colors duration-300 font-sans">
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

      <aside className="w-64 bg-(--card-bg) border-r border-(--border) flex flex-col shrink-0 z-50 transition-colors duration-300">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-(--border)">
          <div className="w-8 h-8 rounded-lg bg-(--primary) flex items-center justify-center text-white shadow-lg shadow-(--primary)/20">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Kivo Admin</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group overflow-hidden ${
                activeTab === item.id
                  ? "bg-(--primary-subtle) text-(--primary)"
                  : "text-(--text-sub) hover:bg-(--card-hover) hover:text-(--text-main)"
              }`}
            >
              {activeTab === item.id && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-(--primary) rounded-r-md shadow-[0_0_8px_var(--primary)]" />
              )}
              <item.icon
                className={`w-5 h-5 transition-colors ${activeTab === item.id ? "text-(--primary)" : "text-(--text-sub) group-hover:text-(--text-main)"}`}
              />
              <span className="text-sm font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-(--border) space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-(--text-sub) hover:bg-(--card-hover) hover:text-(--text-main) transition-all"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm font-semibold">Graph View</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-(--bg) border border-(--border) text-(--text-sub) hover:text-(--text-main) hover:border-(--primary)/50 transition-all duration-300 overflow-hidden group"
          >
            <div className="relative z-10 flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-(--accent-blue)" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-sm font-semibold">
                {isDarkMode ? "Dark Mode" : "Light Mode"}
              </span>
            </div>
            {/* Hover Slide Effect */}
            <div className="absolute inset-0 bg-linear-to-r from-(--primary)/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          </button>

          <div className="relative pt-2" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-(--bg) border border-(--border) hover:border-(--primary)/50 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-orange-400 to-red-500 text-white flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
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
              <div className="absolute bottom-full left-0 mb-2 w-full bg-(--card-bg) border border-(--border) rounded-xl shadow-xl p-1 z-50 animate-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-(--danger) hover:bg-(--danger-bg) rounded-lg transition w-full text-left font-bold"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-(--border) bg-(--card-bg) flex items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-bold capitalize text-(--text-main)">
            {activeTab}
          </h2>
        </header>
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Stats Cards with Improved Depth */}
          <div className="p-8 pb-4 grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
            {/* Companies Card */}
            <div className="relative overflow-hidden bg-(--card-bg) p-5 rounded-2xl border border-(--border) shadow-sm dark:shadow-none group hover:border-(--primary) transition-all duration-300">
              <div className="absolute inset-0 bg-linear-to-br from-(--primary)/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-(--primary-subtle) flex items-center justify-center text-(--primary) group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-(--text-sub) font-bold uppercase tracking-widest">
                    Companies
                  </p>
                  <p className="text-3xl font-black text-(--text-main)">
                    {stats.companyCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Users Card */}
            <div className="relative overflow-hidden bg-(--card-bg) p-5 rounded-2xl border border-(--border) shadow-sm dark:shadow-none group hover:border-(--accent-blue) transition-all duration-300">
              <div className="absolute inset-0 bg-linear-to-br from-(--accent-blue)/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-(--accent-blue) group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-(--text-sub) font-bold uppercase tracking-widest">
                    Users
                  </p>
                  <p className="text-3xl font-black text-(--text-main)">
                    {stats.userCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Modules Card */}
            <div className="relative overflow-hidden bg-(--card-bg) p-5 rounded-2xl border border-(--border) shadow-sm dark:shadow-none group hover:border-(--accent-purple) transition-all duration-300">
              <div className="absolute inset-0 bg-linear-to-br from-(--accent-purple)/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-(--accent-purple) group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-(--text-sub) font-bold uppercase tracking-widest">
                    Modules
                  </p>
                  <p className="text-3xl font-black text-(--text-main)">
                    {stats.moduleCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 px-8 pb-8 min-h-0">
            <div className="h-full bg-(--card-bg) rounded-2xl border border-(--border) shadow-xl overflow-hidden flex flex-col">
              {activeTab === "companies" && (
                <div className="h-full flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-(--border)">
                  <div
                    className={`xl:w-1/3 flex flex-col h-full transition-all duration-300 relative z-10 ${editingId ? "bg-(--primary-subtle)" : "bg-(--card-bg)"}`}
                  >
                    <div className="p-6 border-b border-(--border) flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-lg text-(--text-main)">
                        {editingId ? "Edit Company" : "New Company"}
                      </h3>
                      {editingId && (
                        <button
                          onClick={resetForm}
                          className="text-xs font-bold text-(--primary) hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                      <form
                        id="company-form"
                        onSubmit={handleCompanySubmit}
                        className="space-y-6"
                      >
                        <div>
                          <label className="block text-xs font-bold text-(--text-sub) uppercase mb-2">
                            Company Name
                          </label>
                          <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="w-full px-4 py-2.5 rounded-xl bg-(--input-bg) border border-(--border) focus:border-(--primary) focus:ring-4 focus:ring-(--primary)/10 outline-none text-(--text-main) placeholder:text-(--text-sub) transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-(--text-sub) uppercase mb-3">
                            Allowed Modules
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {allAvailableModules.map((mod) => (
                              <div
                                key={mod}
                                onClick={() => toggleModule(mod)}
                                className={`cursor-pointer rounded-xl border px-3 py-2.5 flex items-center gap-3 transition-all select-none ${formModules.has(mod) ? "bg-(--primary) text-(--primary-fg) border-(--primary)" : "bg-(--bg) border-(--border) hover:border-(--primary)/50"}`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center ${formModules.has(mod) ? "bg-white text-(--primary) border-white" : "bg-white/50 border-slate-300"}`}
                                >
                                  {formModules.has(mod) && (
                                    <Check className="w-3 h-3" />
                                  )}
                                </div>
                                <span className="text-xs font-bold truncate">
                                  {mod}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {Array.from(formModules).some(
                          (m) => MODULE_FEATURES[m],
                        ) && (
                          <div className="pt-4 border-t border-(--border)">
                            <label className="block text-xs font-bold text-(--text-sub) uppercase mb-4">
                              Granular Permissions
                            </label>
                            <div className="space-y-4">
                              {Array.from(formModules).map((mod) => {
                                const features = MODULE_FEATURES[mod];
                                if (!features) return null;
                                return (
                                  <div
                                    key={mod}
                                    className="bg-(--bg) border border-(--border) rounded-xl overflow-hidden"
                                  >
                                    <div className="px-4 py-2 bg-(--card-bg) border-b border-(--border) flex justify-between items-center">
                                      <span className="text-[10px] font-black uppercase text-(--primary)">
                                        {mod}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => toggleAllFeatures(mod)}
                                        className="text-[10px] font-bold text-(--text-sub) hover:text-(--primary)"
                                      >
                                        Toggle All
                                      </button>
                                    </div>
                                    <div className="p-3 grid grid-cols-1 gap-1">
                                      {features.map((feature) => (
                                        <label
                                          key={feature}
                                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-(--card-bg) cursor-pointer group"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={
                                              moduleFeatures[mod]?.has(
                                                feature,
                                              ) || false
                                            }
                                            onChange={() =>
                                              toggleFeature(mod, feature)
                                            }
                                            className="rounded-md border-slate-300 text-(--primary) focus:ring-(--primary) w-4 h-4"
                                          />
                                          <span className="text-xs text-(--text-main) font-medium group-hover:translate-x-0.5 transition-transform">
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
                    <div className="p-6 border-t border-(--border) bg-(--card-bg) shrink-0">
                      <button
                        form="company-form"
                        disabled={isSavingCompany}
                        className="w-full bg-(--primary) hover:brightness-110 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-(--primary)/20 active:scale-[0.98]"
                      >
                        {isSavingCompany
                          ? "Saving Changes..."
                          : editingId
                            ? "Update Company Info"
                            : "Register New Company"}
                      </button>
                    </div>
                  </div>
                  <div className="xl:w-2/3 flex flex-col h-full bg-(--bg)/20">
                    <div className="p-4 border-b border-(--border) bg-(--card-bg)/50 backdrop-blur-md flex items-center justify-between shrink-0">
                      <span className="text-xs font-bold text-(--text-sub) uppercase px-4">
                        Registry ({sortedCompanies.length})
                      </span>
                      <select
                        value={sortOption}
                        onChange={(e) =>
                          setSortOption(e.target.value as SortOption)
                        }
                        className="text-xs font-bold bg-(--card-bg) border border-(--border) rounded-lg px-3 py-1.5 outline-none focus:border-(--primary)"
                      >
                        <option value="name-asc">Name: A to Z</option>
                        <option value="name-desc">Name: Z to A</option>
                        <option value="modules-most">
                          Modules: Most First
                        </option>
                        <option value="modules-least">
                          Modules: Least First
                        </option>
                      </select>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                      {sortedCompanies.map((company) => (
                        <div
                          key={company._id}
                          className={`p-4 rounded-2xl border flex items-center justify-between group transition-all ${editingId === company._id ? "bg-(--primary-subtle) border-(--primary) ring-1 ring-(--primary)" : "bg-(--card-bg) border-(--border) hover:border-(--primary)/30 hover:shadow-md"}`}
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-(--text-sub) font-black text-xl border border-(--border) transition-colors">
                              {company.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4
                                className={`font-bold text-base ${editingId === company._id ? "text-(--primary)" : "text-(--text-main)"}`}
                              >
                                {company.name}
                              </h4>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {company.allowedModules.map((m: string) => (
                                  <span
                                    key={m}
                                    className="text-[10px] font-bold bg-(--bg) border border-(--border) px-2 py-0.5 rounded-full text-(--text-sub)"
                                  >
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(company)}
                              className="p-2.5 text-(--accent-blue) hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors border border-transparent hover:border-blue-200"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => initiateDeleteCompany(company._id)}
                              className="p-2.5 text-(--danger) hover:bg-(--danger-bg) rounded-xl transition-colors border border-transparent hover:border-red-200"
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
                    className={`md:w-1/3 flex flex-col h-full transition-all duration-300 relative z-10 ${editingModuleId ? "bg-purple-50/50 dark:bg-purple-950/20" : "bg-(--card-bg)"}`}
                  >
                    <div className="p-6 border-b border-(--border) flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-lg text-(--text-main)">
                        {editingModuleId ? "Edit Module" : "New Custom Module"}
                      </h3>
                      {editingModuleId && (
                        <button
                          onClick={resetModuleForm}
                          className="text-xs font-bold text-(--accent-purple) hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
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
                          <label className="block text-xs font-bold text-(--text-sub) uppercase mb-2">
                            Module Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={moduleName}
                            onChange={(e) => setModuleName(e.target.value)}
                            placeholder="e.g. Finance"
                            className="w-full px-4 py-2.5 rounded-xl bg-(--input-bg) border border-(--border) focus:border-(--accent-purple) focus:ring-4 focus:ring-purple-500/10 outline-none text-(--text-main) placeholder:text-(--text-sub)"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-(--text-sub) uppercase mb-4">
                            Branding Color
                          </label>
                          <input
                            type="hidden"
                            name="color"
                            value={selectedModuleColor}
                          />
                          <div className="flex flex-wrap gap-3">
                            {PRESET_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setSelectedModuleColor(color)}
                                className={`w-10 h-10 rounded-full border-4 transition-all ${selectedModuleColor === color ? "border-white ring-4 ring-(--accent-purple) shadow-lg" : "border-transparent"}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                            <div className="relative w-10 h-10 rounded-full border-2 border-dashed border-(--text-sub) flex items-center justify-center hover:bg-(--bg) transition-colors">
                              <input
                                type="color"
                                value={selectedModuleColor}
                                onChange={(e) =>
                                  setSelectedModuleColor(e.target.value)
                                }
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <PlusCircle className="w-5 h-5 text-(--text-sub)" />
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-(--bg) rounded-xl flex items-center gap-3">
                            <div
                              className="w-6 h-6 rounded-full border border-(--border) shadow-sm"
                              style={{ backgroundColor: selectedModuleColor }}
                            />
                            <span className="text-xs font-mono font-bold text-(--text-main)">
                              {selectedModuleColor.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </form>
                    </div>
                    <div className="p-6 border-t border-(--border) bg-(--card-bg) shrink-0">
                      <button
                        form="module-form"
                        disabled={isModulePending}
                        className="w-full bg-(--accent-purple) hover:brightness-110 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
                      >
                        {isModulePending
                          ? "Processing..."
                          : "Save Module Configuration"}
                      </button>
                    </div>
                  </div>
                  <div className="md:w-2/3 flex flex-col h-full bg-(--bg)/20">
                    <div className="p-4 border-b border-(--border) bg-(--card-bg)/50 backdrop-blur-md flex items-center gap-4 shrink-0">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-(--text-sub)" />
                        <input
                          type="text"
                          placeholder="Search module library..."
                          value={moduleSearch}
                          onChange={(e) => setModuleSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 w-full bg-(--input-bg) border border-(--border) rounded-xl text-sm outline-none focus:border-(--accent-purple)"
                        />
                      </div>
                      <select
                        value={moduleTypeFilter}
                        onChange={(e) =>
                          setModuleTypeFilter(e.target.value as any)
                        }
                        className="text-xs font-bold bg-(--input-bg) border border-(--border) rounded-xl px-4 py-2 outline-none"
                      >
                        <option value="all">All Modules</option>
                        <option value="default">System Core</option>
                        <option value="custom">Custom Added</option>
                      </select>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 custom-scrollbar">
                      {filteredModules.map((mod) => (
                        <div
                          key={mod._id}
                          className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${editingModuleId === mod._id ? "bg-purple-500/5 border-(--accent-purple) ring-1 ring-(--accent-purple)" : "bg-(--card-bg) border-(--border) hover:shadow-md"} ${mod.type === "default" ? "opacity-75" : ""}`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-10 h-10 rounded-xl shadow-inner border border-white/20"
                              style={{ backgroundColor: mod.color }}
                            />
                            <div>
                              <p className="font-bold text-sm text-(--text-main)">
                                {mod.name}
                              </p>
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${mod.type === "default" ? "bg-(--bg) text-(--text-sub)" : "bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400"}`}
                              >
                                {mod.type === "default" ? "System" : "Custom"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {mod.type === "custom" ? (
                              <>
                                <button
                                  onClick={() => handleEditModule(mod)}
                                  className="p-2 text-(--text-sub) hover:text-(--accent-purple) rounded-lg"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    initiateDeleteModule(mod._id, mod.name)
                                  }
                                  className="p-2 text-(--text-sub) hover:text-(--danger) rounded-lg"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <Shield className="w-4 h-4 text-(--text-sub) opacity-30" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <div className="h-full flex flex-col">
                  <div className="p-6 border-b border-(--border) bg-(--card-bg)/50 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 absolute left-3.5 top-3 text-(--text-sub)" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-(--input-bg) border border-(--border) rounded-xl text-sm outline-none focus:border-(--primary) w-full placeholder:text-(--text-sub)"
                      />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Filter className="w-4 h-4 text-(--text-sub)" />
                      <select
                        value={userRoleFilter}
                        onChange={(e) =>
                          setUserRoleFilter(e.target.value as any)
                        }
                        className="flex-1 sm:flex-none pl-3 pr-8 py-2.5 bg-(--input-bg) border border-(--border) rounded-xl text-sm font-bold outline-none focus:border-(--primary) cursor-pointer"
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Admins</option>
                        <option value="user">Standard Users</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-(--card-bg)/80 backdrop-blur-md sticky top-0 z-10 border-b border-(--border)">
                        <tr>
                          <th className="py-4 px-8 text-[10px] font-black text-(--text-sub) uppercase tracking-widest text-center w-16">
                            S.No.
                          </th>
                          <th className="py-4 px-8 text-[10px] font-black text-(--text-sub) uppercase tracking-widest">
                            User Profile
                          </th>
                          <th className="py-4 px-8 text-[10px] font-black text-(--text-sub) uppercase tracking-widest">
                            Assigned Role
                          </th>
                          <th className="py-4 px-8 text-[10px] font-black text-(--text-sub) uppercase tracking-widest">
                            Account Created
                          </th>
                          <th className="py-4 px-8 text-[10px] font-black text-(--text-sub) uppercase tracking-widest text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--border)">
                        {filteredUsers.map((user, index) => (
                          <tr
                            key={user._id}
                            className="group hover:bg-(--card-hover) transition-colors"
                          >
                            <td className="py-5 px-8 text-center text-xs font-bold text-(--text-sub)">
                              {index + 1}
                            </td>
                            <td className="py-5 px-8">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm border-2 border-white/20">
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
                            </td>
                            <td className="py-5 px-8">
                              {user.role === "admin" ? (
                                <span className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-(--danger) px-3 py-1 rounded-full text-xs font-black ring-1 ring-red-100 dark:ring-red-500/20">
                                  <ShieldAlert className="w-3.5 h-3.5" /> Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-(--accent-blue) px-3 py-1 rounded-full text-xs font-black ring-1 ring-blue-100 dark:ring-blue-500/20">
                                  <User className="w-3.5 h-3.5" /> Standard
                                </span>
                              )}
                            </td>
                            <td className="py-5 px-8 text-xs font-bold text-(--text-sub)">
                              {new Date(user.createdAt).toLocaleDateString(
                                undefined,
                                { dateStyle: "medium" },
                              )}
                            </td>
                            <td className="py-5 px-8 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() =>
                                    initiateToggleRole(user._id, user.role)
                                  }
                                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border ${user.role === "admin" ? "bg-(--primary-subtle) text-(--primary) border-orange-100 dark:border-orange-500/20" : "bg-blue-50 text-(--accent-blue) border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20"} hover:scale-105 active:scale-95`}
                                >
                                  <Shield className="w-3.5 h-3.5" />{" "}
                                  {user.role === "admin" ? "Demote" : "Promote"}
                                </button>
                                <button
                                  onClick={() => initiateDeleteUser(user._id)}
                                  className="p-2.5 text-(--text-sub) hover:text-(--danger) hover:bg-(--danger-bg) rounded-xl transition-all"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "logs" && (
                <div className="h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
                  <div className="lg:w-1/3 flex flex-col h-full p-8 bg-(--bg)/30 shrink-0">
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-(--text-main) flex items-center gap-3">
                        <UploadCloud className="w-6 h-6 text-(--primary)" />{" "}
                        System Update
                      </h3>
                      <p className="text-xs font-bold text-(--text-sub) mt-2 uppercase tracking-widest">
                        Update environment graph via JSON
                      </p>
                    </div>
                    <form
                      ref={uploadFormRef}
                      action={uploadAction}
                      className="flex-1 flex flex-col gap-6 min-h-0"
                    >
                      <input
                        type="hidden"
                        name="uploaderEmail"
                        value={session?.user?.email || ""}
                      />
                      <div className="flex-1 border-3 border-dashed border-(--border) rounded-2xl flex flex-col items-center justify-center relative hover:border-(--primary) hover:bg-(--card-bg) transition-all group min-h-0">
                        <FileJson
                          className={`w-14 h-14 mb-4 transition-transform group-hover:scale-110 ${selectedFileName ? "text-(--primary)" : "text-(--text-sub)"}`}
                        />
                        <label className="absolute inset-0 cursor-pointer">
                          <input
                            type="file"
                            name="file"
                            accept=".json"
                            required
                            onChange={(e) =>
                              setSelectedFileName(
                                e.target.files?.[0]?.name || null,
                              )
                            }
                            className="opacity-0 w-full h-full cursor-pointer"
                          />
                        </label>
                        {selectedFileName ? (
                          <div className="text-center px-6">
                            <p className="text-sm font-black text-(--primary) break-all">
                              {selectedFileName}
                            </p>
                            <p className="text-[10px] font-bold text-(--text-sub) mt-1">
                              Ready for deployment
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm font-black text-(--text-main)">
                              Drag & Drop Manifest
                            </p>
                            <p className="text-xs font-bold text-(--text-sub) mt-1">
                              or click to browse local files
                            </p>
                          </div>
                        )}
                      </div>
                      <button
                        disabled={isUploading || !selectedFileName}
                        className="w-full bg-(--primary) hover:brightness-110 text-white py-4 rounded-2xl font-black transition-all disabled:opacity-50 shadow-xl shadow-(--primary)/20 flex items-center justify-center gap-2 shrink-0"
                      >
                        {isUploading ? (
                          "Uploading..."
                        ) : (
                          <>
                            <Check className="w-5 h-5" /> Deploy Graph
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                  <div className="lg:w-2/3 flex flex-col h-full divide-y divide-(--border) min-h-0">
                    <div className="p-4 bg-(--card-bg) flex items-center gap-4 shrink-0">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-(--text-sub)" />
                        <input
                          type="text"
                          placeholder="Filter logs..."
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 w-full bg-(--input-bg) border border-(--border) rounded-xl text-sm outline-none focus:border-(--primary) placeholder:text-(--text-sub)"
                        />
                      </div>
                      <input
                        type="date"
                        value={logDateFilter}
                        onChange={(e) => setLogDateFilter(e.target.value)}
                        className="px-4 py-2 bg-(--input-bg) border border-(--border) rounded-xl text-sm font-bold outline-none focus:border-(--primary)"
                      />
                    </div>
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="px-6 py-2 bg-(--bg)/50 border-b border-(--border) flex justify-between items-center shrink-0">
                        <span className="text-[10px] font-black text-(--text-sub) uppercase tracking-widest">
                          Recent Deployments
                        </span>
                        <span className="text-[10px] font-black bg-(--primary) text-white px-2 py-0.5 rounded-full">
                          {uploadLogs.length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                        <table className="w-full text-left border-collapse">
                          <tbody className="divide-y divide-(--border)">
                            {uploadLogs.map((log) => (
                              <tr
                                key={log._id}
                                className="hover:bg-(--card-hover) transition-colors group"
                              >
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-900 dark:bg-orange-400 text-orange-50 flex items-center justify-center shrink border border-orange-50 dark:border-orange-50">
                                      <FileUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-(--text-main) truncate group-hover:text-(--primary) transition-colors">
                                        {log.fileName}
                                      </p>
                                      <p className="text-[10px] font-bold text-(--text-sub) uppercase">
                                        {log.uploaderEmail}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-xs font-black text-(--text-sub) text-right">
                                  {new Date(
                                    log.uploadedAt,
                                  ).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="px-6 py-2 bg-(--bg)/50 border-b border-(--border) flex justify-between items-center shrink-0">
                        <span className="text-[10px] font-black text-(--text-sub) uppercase tracking-widest">
                          Manual Audit Trail
                        </span>
                        <span className="text-[10px] font-black bg-(--accent-blue) text-white px-2 py-0.5 rounded-full">
                          {activityLogs.length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                        <table className="w-full text-left border-collapse">
                          <tbody className="divide-y divide-(--border)">
                            {activityLogs.map((log) => {
                              const display = getLogDisplayData(log.fileName);
                              const LogIcon = display.icon;
                              return (
                                <tr
                                  key={log._id}
                                  className="hover:bg-(--card-hover) transition-colors"
                                >
                                  <td className="py-4 px-6">
                                    <div className="flex items-center gap-4">
                                      <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${display.style}`}
                                      >
                                        <LogIcon className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-(--text-main)">
                                          {display.details}
                                        </p>
                                        <p className="text-[10px] font-black uppercase text-(--text-sub)">
                                          {display.type} • {log.uploaderEmail}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-xs font-black text-(--text-sub) text-right">
                                    {new Date(
                                      log.uploadedAt,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
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
          </div>
        </div>
      </main>
    </div>
  );
}
