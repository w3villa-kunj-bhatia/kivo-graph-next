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

import { COLORS } from "@/utils/constants";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
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
} from "lucide-react";

const AVAILABLE_MODULES = Object.keys(COLORS);
type SortOption = "name-asc" | "name-desc" | "modules-most" | "modules-least";
type Tab = "companies" | "users";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("companies");

  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
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

  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [state, formAction, isPending] = useActionState(saveCompany, {
    success: false,
    message: "",
    timestamp: 0,
  });

  useEffect(() => {
    fetchData();
    if (state?.success) resetForm();
  }, [state]);

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
    const [companyData, userData, statsData] = await Promise.all([
      getCompanies(),
      getUsers(),
      getStatistics(),
    ]);
    setCompanies(companyData);
    setUsers(userData);
    setStats(statsData);
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

  async function handleDeleteCompany(id: string) {
    if (confirm("Are you sure?")) {
      await deleteCompany(id);
      fetchData();
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  async function handleToggleRole(id: string, currentRole: string) {
    if (
      session?.user?.email === users.find((u) => u._id === id)?.email &&
      currentRole === "admin"
    ) {
      if (
        !confirm(
          "Warning: You are demoting yourself. You will lose access to this page immediately.",
        )
      )
        return;
    }

    await toggleUserRole(id, currentRole);
    fetchData();
  }

  async function handleDeleteUser(id: string) {
    if (session?.user?.email === users.find((u) => u._id === id)?.email) {
      alert("You cannot delete your own account while logged in.");
      return;
    }
    if (confirm("Permanently delete this user?")) {
      await deleteUser(id);
      fetchData();
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-orange-500">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage system resources and access.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition border border-gray-700 shadow-sm"
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
              <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 border-b border-gray-700 mb-1">
                  <p className="text-sm font-bold text-white truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {session?.user?.email}
                  </p>
                  <span className="text-[10px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold mt-1 inline-block">
                    {session?.user?.role || "Admin"}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition w-full text-left"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Companies</p>
            <p className="text-2xl font-bold text-white">
              {stats.companyCount}
            </p>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">
              Registered Users
            </p>
            <p className="text-2xl font-bold text-white">{stats.userCount}</p>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Active Modules</p>
            <p className="text-2xl font-bold text-white">{stats.moduleCount}</p>
          </div>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("companies")}
          className={`pb-2 px-4 text-sm font-bold transition-all ${activeTab === "companies" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-400 hover:text-white"}`}
        >
          Manage Companies
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-2 px-4 text-sm font-bold transition-all ${activeTab === "users" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-400 hover:text-white"}`}
        >
          Manage Users
        </button>
      </div>

      {/* --- TAB CONTENT: COMPANIES --- */}
      {activeTab === "companies" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div
            className={`bg-gray-800 p-6 rounded-xl border h-fit shadow-lg transition-colors ${editingId ? "border-orange-500/50" : "border-gray-700"}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-semibold">
                  {editingId ? "Edit Company" : "Add New Company"}
                </h2>
              </div>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-xs flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              )}
            </div>

            <form action={formAction} className="space-y-4">
              {editingId && <input type="hidden" name="id" value={editingId} />}
              <div>
                <label className="block text-sm mb-1 text-gray-400">
                  Company Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full p-2.5 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-orange-500 outline-none text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-400">
                  Allowed Modules
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {AVAILABLE_MODULES.map((mod) => (
                    <label
                      key={mod}
                      className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border transition-all ${formModules.has(mod) ? "bg-orange-500/10 border-orange-500/30" : "bg-gray-700/30 border-transparent hover:border-gray-600"}`}
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
                        className={`text-sm ${formModules.has(mod) ? "text-orange-200" : "text-gray-300"}`}
                      >
                        {mod}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {state?.message && (
                <p
                  className={`text-sm p-2 rounded ${state.success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                >
                  {state.message}
                </p>
              )}
              <button
                disabled={isPending}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-orange-500/20"
              >
                {isPending
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update Company"
                    : "Create Company"}
              </button>
            </form>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Existing Companies</h2>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-gray-700 border border-gray-600 text-xs text-white rounded px-2 py-1 outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="modules-most">Modules (Most)</option>
                  <option value="modules-least">Modules (Least)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 max-h-150 overflow-y-auto pr-2 custom-scrollbar">
              {sortedCompanies.map((company) => (
                <div
                  key={company._id}
                  className={`p-4 rounded-lg border flex justify-between items-center group transition-all ${editingId === company._id ? "bg-orange-500/10 border-orange-500/50" : "bg-gray-700/30 border-gray-700 hover:bg-gray-700/50"}`}
                >
                  <div>
                    <h3
                      className={`font-bold text-lg ${editingId === company._id ? "text-orange-400" : "text-white"}`}
                    >
                      {company.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {company.allowedModules.slice(0, 4).map((m: string) => (
                        <span
                          key={m}
                          className="text-[10px] bg-gray-800 border border-gray-600 px-2 py-0.5 rounded text-gray-300"
                        >
                          {m}
                        </span>
                      ))}
                      {company.allowedModules.length > 4 && (
                        <span className="text-[10px] bg-gray-800 border border-gray-600 px-2 py-0.5 rounded text-gray-300">
                          +{company.allowedModules.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(company)}
                      className="text-gray-400 hover:text-blue-400 p-2"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company._id)}
                      className="text-gray-400 hover:text-red-400 p-2"
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

      {/* --- TAB CONTENT: USERS --- */}
      {activeTab === "users" && (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-semibold">User Management</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:border-orange-500 outline-none w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm uppercase">
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
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-500/20">
                          <ShieldAlert className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-500/20">
                          <Shield className="w-3 h-3" /> User
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Promote/Demote Button */}
                        <button
                          onClick={() => handleToggleRole(user._id, user.role)}
                          className={`text-xs px-3 py-1.5 rounded font-medium border transition-colors ${
                            user.role === "admin"
                              ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                              : "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          }`}
                        >
                          {user.role === "admin" ? "Demote" : "Promote"}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
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
                      className="text-center py-8 text-gray-500 italic"
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
    </div>
  );
}
