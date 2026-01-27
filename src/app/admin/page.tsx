"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createCompany,
  deleteCompany,
  getCompanies,
} from "@/app/actions/companyActions";
import { COLORS } from "@/utils/constants"; // Imports your 'HRMS', 'ATS' keys

// We get the keys from your constants to generate checkboxes
const AVAILABLE_MODULES = Object.keys(COLORS);

export default function AdminPage() {
  const [companies, setCompanies] = useState<any[]>([]);

  // React 19 hook for handling form submissions with server actions
  const [state, formAction, isPending] = useActionState(createCompany, {
    success: false,
    message: "",
  });

  // Fetch companies on mount and after successful add
  useEffect(() => {
    fetchCompanies();
  }, [state?.success]); // Re-fetch when a new company is added

  async function fetchCompanies() {
    const data = await getCompanies();
    setCompanies(data);
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure?")) {
      await deleteCompany(id);
      fetchCompanies();
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-orange-500">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* --- LEFT: Create Form --- */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-fit">
          <h2 className="text-xl font-semibold mb-4">Add New Company</h2>

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
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-orange-500 outline-none text-white"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-400">
                Allowed Modules
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_MODULES.map((mod) => (
                  <label
                    key={mod}
                    className="flex items-center space-x-2 bg-gray-700/50 p-2 rounded hover:bg-gray-700 cursor-pointer"
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
                className={`text-sm ${state.success ? "text-green-400" : "text-red-400"}`}
              >
                {state.message}
              </p>
            )}

            <button
              disabled={isPending}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded font-medium transition-colors disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Company"}
            </button>
          </form>
        </div>

        {/* --- RIGHT: Existing Companies --- */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Existing Companies</h2>

          {companies.length === 0 ? (
            <p className="text-gray-500 italic">No companies found.</p>
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
                <div
                  key={company._id}
                  className="p-4 bg-gray-700/30 rounded border border-gray-700 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-lg">{company.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {company.allowedModules.length > 0 ? (
                        company.allowedModules.map((m: string) => (
                          <span
                            key={m}
                            className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300"
                          >
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">
                          No modules assigned
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(company._id)}
                    className="text-red-400 hover:text-red-300 p-2"
                  >
                    Delete
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
