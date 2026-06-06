"use client";

import { useMemo } from "react";
import Body, { type ExtendedBodyPart } from "react-muscle-highlighter";
import type { MuscleGroupData } from "@/lib/types";

const FATIGUE_COLOR = "#F57627";
const RECOVERY_COLOR = "#27F5BE";
const DEFAULT_FILL = "#111111";
const DEFAULT_STROKE = "#3A3A3A";

const RECOVERY_DAYS: Record<string, number> = {
  CUÁDRICEPS: 3,
  ISQUIOTIBIALES: 3,
  GLÚTEOS: 3,
  "ESPALDA SUPERIOR": 3,
  "ESPALDA INFERIOR": 3,
  PECTORAL: 3,
  HOMBROS: 2,
  TRÍCEPS: 2,
  BÍCEPS: 2,
  GEMELOS: 2,
  "TIBIAL ANTERIOR": 2,
  ABDOMEN: 1,
};

const SLUG_MAP: Record<string, string> = {
  CUÁDRICEPS: "quadriceps",
  ISQUIOTIBIALES: "hamstring",
  GLÚTEOS: "gluteal",
  "ESPALDA SUPERIOR": "upper-back",
  "ESPALDA INFERIOR": "lower-back",
  PECTORAL: "chest",
  HOMBROS: "deltoids",
  TRÍCEPS: "triceps",
  BÍCEPS: "biceps",
  GEMELOS: "calves",
  "TIBIAL ANTERIOR": "tibialis",
  ABDOMEN: "abs",
};

const FRONT_SLUGS = new Set([
  "quadriceps", "chest", "deltoids", "biceps", "abs",
  "tibialis", "triceps", "calves",
]);

const BACK_SLUGS = new Set([
  "upper-back", "lower-back", "triceps", "gluteal",
  "hamstring", "calves", "deltoids",
]);

function FatigueLegend() {
  return (
    <div className="flex items-center gap-sm mt-md pt-md border-t border-hairline">
      <div className="flex items-center gap-1">
        <div className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: FATIGUE_COLOR, opacity: 1 }} />
        <span className="text-caption text-muted/60 text-[10px] tracking-[0.5px]">HOY</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: FATIGUE_COLOR, opacity: 0.8 }} />
        <span className="text-caption text-muted/60 text-[10px] tracking-[0.5px]">1D</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: FATIGUE_COLOR, opacity: 0.6 }} />
        <span className="text-caption text-muted/60 text-[10px] tracking-[0.5px]">2D</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: FATIGUE_COLOR, opacity: 0.4 }} />
        <span className="text-caption text-muted/60 text-[10px] tracking-[0.5px]">3D</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: FATIGUE_COLOR, opacity: 0 }} />
        <span className="text-caption text-muted/60 text-[10px] tracking-[0.5px]">5D+</span>
      </div>
      <span className="text-caption text-muted/30 text-[10px] tracking-[0.5px] ml-auto">FATIGA</span>
    </div>
  );
}

interface MuscleMapProps {
  data: MuscleGroupData[];
}

export function MuscleMap({ data }: MuscleMapProps) {
  const trackedIds = useMemo(() => new Set(Object.keys(SLUG_MAP)), []);

  const frontData: ExtendedBodyPart[] = useMemo(() => {
    return data
      .filter((d) => {
        const slug = SLUG_MAP[d.name];
        return slug && FRONT_SLUGS.has(slug) && d.effectiveOpacity > 0;
      })
      .map((d) => ({
        slug: SLUG_MAP[d.name] as ExtendedBodyPart["slug"],
        color: `rgba(245,118,39,${d.effectiveOpacity})`,
      }));
  }, [data]);

  const backData: ExtendedBodyPart[] = useMemo(() => {
    return data
      .filter((d) => {
        const slug = SLUG_MAP[d.name];
        return slug && BACK_SLUGS.has(slug) && d.effectiveOpacity > 0;
      })
      .map((d) => ({
        slug: SLUG_MAP[d.name] as ExtendedBodyPart["slug"],
        color: `rgba(245,118,39,${d.effectiveOpacity})`,
      }));
  }, [data]);

  const fatiguedMuscles = useMemo(() => {
    return data
      .filter((d) => trackedIds.has(d.name))
      .sort((a, b) => a.lastTrainedDays - b.lastTrainedDays)
      .map((d) => {
        const recoveryDays = RECOVERY_DAYS[d.name] ?? 3;
        const remainingDays = recoveryDays - d.lastTrainedDays;
        return { ...d, remainingDays };
      })
      .filter((d) => d.remainingDays > 0);
  }, [data, trackedIds]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted text-body-sm">
        SIN DATOS DE MÚSCULOS
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-center gap-4 md:gap-8">
        <div className="flex flex-col items-center">
          <Body
            data={frontData}
            side="front"
            gender="male"
            scale={0.75}
            defaultFill={DEFAULT_FILL}
            defaultStroke={DEFAULT_STROKE}
            defaultStrokeWidth={0.4}
            border={DEFAULT_STROKE}
            hiddenParts={["hair"]}
          />
          <span className="text-caption text-muted/40 text-[10px] tracking-[1px] mt-1">
            FRONTAL
          </span>
        </div>
        <div className="flex flex-col items-center">
          <Body
            data={backData}
            side="back"
            gender="male"
            scale={0.75}
            defaultFill={DEFAULT_FILL}
            defaultStroke={DEFAULT_STROKE}
            defaultStrokeWidth={0.4}
            border={DEFAULT_STROKE}
            hiddenParts={["hair"]}
          />
          <span className="text-caption text-muted/40 text-[10px] tracking-[1px] mt-1">
            POSTERIOR
          </span>
        </div>
      </div>

      <div className="mt-md space-y-1">
        {fatiguedMuscles.length === 0 ? (
          <div className="flex items-center justify-center py-md">
            <span
              className="text-caption text-center text-[10px] tracking-[1px]"
              style={{ color: RECOVERY_COLOR }}
            >
              100% RECUPERADO. LISTO PARA ENTRENAR.
            </span>
          </div>
        ) : (
          fatiguedMuscles.map((d) => {
            const label =
              d.remainingDays === 1 ? "MAÑANA" : `FALTAN ${d.remainingDays}D`;

            return (
              <div key={d.name} className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-none shrink-0"
                    style={{
                      backgroundColor: FATIGUE_COLOR,
                      opacity: d.effectiveOpacity || 0.05,
                    }}
                  />
                  <span className="text-caption text-muted tracking-[1px]">
                    {d.name}
                  </span>
                </div>
                <span
                  className="text-caption text-right tabular-nums"
                  style={{
                    color: d.lastTrainedDays <= 3 ? "#e6e6e6" : "#7e7e7e",
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })
        )}
      </div>

      <FatigueLegend />
    </div>
  );
}
