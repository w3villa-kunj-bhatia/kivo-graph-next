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
import { COLORS } from "@/utils/constants";
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
} from "lucide-react";

const AVAILABLE_MODULES = Object.keys(COLORS);
type SortOption = "name-asc" | "name-desc" | "modules-most" | "modules-least";
type Tab = "companies" | "users" | "logs";

export default function AdminPage() {
  const { isDarkMode, toggleTheme } = useGraphStore();
  const [activeTab, setActiveTab] = useState<Tab>("companies");

  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
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

  const [companyState, companyAction, isCompanyPending] = useActionState(
    saveCompany,
    {
      success: false,
      message: "",
      timestamp: 0,
    },
  );

  const [uploadState, uploadAction, isUploading] = useActionState(uploadGraph, {
    success: false,
    message: "",
  });

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
    if (companyState?.success) {
      setToast({ message: companyState.message, type: "success" });
      resetForm();
      fetchData();
    } else if (companyState?.message) {
      setToast({ message: companyState.message, type: "error" });
    }
  }, [companyState]);

  useEffect(() => {
    if (uploadState?.success) {
      setToast({
        message: uploadState.message || "Graph updated successfully",
        type: "success",
      });
      fetchData();
    } else if (uploadState?.message) {
      setToast({ message: uploadState.message, type: "error" });
    }
  }, [uploadState]);

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
      const [companyData, userData, statsData, logsData] = await Promise.all([
        getCompanies(),
        getUsers(),
        getStatistics(),
        getGraphLogs(),
      ]);
      setCompanies(companyData);
      setUsers(userData);
      setStats(statsData);
      setLogs(logsData);
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

  function handleEdit(company: any) {
    setActiveTab("companies");
    setEditingId(company._id);
    setFormName(company.name);
    setFormModules(new Set(company.allowedModules));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleModule(mod: string) {
    const newSet = new Set(formModules);
    if (newSet.has(mod)) newSet.delete(mod);
    else newSet.add(mod);
    setFormModules(newSet);
  }

  function resetForm() {
    setEditingId(null);
    setFormName("");
    setFormModules(new Set());
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

      <div className="flex gap-4 mb-6 border-b border-(--border)">
        <button
          onClick={() => setActiveTab("companies")}
          className={`pb-2 px-4 text-sm font-bold transition-all ${activeTab === "companies" ? "text-orange-500 border-b-2 border-orange-500" : "text-(--text-sub) hover:text-(--text-main)"}`}
        >
          Manage Companies
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-2 px-4 text-sm font-bold transition-all ${activeTab === "users" ? "text-orange-500 border-b-2 border-orange-500" : "text-(--text-sub) hover:text-(--text-main)"}`}
        >
          Manage Users
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-2 px-4 text-sm font-bold transition-all ${activeTab === "logs" ? "text-orange-500 border-b-2 border-orange-500" : "text-(--text-sub) hover:text-(--text-main)"}`}
        >
          Graph Activity
        </button>
      </div>

      {activeTab === "companies" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-full">
          <div
            className={`bg-(--card-bg) p-6 rounded-xl border shadow-lg transition-colors flex flex-col h-150 ${editingId ? "border-orange-500/50" : "border-(--border)"}`}
          >
            <div className="flex items-center justify-between mb-6">
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
            <form
              action={companyAction}
              className="space-y-4 flex-1 flex flex-col"
            >
              {editingId && <input type="hidden" name="id" value={editingId} />}
              <div>
                <label className="block text-sm mb-1 text-(--text-sub)">
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
              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-md mb-2 text-(--text-sub)">
                  Allowed Modules
                </label>
                <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 custom-scrollbar flex-1 border border-(--border) rounded-lg p-2 bg-(--bg)/50">
                  {AVAILABLE_MODULES.map((mod) => (
                    <label
                      key={mod}
                      className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer border transition-all h-fit ${formModules.has(mod) ? "bg-orange-500/10 border-orange-500/30" : "bg-(--card-bg) border-transparent hover:border-(--border)"}`}
                    >
                      <input
                        type="checkbox"
                        name="modules"
                        value={mod}
                        checked={formModules.has(mod)}
                        onChange={() => toggleModule(mod)}
                        className="accent-orange-500 w-4 h-4"
                      />
                      <span
                        className={`text-md ${formModules.has(mod) ? "text-orange-500 font-medium" : "text-(--text-sub)"}`}
                      >
                        {mod}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                disabled={isCompanyPending}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-orange-500/20 mt-4"
              >
                {isCompanyPending
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

            <form action={uploadAction} className="space-y-4">
              <input
                type="hidden"
                name="uploaderEmail"
                value={session?.user?.email || ""}
              />

              <div className="border-2 border-dashed border-(--border) rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-orange-500/50 transition bg-(--bg)/50 relative group">
                <FileJson className="w-8 h-8 text-(--text-sub) mb-2 group-hover:text-orange-500 transition-colors" />
                <label className="cursor-pointer inset-0 absolute w-full h-full flex items-center justify-center">
                  <input
                    type="file"
                    name="file"
                    accept=".json"
                    required
                    className="opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
                <span className="text-orange-500 font-bold hover:underline pointer-events-none">
                  Click to browse
                </span>
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

          <div className="md:col-span-2 bg-(--card-bg) p-6 rounded-xl border border-(--border) shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-(--text-main)" />
              <h2 className="text-xl font-semibold text-(--text-main)">
                Version History
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-(--border) text-(--text-sub) text-sm uppercase">
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Uploaded By</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {logs.map((log, index) => (
                    <tr
                      key={log._id}
                      className="border-b border-(--border) hover:bg-(--bg) transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-(--text-main) flex items-center gap-2">
                        <FileJson className="w-4 h-4 text-(--text-sub)" />
                        {log.fileName}
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
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-10 text-(--text-sub) italic"
                      >
                        No history found. Upload a graph to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
