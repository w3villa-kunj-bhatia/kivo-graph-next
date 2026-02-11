"use client";

import { useEffect, useState } from "react";
import { getCompanies } from "@/app/actions/companyActions";
import { getCompanyGraph } from "@/app/actions/graphActions";
import { useGraphStore } from "@/store/useGraphStore";
import { processGraphData } from "@/utils/graphUtils";

interface CompanySelectorProps {
  className?: string;
}

export default function CompanySelector({ className }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<any[]>([]);
  const { setCompanyContext, setGraphData, setIsLoading, moduleColors } =
    useGraphStore();
  const selectedId = useGraphStore((s) => s.selectedCompanyId);

  useEffect(() => {
    const loadData = async () => {
      const data = await getCompanies();
      setCompanies(data);
    };
    loadData();
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setIsLoading(true);

    try {
      if (!id) {
        const rawGraph = await getCompanyGraph();
        const processed = processGraphData(rawGraph);
        const allModuleKeys = Object.keys(moduleColors);
        setCompanyContext(null, allModuleKeys);
        setGraphData(processed);
      } else {
        const company = companies.find((c) => c._id === id);
        if (company) {
          const rawGraph = await getCompanyGraph(company._id);
          const processed = processGraphData(rawGraph);
          setCompanyContext(company._id, company.allowedModules);
          setGraphData(processed);
        }
      }
    } catch (error) {
      console.error("Failed to load company graph", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`pointer-events-auto shadow-sm rounded-lg ${className}`}>
      <select
        value={selectedId || ""}
        onChange={handleChange}
        className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs lg:text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer font-medium h-10"
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
