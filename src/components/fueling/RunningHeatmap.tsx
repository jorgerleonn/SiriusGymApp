"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { Maximize2, Minimize2 } from "lucide-react";

interface RunningHeatmapProps {
  tracks: [number, number, number][][];
}

function MapResizer({ isFullscreen, onResize }: { isFullscreen: boolean; onResize: () => void }) {
  const map = useMap();
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      map.invalidateSize();
      onResize();
    }, 100);
  }, [map, onResize]);

  useEffect(() => {
    debouncedResize();
  }, [map, isFullscreen, debouncedResize]);

  useEffect(() => {
    const handleResize = () => {
      debouncedResize();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [map, debouncedResize]);

  return null;
}

function HeatmapLayer({ tracks, isFullscreen, resizeCount, onHoverPace }: { tracks: [number, number, number][][]; isFullscreen: boolean; resizeCount: number; onHoverPace: (pace: string | null, x: number, y: number) => void }) {
  const map = useMap();

  const { heatData, grid } = useMemo(() => {
    const hData: [number, number, number][] = [];
    const g: Record<string, { sumPace: number; count: number }> = {};
    const gridSize = 0.001;

    tracks.forEach(track => {
      track.forEach(point => {
        hData.push([point[0], point[1], 0.05]);
        const pace = point[2];
        if (pace > 0) {
          const latBin = Math.floor(point[0] / gridSize);
          const lngBin = Math.floor(point[1] / gridSize);
          const key = `${latBin},${lngBin}`;
          if (!g[key]) g[key] = { sumPace: 0, count: 0 };
          g[key].sumPace += pace;
          g[key].count += 1;
        }
      });
    });
    return { heatData: hData, grid: g };
  }, [tracks]);

  useEffect(() => {
    if (!heatData || heatData.length === 0) return;

    const gridSize = 0.001;
    const getZoomOptions = (z: number) => {
      const constantMax = 1.0; 
      if (z >= 16) return { radius: 5, blur: 4, max: constantMax };
      if (z <= 13) return { radius: 3, blur: 2, max: constantMax };
      const t = (z - 13) / (16 - 13);
      return {
        radius: 3 + t * (5 - 3),
        blur: 2 + t * (4 - 2),
        max: constantMax
      };
    };

    let currentHeatLayer: L.HeatLayer | null = null;

    const refreshLayer = () => {
      if (currentHeatLayer) map.removeLayer(currentHeatLayer);
      const container = map.getContainer();
      const size = map.getSize();
      if (!container || container.offsetHeight === 0 || size.height === 0) return;
      const opts = getZoomOptions(map.getZoom());
      currentHeatLayer = L.heatLayer(heatData, {
        ...opts,
        maxZoom: 17,
        gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' },
      });
      try {
        map.invalidateSize();
        currentHeatLayer.addTo(map);
      } catch (e) {
        console.error("Heatmap addTo failed:", e);
      }
    };

    refreshLayer();
    map.on("zoomend", refreshLayer);

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const latBin = Math.floor(lat / gridSize);
      const lngBin = Math.floor(lng / gridSize);
      const key = `${latBin},${lngBin}`;
      
      if (grid[key]) {
        const avgPace = grid[key].sumPace / grid[key].count;
        const mins = Math.floor(avgPace / 60);
        const secs = Math.round(avgPace % 60);
        const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
        // console.log(`Hover hit: ${key}, Pace: ${formatted}`);
        onHoverPace(formatted, e.containerPoint.x, e.containerPoint.y);
      } else {
        onHoverPace(null, e.containerPoint.x, e.containerPoint.y);
      }
    };

    map.on("mousemove", handleMouseMove);

    return () => {
      map.off("zoomend", refreshLayer);
      map.off("mousemove", handleMouseMove);
      if (currentHeatLayer) map.removeLayer(currentHeatLayer);
    };
  }, [map, heatData, grid, isFullscreen, resizeCount, onHoverPace]);

  return null;
}


export function RunningHeatmap({ tracks }: RunningHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resizeCount, setResizeCount] = useState(0);
  const [hoverPace, setHoverPace] = useState<{ pace: string | null; x: number; y: number } | null>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleHoverPace = useCallback((pace: string | null, x: number, y: number) => {
    setHoverPace({ pace, x, y });
  }, []);

  if (!tracks || tracks.length === 0) {
    return (
      <div className="h-96 w-full bg-canvas border border-hairline rounded-xl flex items-center justify-center text-muted italic">
        No hay suficientes datos de ruta para generar el mapa de calor.
      </div>
    );
  }

  const center: [number, number] = [tracks[0][0][0], tracks[0][0][1]] || [0, 0];

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full rounded-xl overflow-hidden border border-hairline shadow-sm transition-all ${
        isFullscreen ? "h-screen w-screen" : "h-[500px]"
      }`}
    >
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapResizer isFullscreen={isFullscreen} onResize={() => setResizeCount(c => c + 1)} />
         <HeatmapLayer 
           tracks={tracks} 
           isFullscreen={isFullscreen} 
           resizeCount={resizeCount} 
           onHoverPace={handleHoverPace}
         />
      </MapContainer>
      
       {hoverPace?.pace && (
         <div 
           className="absolute z-[99999] pointer-events-none bg-primary text-white px-3 py-2 rounded-lg border border-white/20 text-[12px] font-bold shadow-xl"
           style={{ 
             left: `${hoverPace.x + 15}px`, 
             top: `${hoverPace.y + 15}px`,
             transform: 'translate(0, 0)',
           }}
         >
           Ritmo medio: {hoverPace.pace} min/km
         </div>
       )}

      {/* Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-xs">
        <button 
          onClick={toggleFullscreen}
          className="p-2 bg-surface-card/90 backdrop-blur border border-hairline rounded-lg text-muted hover:text-primary transition-colors"
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-surface-card/90 backdrop-blur border border-hairline p-sm rounded-lg pointer-events-none">
        <p className="text-caption text-muted mb-xs tracking-[1px] font-medium">
          DENSIDAD
        </p>
        <div className="flex items-center gap-xs">
          <div className="h-2 w-24 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500" />
          <span className="text-[10px] text-muted tabular-nums">
            Baja → Alta
          </span>
        </div>
      </div>
    </div>
  );
}
