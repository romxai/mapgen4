import { generateStaticMap } from "@/lib/mapgen/generateMap";
import { MAP_PARAMS } from "@/lib/mapgen/config";
import { NextResponse } from "next/server";

// Generate the map data with the fixed seed from our config
const mapData = generateStaticMap(MAP_PARAMS.elevation.seed);

// API route handler to serve the pre-generated map data
export async function GET() {
  return NextResponse.json(mapData);
}
