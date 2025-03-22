"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BIOME_TYPES, GRID_PARAMS } from "@/lib/mapgen/config";
import type { GridCell, MapData } from "@/lib/mapgen/types";

interface WorldMapProps {
  mapData: MapData;
}

export const WorldMap: React.FC<WorldMapProps> = ({ mapData }) => {
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMapRendered, setIsMapRendered] = useState(false);
  const router = useRouter();

  // Get the biome color based on the biome name
  const getBiomeColor = (biomeName: string): string => {
    const biome = BIOME_TYPES.find((b) => b.name === biomeName);
    return biome?.color || "#000000";
  };

  // Convert grid coordinates to cell index
  const getCellFromCoords = (x: number, y: number): GridCell | null => {
    const gridX = Math.floor(x / GRID_PARAMS.cellSize);
    const gridY = Math.floor(y / GRID_PARAMS.cellSize);

    if (
      gridX < 0 ||
      gridX >= mapData.width ||
      gridY < 0 ||
      gridY >= mapData.height
    ) {
      return null;
    }

    const index = gridY * mapData.width + gridX;
    return mapData.cells[index] || null;
  };

  // Handle cell click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Get cell at this position
    const cell = getCellFromCoords(x, y);
    if (cell) {
      const gridX = Math.floor(cell.x / GRID_PARAMS.cellSize);
      const gridY = Math.floor(cell.y / GRID_PARAMS.cellSize);
      router.push(`/cell/${gridX}/${gridY}`);
    }
  };

  // Handle cell hover
  const handleCanvasHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Get cell at this position
    const cell = getCellFromCoords(x, y);
    setHoveredCell(cell);
  };

  // Render the map to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapData.cells.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each cell
    mapData.cells.forEach((cell) => {
      const { x, y, biome, hasRiver } = cell;

      // Fill cell with biome color
      ctx.fillStyle = getBiomeColor(biome);
      ctx.fillRect(x, y, GRID_PARAMS.cellSize, GRID_PARAMS.cellSize);

      // Draw rivers
      if (hasRiver) {
        ctx.fillStyle = "#0077be";
        ctx.fillRect(
          x + GRID_PARAMS.cellSize * 0.4,
          y + GRID_PARAMS.cellSize * 0.4,
          GRID_PARAMS.cellSize * 0.2,
          GRID_PARAMS.cellSize * 0.2
        );
      }
    });

    // Draw grid lines
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= GRID_PARAMS.width; x += GRID_PARAMS.cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GRID_PARAMS.height);
      ctx.stroke();
    }

    for (let y = 0; y <= GRID_PARAMS.height; y += GRID_PARAMS.cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GRID_PARAMS.width, y);
      ctx.stroke();
    }

    setIsMapRendered(true);
  }, [mapData]);

  // Highlight hovered cell
  useEffect(() => {
    if (!isMapRendered) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // We need to redraw the map first to clear previous highlights
    // This is inefficient but simple for this demo
    mapData.cells.forEach((cell) => {
      const { x, y, biome, hasRiver } = cell;

      // Redraw the cell with its biome color
      ctx.fillStyle = getBiomeColor(biome);
      ctx.fillRect(x, y, GRID_PARAMS.cellSize, GRID_PARAMS.cellSize);

      // Draw rivers
      if (hasRiver) {
        ctx.fillStyle = "#0077be";
        ctx.fillRect(
          x + GRID_PARAMS.cellSize * 0.4,
          y + GRID_PARAMS.cellSize * 0.4,
          GRID_PARAMS.cellSize * 0.2,
          GRID_PARAMS.cellSize * 0.2
        );
      }
    });

    // Draw grid lines again
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= GRID_PARAMS.width; x += GRID_PARAMS.cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GRID_PARAMS.height);
      ctx.stroke();
    }

    for (let y = 0; y <= GRID_PARAMS.height; y += GRID_PARAMS.cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GRID_PARAMS.width, y);
      ctx.stroke();
    }

    // Highlight the hovered cell if there is one
    if (hoveredCell) {
      const { x, y } = hoveredCell;

      // Highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(x, y, GRID_PARAMS.cellSize, GRID_PARAMS.cellSize);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, GRID_PARAMS.cellSize, GRID_PARAMS.cellSize);
    }
  }, [hoveredCell, isMapRendered, mapData.cells]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={GRID_PARAMS.width}
        height={GRID_PARAMS.height}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasHover}
        className="border border-gray-400 cursor-pointer"
      />

      {hoveredCell && (
        <div className="absolute top-4 right-4 p-4 bg-white border border-gray-300 rounded shadow-md w-64">
          <h3 className="text-lg font-semibold mb-2">Cell Information</h3>
          <p>
            <span className="font-medium">Position:</span> (
            {Math.floor(hoveredCell.x / GRID_PARAMS.cellSize)},{" "}
            {Math.floor(hoveredCell.y / GRID_PARAMS.cellSize)})
          </p>
          <p>
            <span className="font-medium">Biome:</span> {hoveredCell.biome}
          </p>
          <p>
            <span className="font-medium">Elevation:</span>{" "}
            {hoveredCell.elevation.toFixed(2)}
          </p>
          <p>
            <span className="font-medium">Moisture:</span>{" "}
            {hoveredCell.moisture.toFixed(2)}
          </p>
          <p>
            <span className="font-medium">Water:</span>{" "}
            {hoveredCell.isWater ? "Yes" : "No"}
          </p>
          <p>
            <span className="font-medium">River:</span>{" "}
            {hoveredCell.hasRiver ? "Yes" : "No"}
          </p>

          <div
            className="w-6 h-6 inline-block ml-2"
            style={{ backgroundColor: getBiomeColor(hoveredCell.biome) }}
          />

          <p className="mt-2 text-sm text-blue-600">Click for details</p>
        </div>
      )}
    </div>
  );
};
