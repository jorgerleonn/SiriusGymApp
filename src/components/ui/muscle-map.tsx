"use client";

import type { MuscleGroupData } from "@/lib/types";
import { cn } from "@/lib/utils";

const MUSCLE_COLORS: Record<string, string> = {
  PECTORAL: "from-m-blue-light/80 to-m-blue-light/40",
  ESPALDA: "from-m-blue-dark/80 to-m-blue-dark/40",
  CUÁDRICEPS: "from-m-red/80 to-m-red/40",
  ISQUIOTIBIALES: "from-m-red/60 to-m-red/30",
  GLÚTEOS: "from-m-red/80 to-m-red/40",
  HOMBROS: "from-m-blue-light/60 to-m-blue-light/30",
  BÍCEPS: "from-m-blue-dark/60 to-m-blue-dark/30",
  TRÍCEPS: "from-m-blue-dark/50 to-m-blue-dark/20",
  ABDOMEN: "from-primary/40 to-primary/10",
  GEMELOS: "from-m-red/50 to-m-red/20",
  TRAPECIO: "from-m-blue-light/70 to-m-blue-light/30",
  OTROS: "from-hairline to-hairline/50",
};

function getColor(name: string): string {
  const key = Object.keys(MUSCLE_COLORS).find(
    (k) => name.toUpperCase().includes(k) || k.includes(name.toUpperCase())
  );
  return MUSCLE_COLORS[key || "OTROS"];
}

interface MuscleMapProps {
  data: MuscleGroupData[];
}

export function MuscleMap({ data }: MuscleMapProps) {
  const maxVolume = Math.max(...data.map((d) => d.volume), 1);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted text-body-sm">
        SIN DATOS DE MÚSCULOS
      </div>
    );
  }

  return (
    <div className="space-y-xs">
      {data.slice(0, 8).map((item) => {
        const pct = (item.volume / maxVolume) * 100;
        return (
          <div key={item.name} className="space-y-xxs">
            <div className="flex justify-between items-center">
              <span className="text-caption text-muted tracking-[1px]">
                {item.name}
              </span>
              <span className="text-caption text-primary tracking-[1px]">
                {(item.volume / 1000).toFixed(1)}k kg
              </span>
            </div>
            <div className="h-1.5 bg-surface-elevated rounded-none overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-none bg-gradient-to-r transition-all duration-500",
                  getColor(item.name)
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
