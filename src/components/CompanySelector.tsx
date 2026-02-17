"use client";

import { useEffect, useState } from "react";
import { getCompanies } from "@/app/actions/companyActions";
import { getCompanyGraph } from "@/app/actions/graphActions";
import { useGraphStore } from "@/store/useGraphStore";
import { processGraphData } from "@/utils/graphUtils";
import { ChevronDown } from "lucide-react";

interface CompanySelectorProps {
  className?: string;
}

export default function CompanySelector({
  className = "",
}: CompanySelectorProps) {
  const [companies, setCompanies] = useState<any[]>([]);
  const {
    setCompanyContext,
    setGraphData,
    setIsLoading,
    moduleColors,
    selectedCompanyId,
  } = useGraphStore();

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
    <div className={`relative group shrink-0 ${className}`}>
      <select
        value={selectedCompanyId || ""}
        onChange={handleChange}
        className="h-10 w-full rounded-xl border border-(--border) bg-(--bg)/50 backdrop-blur-md text-(--text-main) text-sm pl-3 pr-10 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none font-medium"
      >
        <option value="">Show All (No Company)</option>
        <optgroup label="Companies" className="bg-(--card-bg)">
          {companies.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </optgroup>
      </select>

      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-(--text-sub) pointer-events-none group-focus-within:text-blue-500 transition-colors" />
    </div>
  );
}
