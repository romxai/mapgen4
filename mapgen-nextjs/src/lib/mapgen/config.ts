// Fixed parameters for map generation
import type { MapParams } from "./types";

// These values are chosen to create a deterministic map with interesting features
export const MAP_PARAMS: MapParams = {
  elevation: {
    seed: 187, // Fixed seed for deterministic generation
    island: 0.2,
    noisy_coastlines: 0.01,
    hill_height: 0.02,
    mountain_jagged: 0.3,
    mountain_sharpness: 9.8,
    ocean_depth: 1.5,
  },
  biomes: {
    wind_angle_deg: 45, // Wind blows northeast to southwest
    raininess: 0.9,
    rain_shadow: 0.5,
    evaporation: 0.5,
  },
  rivers: {
    lg_min_flow: 2.7,
    lg_river_width: -2.7,
    flow: 0.2,
  },
  render: {
    zoom: 100 / 480,
    x: 500,
    y: 500,
    light_angle_deg: 80,
    slope: 2,
    flat: 2.5,
    ambient: 0.25,
    overhead: 30,
    tilt_deg: 0,
    rotate_deg: 0,
    mountain_height: 50,
    outline_depth: 1,
    outline_strength: 15,
    outline_threshold: 0,
    outline_coast: 0,
    outline_water: 10.0,
    biome_colors: 1,
  },
};

// Mesh generation parameters
export const MESH_PARAMS = {
  spacing: 25, // Controls density of points
  mountainSpacing: 150, // Controls density of mountain peaks
};

// Grid parameters for the interactive overlay
export const GRID_PARAMS = {
  width: 1000, // Width of the map in pixels
  height: 1000, // Height of the map in pixels
  cellSize: 10, // Size of each grid cell in pixels (1000x1000 grid with 10px cells = 100x100 grid)
};

// Define biome types based on elevation and moisture
export const BIOME_TYPES = [
  {
    name: "Ocean",
    elevation: [-1.0, -0.1],
    moisture: [0.0, 1.0],
    color: "#0077be",
  },
  {
    name: "Beach",
    elevation: [-0.1, 0.05],
    moisture: [0.0, 1.0],
    color: "#e0c9a6",
  },
  {
    name: "Desert",
    elevation: [0.05, 1.0],
    moisture: [0.0, 0.2],
    color: "#e9ddc7",
  },
  {
    name: "Grassland",
    elevation: [0.05, 0.4],
    moisture: [0.2, 0.4],
    color: "#8db580",
  },
  {
    name: "Savanna",
    elevation: [0.05, 0.4],
    moisture: [0.4, 0.6],
    color: "#c0d890",
  },
  {
    name: "Forest",
    elevation: [0.05, 0.6],
    moisture: [0.6, 1.0],
    color: "#4a7c59",
  },
  {
    name: "Rainforest",
    elevation: [0.05, 0.4],
    moisture: [0.8, 1.0],
    color: "#338033",
  },
  {
    name: "Shrubland",
    elevation: [0.4, 0.6],
    moisture: [0.2, 0.6],
    color: "#adbd8f",
  },
  {
    name: "Taiga",
    elevation: [0.4, 0.8],
    moisture: [0.6, 1.0],
    color: "#598073",
  },
  {
    name: "Tundra",
    elevation: [0.6, 0.8],
    moisture: [0.0, 0.6],
    color: "#9da6a5",
  },
  {
    name: "Mountain",
    elevation: [0.8, 1.0],
    moisture: [0.0, 1.0],
    color: "#787878",
  },
  {
    name: "Snow",
    elevation: [0.8, 1.0],
    moisture: [0.4, 1.0],
    color: "#f0f0f0",
  },
];
