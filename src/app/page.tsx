import { auth } from "@/auth";
import Link from "next/link";
import GraphCanvas from "@/components/GraphCanvas";
import UIOverlay from "@/components/UIOverlay";
import FilterPanel from "@/components/FilterPanel";
import PopupCard from "@/components/PopupCard";
import ZoomDock from "@/components/ZoomDock";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    return (
      <main className="relative w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
        <UIOverlay />
        <FilterPanel />
        <PopupCard />
        <ZoomDock />
        <GraphCanvas />
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-4xl font-bold">Kivo Dependency Graph</h1>

        <p className="text-lg text-gray-600 dark:text-gray-300">
          Internal dependency visualization tool. <br />
          Please sign in to access the graph.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md font-medium transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
