import { getMapData } from "@/lib/mapgen/mapDataFetcher";
import { BIOME_TYPES, GRID_PARAMS } from "@/lib/mapgen/config";
import { notFound } from "next/navigation";
import Link from "next/link";

export default function CellDetail({
  params,
}: {
  params: { x: string; y: string };
}) {
  const x = parseInt(params.x, 10);
  const y = parseInt(params.y, 10);

  if (isNaN(x) || isNaN(y)) {
    return notFound();
  }

  const mapData = getMapData();
  const gridWidth = Math.floor(GRID_PARAMS.width / GRID_PARAMS.cellSize);
  const gridHeight = Math.floor(GRID_PARAMS.height / GRID_PARAMS.cellSize);

  // Check if coordinates are valid
  if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
    return notFound();
  }

  // Get cell at this position
  const index = y * gridWidth + x;
  const cell = mapData.cells[index];

  if (!cell) {
    return notFound();
  }

  // Get biome color
  const biome = BIOME_TYPES.find((b) => b.name === cell.biome);
  const biomeColor = biome?.color || "#000000";

  // Generate random resources based on biome and position
  const getResources = () => {
    const resources = [];
    const resourceTypes = {
      Ocean: ["Fish", "Pearls", "Coral"],
      Beach: ["Sand", "Shells", "Crabs"],
      Desert: ["Cactus", "Gold", "Oil"],
      Grassland: ["Wheat", "Horses", "Cattle"],
      Savanna: ["Lions", "Zebras", "Acacia"],
      Forest: ["Wood", "Deer", "Berries"],
      Rainforest: ["Exotic Fruits", "Rubber", "Medicinal Plants"],
      Shrubland: ["Stone", "Sheep", "Herbs"],
      Taiga: ["Fur", "Wolves", "Pine"],
      Tundra: ["Furs", "Oil", "Gas"],
      Mountain: ["Ore", "Gems", "Coal"],
      Snow: ["Ice", "Polar Bears", "Nothing"],
    };

    const biomeResources =
      resourceTypes[cell.biome as keyof typeof resourceTypes] || [];

    // Seed-based random selection
    const seed = x * 1000 + y;
    const rng = () => ((seed * 9301 + 49297) % 233280) / 233280;

    // Add 1-3 resources
    const numResources = Math.floor(rng() * 3) + 1;
    for (let i = 0; i < numResources && i < biomeResources.length; i++) {
      const resourceIndex = Math.floor(rng() * biomeResources.length);
      const resource = biomeResources[resourceIndex];
      if (!resources.includes(resource)) {
        resources.push(resource);
      }
    }

    return resources;
  };

  const resources = getResources();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link
        href="/"
        className="text-blue-600 hover:underline mb-8 inline-block"
      >
        &larr; Back to Map
      </Link>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <h1 className="text-3xl font-bold">
              Cell ({x}, {y})
            </h1>
            <div
              className="w-8 h-8 ml-4 rounded"
              style={{ backgroundColor: biomeColor }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Terrain Information
              </h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Biome:</span> {cell.biome}
                </p>
                <p>
                  <span className="font-medium">Elevation:</span>{" "}
                  {cell.elevation.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Moisture:</span>{" "}
                  {cell.moisture.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Water:</span>{" "}
                  {cell.isWater ? "Yes" : "No"}
                </p>
                <p>
                  <span className="font-medium">River:</span>{" "}
                  {cell.hasRiver ? "Yes" : "No"}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Resources</h2>
              <ul className="list-disc pl-5">
                {resources.map((resource, index) => (
                  <li key={index}>{resource}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Adjacent Cells</h2>
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {[
                { dx: -1, dy: -1 },
                { dx: 0, dy: -1 },
                { dx: 1, dy: -1 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 0 },
                { dx: 1, dy: 0 },
                { dx: -1, dy: 1 },
                { dx: 0, dy: 1 },
                { dx: 1, dy: 1 },
              ].map(({ dx, dy }, index) => {
                const nx = x + dx;
                const ny = y + dy;
                const isValid =
                  nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight;
                const cellIndex = isValid ? ny * gridWidth + nx : -1;
                const adjacentCell = isValid ? mapData.cells[cellIndex] : null;

                return (
                  <div
                    key={index}
                    className={`w-16 h-16 flex items-center justify-center border ${
                      dx === 0 && dy === 0
                        ? "border-2 border-black"
                        : "border-gray-300"
                    }`}
                    style={{
                      backgroundColor: adjacentCell
                        ? BIOME_TYPES.find((b) => b.name === adjacentCell.biome)
                            ?.color
                        : "#cccccc",
                    }}
                  >
                    {(isValid && dx !== 0) || dy !== 0 ? (
                      <Link
                        href={`/cell/${nx}/${ny}`}
                        className="w-full h-full flex items-center justify-center text-xs hover:bg-white hover:bg-opacity-30"
                      >
                        {nx},{ny}
                      </Link>
                    ) : (
                      <span className="text-xs">
                        {dx === 0 && dy === 0 ? "Current" : "N/A"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
