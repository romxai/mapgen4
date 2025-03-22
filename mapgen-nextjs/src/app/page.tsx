import { Suspense } from "react";
import { WorldMap } from "@/components/WorldMap";
import { BiomeLegend } from "@/components/BiomeLegend";
import { getMapData } from "@/lib/mapgen/mapDataFetcher";

export default function Home() {
  // Get pre-generated map data
  const mapData = getMapData();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">World Map Generator</h1>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-grow">
            <Suspense fallback={<div>Loading map...</div>}>
              <div className="overflow-auto">
                <WorldMap mapData={mapData} />
              </div>
            </Suspense>
          </div>

          <div className="w-full md:w-64">
            <BiomeLegend />
            <div className="mt-4 p-4 bg-white border border-gray-300 rounded shadow-md">
              <h3 className="text-lg font-semibold mb-2">Instructions</h3>
              <p className="text-sm">
                Click on any cell to view detailed information about that
                location.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
