"use client";

import React from "react";
import { BIOME_TYPES } from "@/lib/mapgen/config";

export const BiomeLegend: React.FC = () => {
  return (
    <div className="p-4 bg-white border border-gray-300 rounded shadow-md">
      <h3 className="text-lg font-semibold mb-2">Biome Legend</h3>
      <div className="grid grid-cols-2 gap-2">
        {BIOME_TYPES.map((biome) => (
          <div key={biome.name} className="flex items-center">
            <div
              className="w-4 h-4 mr-2"
              style={{ backgroundColor: biome.color }}
            />
            <span className="text-sm">{biome.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
