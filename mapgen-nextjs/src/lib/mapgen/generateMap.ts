// Simplified map generation for Next.js
import { createNoise2D } from "simplex-noise";
import { BIOME_TYPES, GRID_PARAMS } from "./config";
import type { GridCell, MapData } from "./types";

// Function to generate a static map with a fixed seed
export function generateStaticMap(seed: number): MapData {
  // Create noise generators with the fixed seed
  const noise2D = createNoise2D(() => seed / 2147483647);
  const noise2D_2 = createNoise2D(() => (seed + 1) / 2147483647);
  const noise2D_3 = createNoise2D(() => (seed + 2) / 2147483647);

  // Calculate grid dimensions based on cell size
  const gridWidth = Math.floor(GRID_PARAMS.width / GRID_PARAMS.cellSize);
  const gridHeight = Math.floor(GRID_PARAMS.height / GRID_PARAMS.cellSize);
  const cells: GridCell[] = [];

  // Generate cell data for the entire grid
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      // Convert grid coordinates to normalized coordinates for noise
      const nx = x / gridWidth;
      const ny = y / gridHeight;

      // Create overlapping noise patterns for more natural terrain
      // Adjust these values to change the terrain patterns
      const e1 = noise2D(nx * 3, ny * 3);
      const e2 = 0.5 * noise2D_2(nx * 6, ny * 6);
      const e3 = 0.25 * noise2D_3(nx * 12, ny * 12);

      // Combine noise and apply a circular island mask to create an island
      let elevation = (e1 + e2 + e3) / 1.75;
      const distanceFromCenter = Math.sqrt(
        Math.pow(nx - 0.5, 2) + Math.pow(ny - 0.5, 2)
      );

      // Create island effect by decreasing elevation near edges
      elevation = elevation * (1 - distanceFromCenter * 1.5);

      // Generate moisture with different noise frequency
      const moisture = (noise2D(nx * 5 + 100, ny * 5 + 100) + 1) / 2; // Normalized to 0-1

      // Determine if cell has a river
      const riverNoise = noise2D(nx * 8 + 200, ny * 8 + 200);
      // Rivers follow low elevation paths and certain noise patterns
      const hasRiver =
        elevation > -0.05 &&
        elevation < 0.3 &&
        riverNoise > 0.7 &&
        moisture > 0.5;

      // Determine biome based on elevation and moisture
      const biome = determineBiome(elevation, moisture);

      // Add cell to grid
      cells.push({
        id: `${x}-${y}`,
        x: x * GRID_PARAMS.cellSize,
        y: y * GRID_PARAMS.cellSize,
        elevation,
        moisture,
        biome: biome.name,
        isWater: elevation < 0,
        hasRiver,
      });
    }
  }

  return {
    cells,
    width: gridWidth,
    height: gridHeight,
  };
}

// Determine the biome based on elevation and moisture
function determineBiome(elevation: number, moisture: number) {
  for (const biome of BIOME_TYPES) {
    if (
      elevation >= biome.elevation[0] &&
      elevation <= biome.elevation[1] &&
      moisture >= biome.moisture[0] &&
      moisture <= biome.moisture[1]
    ) {
      return biome;
    }
  }

  // Default to ocean if no matching biome
  return BIOME_TYPES[0];
}
