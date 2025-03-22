// Type definitions for map generation

export interface Mesh {
  numRegions: number;
  numTriangles: number;
  numSolidTriangles: number;
  numSides: number;
  numSolidSides: number;
  _s_of_r: Int32Array;
  _halfedges: Int32Array;
  is_boundary_t: Int8Array;
  length_s: Float32Array;

  // Methods
  x_of_r: (r: number) => number;
  y_of_r: (r: number) => number;
  x_of_t: (t: number) => number;
  y_of_t: (t: number) => number;
  s_next_s: (s: number) => number;
  s_opposite_s: (s: number) => number;
  t_inner_s: (s: number) => number;
  t_outer_s: (s: number) => number;
  r_begin_s: (s: number) => number;
  r_end_s: (s: number) => number;
  r_around_t: (t: number) => number[];
  is_boundary_r: (r: number) => boolean;
}

export interface MapParams {
  elevation: {
    seed: number;
    island: number;
    noisy_coastlines: number;
    hill_height: number;
    mountain_jagged: number;
    mountain_sharpness: number;
    ocean_depth: number;
  };
  biomes: {
    wind_angle_deg: number;
    raininess: number;
    rain_shadow: number;
    evaporation: number;
  };
  rivers: {
    lg_min_flow: number;
    lg_river_width: number;
    flow: number;
  };
  render: {
    zoom: number;
    x: number;
    y: number;
    light_angle_deg: number;
    slope: number;
    flat: number;
    ambient: number;
    overhead: number;
    tilt_deg: number;
    rotate_deg: number;
    mountain_height: number;
    outline_depth: number;
    outline_strength: number;
    outline_threshold: number;
    outline_coast: number;
    outline_water: number;
    biome_colors: number;
  };
}

export interface Point {
  x: number;
  y: number;
}

export interface GridCell {
  id: string;
  x: number;
  y: number;
  elevation: number;
  moisture: number;
  biome: string;
  isWater: boolean;
  hasRiver: boolean;
}

export interface MapData {
  cells: GridCell[];
  width: number;
  height: number;
}
