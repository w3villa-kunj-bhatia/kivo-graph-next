"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import {
  createCompany,
  deleteCompany,
  getCompanies,
  getStatistics, // Import the new action
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
} from "lucide-react";

const AVAILABLE_MODULES = Object.keys(COLORS);

export default function AdminPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  // --- NEW: Stats State ---
  const [stats, setStats] = useState({
    companyCount: 0,
    userCount: 0,
    moduleCount: 0,
  });

  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [state, formAction, isPending] = useActionState(createCompany, {
    success: false,
    message: "",
  });

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, [state?.success]);

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

  async function fetchData() {
    const [companyData, statsData] = await Promise.all([
      getCompanies(),
      getStatistics(),
    ]);
    setCompanies(companyData);
    setStats(statsData);
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure?")) {
      await deleteCompany(id);
      fetchData(); // Refresh both lists and stats
    }
  }

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
        {/* --- LEFT: Create Form --- */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Add New Company</h2>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-gray-400">
                Company Name
              </label>
              <input
                type="text"
                name="name"
                required
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
                    className="flex items-center space-x-2 bg-gray-700/30 p-2 rounded-lg hover:bg-gray-700 cursor-pointer border border-transparent hover:border-gray-600 transition-all"
                  >
                    <input
                      type="checkbox"
                      name="modules"
                      value={mod}
                      className="accent-orange-500 w-4 h-4"
                    />
                    <span className="text-sm">{mod}</span>
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
              {isPending ? "Creating..." : "Create Company"}
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
                  className="p-4 bg-gray-700/30 rounded-lg border border-gray-700 flex justify-between items-center group hover:bg-gray-700/50 transition-all"
                >
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-orange-400 transition-colors">
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
                  <button
                    onClick={() => handleDelete(company._id)}
                    className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                    title="Delete Company"
                  >
                    <LogOut className="w-4 h-4 rotate-180" />{" "}
                    {/* Using LogOut as a generic delete icon variant if Trash isn't imported, but standard Trash is better */}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
