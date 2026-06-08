"use client";

import dynamic from "next/dynamic";
import { calculateCalories, type UserProfile } from "@/lib/calories";
import { calculateAerobicAnalysis, type AerobicAnalysis } from "@/lib/aerobic-metrics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const RouteMap = dynamic(() => import("@/components/ui/route-map").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-card border border-hairline p-lg">
      <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-sm">RECORRIDO</h3>
      <p className="text-caption text-muted/50 tracking-[1px]">CARGANDO MAPA...</p>
    </div>
  ),
});

interface CardioData {
  total_cardio_distance: number | null;
  duration_minutes: number | null;
  avg_pace_seconds_per_km: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  total_calories: number | null;
  hr_zone_seconds: Record<string, number> | null;
  heart_rate_data: { t: number; v: number }[] | null;
  route_data: [number, number][] | null;
  notes: string | null;
  cardiac_drift: number | null;
  efficiency_factor: number | null;
}

function fmt(val: number | null | undefined, fallback = "-"): string {
  return val != null ? String(val) : fallback;
}

function paceStr(sec: number | null | undefined): string {
  if (!sec) return "-";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function durationStr(min: number | null | undefined): string {
  if (!min) return "-";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

const zoneColors = [
  "bg-m-blue-dark",
  "bg-m-blue-light",
  "bg-m-blue-light/80",
  "bg-m-red",
  "bg-m-red/80",
];

const zoneLabels = ["Z1 RECUPERACIÓN", "Z2 RESISTENCIA", "Z3 TEMPO", "Z4 UMBRAL", "Z5 MÁXIMO"];

const zoneDescriptions = [
  "< 60% FCmáx",
  "60-70% FCmáx",
  "70-80% FCmáx",
  "80-90% FCmáx",
  "> 90% FCmáx",
];

export function CardioDetailView({ workout, profile }: { workout: CardioData; profile: UserProfile | null }) {
  const zones = workout.hr_zone_seconds ?? null;

  const zoneArray = zones
    ? [zones.zone1 ?? 0, zones.zone2 ?? 0, zones.zone3 ?? 0, zones.zone4 ?? 0, zones.zone5 ?? 0]
    : null;

  const totalZoneSeconds = zoneArray ? zoneArray.reduce((a, b) => a + b, 0) : 0;

  const estimatedCalories = calculateCalories(
    workout.avg_heart_rate,
    workout.duration_minutes,
    workout.total_cardio_distance,
    profile
  );

  return (
    <div className="space-y-lg">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline">
        <KpiCard label="DISTANCIA" value={`${fmt(workout.total_cardio_distance, "0")} km`} sub={null} />
        <KpiCard label="DURACIÓN" value={durationStr(workout.duration_minutes)} sub={null} />
        <KpiCard
          label="RITMO MEDIO"
          value={`${paceStr(workout.avg_pace_seconds_per_km)} /km`}
          sub={null}
        />
        <KpiCard
          label="FC MEDIA"
          value={fmt(workout.avg_heart_rate)}
          sub={workout.max_heart_rate ? `MÁX ${workout.max_heart_rate} lpm` : null}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline">
        <KpiCard
          label="FC MÁXIMA"
          value={`${fmt(workout.max_heart_rate)} lpm`}
          sub={workout.avg_heart_rate
            ? `${Math.round(((workout.max_heart_rate ?? 0) / (workout.avg_heart_rate ?? 1)) * 100)}%`
            : null}
        />
        <KpiCard
          label="CALORÍAS"
          value={String(estimatedCalories)}
          sub="KCAL EST."
        />
        <KpiCard
          label="PACE"
          value={`${paceStr(workout.avg_pace_seconds_per_km)} /km`}
          sub={workout.duration_minutes && workout.total_cardio_distance
            ? `${(workout.total_cardio_distance / (workout.duration_minutes / 60)).toFixed(1)} km/h`
            : null}
        />
        <KpiCard
          label="ZONA DOMINANTE"
          value={(() => {
            if (!zoneArray) return "-";
            const idx = zoneArray.indexOf(Math.max(...zoneArray));
            return `Z${idx + 1}`;
          })()}
          sub="POR TIEMPO"
        />
      </div>

      {/* Route Map */}
      {workout.route_data && workout.route_data.length > 1 && (
        <RouteMap route={workout.route_data} />
      )}

      {/* HR Zone Breakdown */}
      {zoneArray && totalZoneSeconds > 0 && (
        <div className="bg-surface-card border border-hairline p-lg">
          <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md">
            DISTRIBUCIÓN DE FRECUENCIA CARDÍACA
          </h3>
          <div className="space-y-sm">
            {zoneArray.map((seconds, i) => {
              const pct = totalZoneSeconds > 0 ? (seconds / totalZoneSeconds) * 100 : 0;
              const minutes = Math.round(seconds / 60);
              return (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[100px_1fr_60px_60px] gap-xs sm:gap-sm items-center mb-xs sm:mb-0">
                  <span className="text-caption text-muted tracking-[1px] flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 shrink-0 ${zoneColors[i]}`} />
                    {zoneLabels[i]}
                  </span>
                  <div className="h-4 bg-canvas relative w-full">
                    <div
                      className={`h-full ${zoneColors[i]} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 0.5)}%` }}
                    />
                  </div>
                  <span className="text-caption text-primary text-right tabular-nums sm:text-right">
                    {minutes}m
                  </span>
                  <span className="text-caption text-muted text-right tabular-nums sm:text-right">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-5 gap-xs mt-md pt-md border-t border-hairline">
            {zoneDescriptions.map((desc, i) => (
              <span key={i} className="text-caption text-muted/50 text-center text-[10px] tracking-[0.5px]">
                {desc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Aerobic Analysis */}
      <div className="bg-surface-card border border-hairline p-lg">
        <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md">
          ANÁLISIS AERÓBICO AVANZADO
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
          <div className="flex flex-col">
            <span className="text-caption text-muted tracking-[1px] mb-xs">DESACOPLE AERÓBICO</span>
            <span className={`text-display-sm font-display ${workout.cardiac_drift !== null && workout.cardiac_drift < 5 ? "text-[#27F5BE]" : "text-[#F57627]"}`}>
              {workout.cardiac_drift !== null ? `${workout.cardiac_drift}%` : "-"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-caption text-muted tracking-[1px] mb-xs">RATIO EF</span>
            <span className="text-display-sm font-display text-primary">
              {workout.efficiency_factor !== null ? workout.efficiency_factor.toFixed(3) : "-"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-caption text-muted tracking-[1px] mb-xs">SISTEMA</span>
            <span className="text-display-sm font-display text-muted">
              {workout.cardiac_drift !== null && workout.cardiac_drift < 5 ? "ESTABLE" : "FATIGA"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-md mt-lg pt-lg border-t border-hairline">
          <div className="flex flex-col items-center">
            <span className="text-caption text-muted tracking-[1px] mb-xs">CADENCIA</span>
            <span className="text-display-sm font-display text-primary">
              {workout.heart_rate_data ? calculateAerobicAnalysis(workout.heart_rate_data as any).avgCadence ?? "-" : "-"} 
              <span className="text-caption text-muted"> spm</span>
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-caption text-muted tracking-[1px] mb-xs">ZANCADA</span>
            <span className="text-display-sm font-display text-primary">
              {workout.heart_rate_data ? calculateAerobicAnalysis(workout.heart_rate_data as any).avgStrideLength ?? "-" : "-"} 
              <span className="text-caption text-muted"> m</span>
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-caption text-muted tracking-[1px] mb-xs">CONTACTO</span>
            <span className="text-display-sm font-display text-primary">
              {workout.heart_rate_data ? calculateAerobicAnalysis(workout.heart_rate_data as any).avgGroundContact ?? "-" : "-"} 
              <span className="text-caption text-muted"> ms</span>
            </span>
          </div>
        </div>
      </div>

      {/* Heart Rate Chart */}

      {workout.heart_rate_data && workout.heart_rate_data.length > 0 && (
        <div className="bg-surface-card border border-hairline p-lg">
          <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md">
            FRECUENCIA CARDÍACA POR TIEMPO
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={workout.heart_rate_data}>
                <defs>
                  <linearGradient id="hrGradient" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="60%" stopColor="#1e3a8a" />
                    <stop offset="60%" stopColor="#3b82f6" />
                    <stop offset="70%" stopColor="#3b82f6" />
                    <stop offset="70%" stopColor="#60a5fa" />
                    <stop offset="80%" stopColor="#60a5fa" />
                    <stop offset="80%" stopColor="#ef4444" />
                    <stop offset="90%" stopColor="#ef4444" />
                    <stop offset="90%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#f87171" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={["auto", "auto"]}
                  tickFormatter={(t) => {
                    const min = Math.floor(t / 60);
                    const sec = t % 60;
                    return min > 0 ? `${min}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
                  }}
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[50, 190]}
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "0" }}
                  itemStyle={{ color: "#ffffff" }}
                  labelFormatter={(t) => {
                    const min = Math.floor(t / 60);
                    const sec = t % 60;
                    return `Tiempo: ${min > 0 ? `${min}:${sec.toString().padStart(2, "0")}` : `${sec}s`}`;
                  }}
                   formatter={(value: any) => [`${value ?? 0} lpm`, "FC"]}

                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="url(#hrGradient)"
                  strokeWidth={1.5}
                  dot={false}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Notes */}
      {workout.notes && (
        <div className="bg-surface-card border border-hairline p-lg">
          <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-sm">NOTAS</h3>
          <p className="text-body-sm text-muted whitespace-pre-wrap">{workout.notes}</p>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string | null;
}) {
  return (
    <div className="bg-surface-card p-lg flex flex-col justify-center">
      <span className="text-caption text-muted tracking-[1.5px] mb-xxs">{label}</span>
      <span className="text-display-sm font-display text-primary tracking-[0]">{value}</span>
      {sub && <span className="text-caption text-muted/60 tracking-[1px] mt-xxs">{sub}</span>}
    </div>
  );
}
