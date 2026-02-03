"use client";

import { useEffect, useState } from "react";
import { getCompanies } from "@/app/actions/companyActions";
import { getCompanyGraph } from "@/app/actions/graphActions";
import { useGraphStore } from "@/store/useGraphStore";
import { processGraphData } from "@/utils/graphUtils";

export default function CompanySelector() {
  const [companies, setCompanies] = useState<any[]>([]);
  const { setCompanyContext, setGraphData, setIsLoading } = useGraphStore();
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
        setCompanyContext(null, []);
        const rawGraph = await getCompanyGraph();
        const processed = processGraphData(rawGraph);
        setGraphData(processed);
      } else {
        const company = companies.find((c) => c._id === id);
        if (company) {
          setCompanyContext(company._id, company.allowedModules);

          const rawGraph = await getCompanyGraph(company._id);
          const processed = processGraphData(rawGraph);
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
