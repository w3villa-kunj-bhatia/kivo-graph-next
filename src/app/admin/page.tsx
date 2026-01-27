"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import {
  saveCompany,
  deleteCompany,
  getCompanies,
  getStatistics,
} from "@/app/actions/companyActions";
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
  X,
} from "lucide-react";

const AVAILABLE_MODULES = Object.keys(COLORS);

export default function AdminPage() {
  // Data State
  const [companies, setCompanies] = useState<any[]>([]);
  const [stats, setStats] = useState({
    companyCount: 0,
    userCount: 0,
    moduleCount: 0,
  });

  // Form State for Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formModules, setFormModules] = useState<Set<string>>(new Set());

  // Auth & UI State
  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // --- FIXED HOOK HERE ---
  const [state, formAction, isPending] = useActionState(saveCompany, {
    success: false,
    message: "",
    timestamp: 0, // Added to satisfy TypeScript
  });

  // 1. Fetch Data on Mount & After Success
  useEffect(() => {
    fetchData();
    if (state?.success) {
      resetForm();
    }
  }, [state]); // depend on the full state object

  async function fetchData() {
    const [companyData, statsData] = await Promise.all([
      getCompanies(),
      getStatistics(),
    ]);
    setCompanies(companyData);
    setStats(statsData);
  }

  // 2. Handle Edit Click
  function handleEdit(company: any) {
    setEditingId(company._id);
    setFormName(company.name);
    setFormModules(new Set(company.allowedModules));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 3. Handle Form Changes
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

  // 4. Handle Delete
  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this company?")) {
      await deleteCompany(id);
      fetchData();
    }
  }

  // Close profile on outside click
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* --- TOP HEADER --- */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-orange-500">Admin Dashboard</h1>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition border border-gray-700 shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Graph View</span>
          </Link>

          {/* Profile Dropdown */}
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
                    {session?.user?.name || "Admin User"}
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

      {/* --- STATS CARDS --- */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* --- LEFT: Create / Edit Form --- */}
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
                    className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border transition-all ${
                      formModules.has(mod)
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-gray-700/30 border-transparent hover:border-gray-600"
                    }`}
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
                className={`text-sm p-2 rounded ${
                  state.success
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}
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

        {/* --- RIGHT: Existing Companies --- */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Existing Companies</h2>
            <span className="bg-gray-700 text-xs font-bold px-2 py-1 rounded-full text-gray-300">
              {companies.length}
            </span>
          </div>

          {companies.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-lg">
              <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 italic">No companies found.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-150 overflow-y-auto pr-2 custom-scrollbar">
              {companies.map((company) => (
                <div
                  key={company._id}
                  className={`p-4 rounded-lg border flex justify-between items-center group transition-all ${
                    editingId === company._id
                      ? "bg-orange-500/10 border-orange-500/50 ring-1 ring-orange-500/30"
                      : "bg-gray-700/30 border-gray-700 hover:bg-gray-700/50"
                  }`}
                >
                  <div>
                    <h3
                      className={`font-bold text-lg transition-colors ${
                        editingId === company._id
                          ? "text-orange-400"
                          : "text-white group-hover:text-orange-400"
                      }`}
                    >
                      {company.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {company.allowedModules.length > 0 ? (
                        company.allowedModules.slice(0, 4).map((m: string) => (
                          <span
                            key={m}
                            className="text-[10px] bg-gray-800 border border-gray-600 px-2 py-0.5 rounded text-gray-300"
                          >
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">
                          No modules assigned
                        </span>
                      )}
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
                      className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(company._id)}
                      className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                    >
                      <LogOut className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
