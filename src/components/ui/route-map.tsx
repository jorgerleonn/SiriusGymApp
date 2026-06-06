"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>';

interface RouteMapProps {
  route: [number, number][];
}

function FitBounds({ route }: { route: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (route.length < 2) return;
    let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
    for (const [lat, lng] of route) {
      if (lat < minLat) minLat = lat;
      if (lng < minLng) minLng = lng;
      if (lat > maxLat) maxLat = lat;
      if (lng > maxLng) maxLng = lng;
    }
    map.fitBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng],
      ],
      { padding: [24, 24] }
    );
  }, [map, route]);

  return null;
}

export function RouteMap({ route }: RouteMapProps) {
  if (route.length < 2) {
    return (
      <div className="bg-surface-card border border-hairline p-lg">
        <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-sm">RECORRIDO</h3>
        <p className="text-caption text-muted/50 tracking-[1px]">SIN DATOS GPS</p>
      </div>
    );
  }

  // Fix para route_data que aún tenga coordenadas en semicírculos
  // (bug de doble conversión en parser antiguo)
  const coords: [number, number][] =
    Math.abs(route[0][0]) < 1
      ? route.map(([lat, lng]) => [lat * (0x80000000 / 180), lng * (0x80000000 / 180)]) as [number, number][]
      : route;

  const start = coords[0];
  const end = coords[coords.length - 1];

  return (
    <div className="bg-surface-card border border-hairline">
      <div className="p-lg pb-0">
        <h3 className="text-label-uppercase text-primary tracking-[1.5px]">RECORRIDO</h3>
      </div>
      <div className="px-lg pb-lg pt-md">
        <MapContainer
          center={start}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-[320px] rounded-none"
          attributionControl={false}
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTR} maxZoom={18} />

          {/* Glow layer */}
          <Polyline
            positions={coords}
            pathOptions={{
              color: "#27F5BE",
              weight: 8,
              opacity: 0.2,
              lineCap: "round",
              lineJoin: "round",
            }}
          />

          {/* Main line */}
          <Polyline
            positions={coords}
            pathOptions={{
              color: "#27F5BE",
              weight: 3,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />

          {/* Start marker - Orange */}
          <CircleMarker
            center={start}
            radius={6}
            pathOptions={{
              color: "#F57627",
              fillColor: "#F57627",
              fillOpacity: 1,
              weight: 2,
            }}
          />

          {/* End marker - Turquoise */}
          <CircleMarker
            center={end}
            radius={6}
            pathOptions={{
              color: "#27F5BE",
              fillColor: "#27F5BE",
              fillOpacity: 1,
              weight: 2,
            }}
          />

          <FitBounds route={coords} />
        </MapContainer>
      </div>
    </div>
  );
}
