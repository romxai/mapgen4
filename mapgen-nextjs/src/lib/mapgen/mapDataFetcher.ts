import { generateStaticMap } from "./generateMap";
import { MAP_PARAMS } from "./config";
import type { MapData } from "./types";

// Generate the static map data
// This will be used during build time to generate the map once
let mapDataCache: MapData | null = null;

export function getMapData(): MapData {
  if (!mapDataCache) {
    console.log("Generating map data...");
    mapDataCache = generateStaticMap(MAP_PARAMS.elevation.seed);
  }
  return mapDataCache;
}
