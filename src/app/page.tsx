import GraphCanvas from "@/components/GraphCanvas";
import UIOverlay from "@/components/UIOverlay";
import FilterPanel from "@/components/FilterPanel";
import PopupCard from "@/components/PopupCard";
import ZoomDock from "@/components/ZoomDock";

export default function Home() {
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
