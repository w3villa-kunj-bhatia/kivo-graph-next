"use client";

import { useEffect, useState } from "react";
import { getCompanies } from "@/app/actions/companyActions";
import { useGraphStore } from "@/store/useGraphStore";

export default function CompanySelector() {
  const [companies, setCompanies] = useState<any[]>([]);
  const setCompanyContext = useGraphStore((s) => s.setCompanyContext);
  const selectedId = useGraphStore((s) => s.selectedCompanyId);

  useEffect(() => {
    const loadData = async () => {
      const data = await getCompanies();
      setCompanies(data);
    };
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;

    if (!id) {
      // RESET: Pass null and empty array.
      // The store will detect null and auto-fill with Object.keys(COLORS)
      setCompanyContext(null, []);
      return;
    }

    const company = companies.find((c) => c._id === id);
    if (company) {
      setCompanyContext(company._id, company.allowedModules);
    }
  };

  return (
    <div className="pointer-events-auto shadow-lg rounded-lg">
      <select
        value={selectedId || ""}
        onChange={handleChange}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer w-56 font-medium"
      >
        <option value="">Show All (No Company)</option>
        <optgroup label="Select Company">
          {companies.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
