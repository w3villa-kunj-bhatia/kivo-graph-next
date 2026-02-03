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
  createModule,
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
  ListFilter,
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

  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [userSearch, setUserSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formModules, setFormModules] = useState<Set<string>>(new Set());
  const [moduleFeatures, setModuleFeatures] = useState<
    Record<string, Set<string>>
  >({});

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

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
    createModule,
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
      const form = document.getElementById("module-form") as HTMLFormElement;
      if (form) form.reset();
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

  const uploadLogs = useMemo(
    () => logs.filter((log) => !log.fileName.startsWith("Manual")),
    [logs],
  );
  const activityLogs = useMemo(
    () => logs.filter((log) => log.fileName.startsWith("Manual")),
    [logs],
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-(--bg) text-(--text-main) p-8 transition-colors duration-300">
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

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-orange-500">
            Kivo Dependency Graph Admin Dashboard
          </h1>
          <p className="text-(--text-sub) text-sm mt-1">
            Manage system resources and access.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center bg-(--card-bg) border border-(--border) rounded-lg hover:bg-(--border) transition text-(--text-main) shadow-sm"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 bg-(--card-bg) hover:bg-(--border) text-(--text-main) px-4 py-2 rounded-lg transition border border-(--border) shadow-sm"
          >
            <Home className="w-4 h-4" />{" "}
            <span className="text-sm font-medium">Graph View</span>
          </Link>
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 flex items-center justify-center bg-orange-600 text-white rounded-full hover:bg-orange-700 transition shadow-sm ring-2 ring-transparent focus:ring-orange-400"
            >
              <User className="w-5 h-5" />
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-(--card-bg) border border-(--border) rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 border-b border-(--border) mb-1">
                  <p className="text-sm font-bold text-(--text-main) truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-(--text-sub) truncate">
                    {session?.user?.email}
                  </p>
                  <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded uppercase font-bold mt-1 inline-block">
                    {session?.user?.role || "Admin"}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition w-full text-left"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-(--card-bg) p-6 rounded-xl border border-(--border) shadow-lg flex items-center gap-4 transition-all hover:border-orange-500/30">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-(--text-sub) font-medium">
              Total Companies
            </p>
            <p className="text-2xl font-bold text-(--text-main)">
              {stats.companyCount}
            </p>
          </div>
        </div>
        <div className="bg-(--card-bg) p-6 rounded-xl border border-(--border) shadow-lg flex items-center gap-4 transition-all hover:border-orange-500/30">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-(--text-sub) font-medium">
              Registered Users
            </p>
            <p className="text-2xl font-bold text-(--text-main)">
              {stats.userCount}
            </p>
          </div>
        </div>
        <div className="bg-(--card-bg) p-6 rounded-xl border border-(--border) shadow-lg flex items-center gap-4 transition-all hover:border-orange-500/30">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-(--text-sub) font-medium">
              Active Modules
            </p>
            <p className="text-2xl font-bold text-(--text-main)">
              {stats.moduleCount}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-(--border) overflow-x-auto">
        <button
          onClick={() => setActiveTab("companies")}
          className={`pb-2 px-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === "companies" ? "text-orange-500 border-b-2 border-orange-500" : "text-(--text-sub) hover:text-(--text-main)"}`}
        >
          Manage Companies
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-2 px-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === "users" ? "text-orange-500 border-b-2 border-orange-500" : "text-(--text-sub) hover:text-(--text-main)"}`}
        >
          Manage Users
        </button>
        <button
          onClick={() => setActiveTab("modules")}
          className={`pb-2 px-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === "modules" ? "text-orange-500 border-b-2 border-orange-500" : "text-(--text-sub) hover:text-(--text-main)"}`}
        >
          Manage Modules
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-2 px-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === "logs" ? "text-orange-500 border-b-2 border-orange-500" : "text-(--text-sub) hover:text-(--text-main)"}`}
        >
          Graph Activity
        </button>
      </div>

      {activeTab === "companies" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 h-full">
          <div
            className={`bg-(--card-bg) p-6 rounded-xl border shadow-lg transition-colors flex flex-col h-full overflow-y-auto custom-scrollbar ${editingId ? "border-orange-500/50" : "border-(--border)"}`}
          >
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-(--card-bg) z-10 pb-2 border-b border-(--border)">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-semibold text-(--text-main)">
                  {editingId ? "Edit Company" : "Add New Company"}
                </h2>
              </div>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-xs flex items-center gap-1 bg-(--bg) hover:bg-(--border) px-2 py-1 rounded text-(--text-sub) transition"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleCompanySubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-(--text-sub)">
                  Company Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full p-2.5 rounded-lg bg-(--bg) border border-(--border) focus:border-orange-500 outline-none text-(--text-main) transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-(--text-sub)">
                  <LayoutGrid className="w-4 h-4" />
                  1. Active Modules
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allAvailableModules.map((mod) => (
                    <div
                      key={mod}
                      onClick={() => toggleModule(mod)}
                      className={`
                        cursor-pointer rounded-lg border p-3 flex items-center gap-3 transition-all select-none
                        ${
                          formModules.has(mod)
                            ? "bg-orange-500/10 border-orange-500 shadow-sm"
                            : "bg-(--bg) border-(--border) hover:border-orange-500/50"
                        }
                      `}
                    >
                      <div
                        className={`
                        w-5 h-5 rounded border flex items-center justify-center transition-colors
                        ${
                          formModules.has(mod)
                            ? "bg-orange-500 border-orange-500"
                            : "border-gray-400 dark:border-gray-600"
                        }
                      `}
                      >
                        {formModules.has(mod) && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          formModules.has(mod)
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-(--text-main)"
                        }`}
                      >
                        {mod}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {Array.from(formModules).some((m) => MODULE_FEATURES[m]) && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-(--text-sub)">
                    <ListFilter className="w-4 h-4" />
                    2. Configure Features
                  </label>
                  <div className="space-y-4 border-t border-(--border) pt-4">
                    {Array.from(formModules).map((mod) => {
                      const features = MODULE_FEATURES[mod];
                      if (!features) return null;

                      const selectedCount = moduleFeatures[mod]?.size || 0;
                      const isAllSelected = selectedCount === features.length;

                      return (
                        <div
                          key={mod}
                          className="bg-(--bg) border border-(--border) rounded-xl overflow-hidden shadow-sm"
                        >
                          <div className="px-4 py-3 border-b border-(--border) flex justify-between items-center bg-(--card-bg)">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-5 bg-orange-500 rounded-full"></div>
                              <h4 className="font-bold text-sm text-(--text-main)">
                                {mod} Features
                              </h4>
                              <span className="text-[10px] font-mono text-(--text-sub) bg-(--border) px-2 py-0.5 rounded-full">
                                {selectedCount} / {features.length}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleAllFeatures(mod)}
                              className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline"
                            >
                              {isAllSelected ? "Deselect All" : "Select All"}
                            </button>
                          </div>

                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {features.map((feature) => (
                              <label
                                key={feature}
                                className="flex items-start gap-2 cursor-pointer group p-1.5 rounded-lg hover:bg-(--card-bg) transition-colors"
                              >
                                <div className="relative flex items-center pt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={
                                      moduleFeatures[mod]?.has(feature) || false
                                    }
                                    onChange={() => toggleFeature(mod, feature)}
                                    className="peer appearance-none w-4 h-4 border border-gray-400 dark:border-gray-500 rounded checked:bg-orange-500 checked:border-orange-500 transition-colors"
                                  />
                                  <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                </div>
                                <span className="text-sm text-(--text-sub) group-hover:text-(--text-main) transition-colors leading-tight select-none">
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

              <button
                disabled={isSavingCompany}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-orange-500/20 mt-4"
              >
                {isSavingCompany
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update Company"
                    : "Create Company"}
              </button>
            </form>
          </div>

          <div className="bg-(--card-bg) p-6 rounded-xl border border-(--border) shadow-lg flex flex-col h-150">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-(--text-main)">
                Existing Companies
              </h2>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-(--text-sub)" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-(--bg) border border-(--border) text-xs text-(--text-main) rounded px-2 py-1 outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="modules-most">Modules (Most)</option>
                  <option value="modules-least">Modules (Least)</option>
                </select>
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {sortedCompanies.map((company) => (
                <div
                  key={company._id}
                  className={`p-4 rounded-lg border flex justify-between items-center group transition-all ${editingId === company._id ? "bg-orange-500/10 border-orange-500/50" : "bg-(--bg) border-(--border) hover:border-gray-500"}`}
                >
                  <div>
                    <h3
                      className={`font-bold text-lg ${editingId === company._id ? "text-orange-500" : "text-(--text-main)"}`}
                    >
                      {company.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {company.allowedModules.slice(0, 4).map((m: string) => (
                        <span
                          key={m}
                          className="text-[10px] bg-(--card-bg) border border-(--border) px-2 py-0.5 rounded text-(--text-sub)"
                        >
                          {m}
                        </span>
                      ))}
                      {company.allowedModules.length > 4 && (
                        <span className="text-[10px] bg-(--card-bg) border border-(--border) px-2 py-0.5 rounded text-(--text-sub)">
                          +{company.allowedModules.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(company)}
                      className="text-(--text-sub) hover:text-blue-500 p-2 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => initiateDeleteCompany(company._id)}
                      className="text-(--text-sub) hover:text-red-500 p-2 transition"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-full">
          <div className="bg-(--card-bg) p-6 rounded-xl border border-(--border) shadow-lg flex flex-col h-fit">
            <div className="flex items-center gap-2 mb-6">
              <Palette className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-semibold text-(--text-main)">
                Create New Module
              </h2>
            </div>
            <form id="module-form" action={moduleAction} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-(--text-sub)">
                  Module Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Finance"
                  className="w-full p-2.5 rounded-lg bg-(--bg) border border-(--border) focus:border-orange-500 outline-none text-(--text-main) transition-all"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-(--text-sub)">
                  Choose Module Color
                </label>
                <input type="hidden" name="color" value={selectedModuleColor} />
                <div className="flex flex-wrap gap-2 p-3 bg-(--bg) border border-(--border) rounded-lg mb-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedModuleColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all transform hover:scale-110 ${
                        selectedModuleColor === color
                          ? "border-orange-500 scale-110 shadow-lg"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <div className="relative w-8 h-8">
                    <input
                      type="color"
                      value={selectedModuleColor}
                      onChange={(e) => setSelectedModuleColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="w-8 h-8 rounded-full border-2 border-dashed border-(--text-sub) flex items-center justify-center text-(--text-sub)"
                      style={{
                        backgroundColor: PRESET_COLORS.includes(
                          selectedModuleColor,
                        )
                          ? "transparent"
                          : selectedModuleColor,
                      }}
                    >
                      {!PRESET_COLORS.includes(selectedModuleColor) ? "" : "+"}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-(--text-sub)">
                  Selected:{" "}
                  <span className="font-mono uppercase">
                    {selectedModuleColor}
                  </span>
                </p>
              </div>
              <button
                disabled={isModulePending}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-orange-500/20 mt-4"
              >
                {isModulePending ? "Creating..." : "Create Module"}
              </button>
            </form>
          </div>

          <div className="bg-(--card-bg) p-6 rounded-xl border border-(--border) shadow-lg flex flex-col h-150">
            <h2 className="text-xl font-semibold text-(--text-main) mb-6">
              Existing Modules
            </h2>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {Object.entries(COLORS).map(([name, color]) => (
                <div
                  key={name}
                  className="p-3 rounded-lg border border-(--border) bg-(--bg) flex justify-between items-center opacity-75"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: color }}
                    ></div>
                    <div>
                      <p className="font-bold text-sm text-(--text-main)">
                        {name}
                      </p>
                      <p className="text-[10px] text-(--text-sub)">
                        System Default
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {dynamicModules.map((mod) => (
                <div
                  key={mod._id}
                  className="p-3 rounded-lg border border-(--border) bg-(--bg) flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: mod.color }}
                    ></div>
                    <div>
                      <p className="font-bold text-sm text-(--text-main)">
                        {mod.name}
                      </p>
                      <p className="text-[10px] text-(--text-sub)">Custom</p>
                    </div>
                  </div>
                  <button
                    onClick={() => initiateDeleteModule(mod._id, mod.name)}
                    className="text-(--text-sub) hover:text-red-500 p-2 transition"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-(--card-bg) p-6 rounded-xl border border-(--border) shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-semibold text-(--text-main)">
              User Management
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-(--text-sub)" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-(--bg) border border-(--border) rounded-lg text-sm text-(--text-main) focus:border-orange-500 outline-none w-64 transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-(--border) text-(--text-sub) text-sm uppercase">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-(--border) hover:bg-(--bg) transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-bold text-(--text-main)">
                        {user.name}
                      </p>
                      <p className="text-xs text-(--text-sub)">{user.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold border border-red-500/20">
                          <ShieldAlert className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs font-bold border border-blue-500/20">
                          <Shield className="w-3 h-3" /> User
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-(--text-sub)">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            initiateToggleRole(user._id, user.role)
                          }
                          className={`text-xs px-3 py-1.5 rounded font-medium border transition-colors ${user.role === "admin" ? "border-(--border) text-(--text-sub) hover:bg-(--border)" : "border-blue-500/30 text-blue-500 hover:bg-blue-500/10"}`}
                        >
                          {user.role === "admin" ? "Demote" : "Promote"}
                        </button>
                        <button
                          onClick={() => initiateDeleteUser(user._id)}
                          className="p-1.5 text-(--text-sub) hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete User"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8 text-(--text-sub) italic"
                    >
                      No users found matching "{userSearch}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          <div className="md:col-span-1 bg-(--card-bg) p-6 rounded-xl border border-(--border) shadow-lg h-fit">
            <div className="flex items-center gap-2 mb-4">
              <UploadCloud className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-semibold text-(--text-main)">
                Update Graph
              </h2>
            </div>
            <p className="text-sm text-(--text-sub) mb-6">
              Upload a new JSON file to update the graph for all users. The
              latest upload automatically becomes the active graph.
            </p>

            <form
              ref={uploadFormRef}
              action={uploadAction}
              className="space-y-4"
            >
              <input
                type="hidden"
                name="uploaderEmail"
                value={session?.user?.email || ""}
              />

              <div className="border-2 border-dashed border-(--border) rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-orange-500/50 transition bg-(--bg)/50 relative group">
                <FileJson
                  className={`w-8 h-8 mb-2 transition-colors ${selectedFileName ? "text-orange-500" : "text-(--text-sub) group-hover:text-orange-500"}`}
                />
                <label className="cursor-pointer inset-0 absolute w-full h-full flex items-center justify-center">
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
                  <span className="text-orange-500 font-bold break-all px-4">
                    Selected: {selectedFileName}
                  </span>
                ) : (
                  <span className="text-orange-500 font-bold hover:underline pointer-events-none">
                    Click to browse
                  </span>
                )}
                <p className="text-xs text-(--text-sub) mt-1 pointer-events-none">
                  JSON files only
                </p>
              </div>

              <button
                disabled={isUploading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-orange-500/20"
              >
                {isUploading
                  ? "Uploading & Processing..."
                  : "Upload & Activate"}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-(--card-bg) p-6 rounded-xl border border-(--border) shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-(--text-main)" />
                <h2 className="text-xl font-semibold text-(--text-main)">
                  File Upload History
                </h2>
              </div>

              <div className="overflow-x-auto max-h-55 custom-scrollbar relative">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-(--card-bg) z-10 shadow-sm">
                    <tr className="border-b border-(--border) text-(--text-sub) text-sm uppercase">
                      <th className="py-3 px-4">File Name</th>
                      <th className="py-3 px-4">Uploaded By</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {uploadLogs.map((log, index) => {
                      const display = getLogDisplayData(log.fileName);
                      const LogIcon = display.icon;
                      return (
                        <tr
                          key={log._id}
                          className="border-b border-(--border) hover:bg-(--bg) transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${display.style}`}
                              >
                                <LogIcon className="w-4 h-4" />
                              </div>
                              <p className="font-bold text-(--text-main) text-sm truncate">
                                {display.details}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-(--text-sub)">
                            {log.uploaderEmail}
                          </td>
                          <td className="py-3 px-4 text-(--text-sub)">
                            {new Date(log.uploadedAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {index === 0 ? (
                              <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold border border-green-500/20">
                                <CheckCircle className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="text-xs text-(--text-sub) italic">
                                Archived
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {uploadLogs.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-10 text-(--text-sub) italic"
                        >
                          No file uploads found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-(--card-bg) p-6 rounded-xl border border-(--border) shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-(--text-main)" />
                <h2 className="text-xl font-semibold text-(--text-main)">
                  Manual Modification History
                </h2>
              </div>

              <div className="overflow-x-auto max-h-55 custom-scrollbar relative">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-(--card-bg) z-10 shadow-sm">
                    <tr className="border-b border-(--border) text-(--text-sub) text-sm uppercase">
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Performed By</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {activityLogs.map((log) => {
                      const display = getLogDisplayData(log.fileName);
                      const LogIcon = display.icon;
                      return (
                        <tr
                          key={log._id}
                          className="border-b border-(--border) hover:bg-(--bg) transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${display.style}`}
                              >
                                <LogIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-(--text-main) text-sm truncate">
                                  {display.details}
                                </p>
                                <span className="text-[10px] uppercase font-bold text-(--text-sub)">
                                  {display.type}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-(--text-sub)">
                            {log.uploaderEmail}
                          </td>
                          <td className="py-3 px-4 text-(--text-sub)">
                            {new Date(log.uploadedAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                    {activityLogs.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center py-10 text-(--text-sub) italic"
                        >
                          No manual modifications recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
