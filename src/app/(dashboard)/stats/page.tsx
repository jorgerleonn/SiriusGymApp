"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Dumbbell, TrendingUp, BarChart3, Route } from "lucide-react";
import { MStripe } from "@/components/ui/m-stripe";
import { Combobox } from "@/components/ui/combobox";
import { AdvancedRunningStats } from "@/components/advanced-running-stats";
import { Gear } from "@/lib/types";
import dynamic from "next/dynamic";
import { getGearStats } from "@/lib/gear";

const RunningHeatmap = dynamic(
  () => import("@/components/fueling/RunningHeatmap").then((mod) => mod.RunningHeatmap),
  { ssr: false }
);

interface CardioSession {
  date: string;
  distance_km: number;
  duration_minutes: number;
  avg_pace_seconds_per_km: number | null;
  avg_heart_rate: number | null;
  total_calories: number | null;
  hr_zone_seconds: Record<string, number> | null;
}

interface StrengthStats {
  type: "strength";
  pr: number;
  totalVolume: number;
  timesPerformed: number;
  volumeOverTime: { date: string; value: number }[];
  maxWeightOverTime: { date: string; value: number }[];
}

type Tab = "strength" | "cardio";
type DistanceFilter = "all" | "5k" | "10k" | "15k+";

const DISTANCE_FILTERS: { key: DistanceFilter; label: string }[] = [
  { key: "all", label: "TODAS" },
  { key: "5k", label: "5K" },
  { key: "10k", label: "10K" },
  { key: "15k+", label: "15K+" },
];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
};

const paceStr = (sec: number | null | undefined): string => {
  if (!sec) return "-";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const durationStr = (min: number): string => {
  if (min <= 0) return "-";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}H ${m}M`;
  return `${m}MIN`;
};

const zoneLabels = ["Z1 RECUP", "Z2 RESIST", "Z3 TEMPO", "Z4 UMBRAL", "Z5 MÁX"];
const zoneBgColors = [
  "bg-m-blue-dark",
  "bg-m-blue-light",
  "bg-m-blue-light/80",
  "bg-m-red",
  "bg-m-red/80",
];
const zoneDescriptions = ["< 60%", "60-70%", "70-80%", "80-90%", "> 90%"];

function ChartTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-hairline p-md">
      <p className="text-caption text-muted mb-xxs tracking-[1px]">{label}</p>
      <p className="text-label-uppercase text-primary">
        {payload[0].value?.toLocaleString()} {suffix}
      </p>
    </div>
  );
}

export default function StatsPage() {
  const { user, isLoaded } = useUser();

  // Shared
  const [activeTab, setActiveTab] = useState<Tab>("strength");
  const [exercises, setExercises] = useState<string[]>([]);
  const [totalVolumeBySession, setTotalVolumeBySession] = useState<
    { date: string; value: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [gear, setGear] = useState<Gear[]>([]);
  const [advancedData, setAdvancedData] = useState({
    drift: [] as { date: string; value: number }[],
    ef: [] as { date: string; value: number }[],
    cadence: [] as { date: string; value: number }[],
  });

  // Strength
  const [selectedExercise, setSelectedExercise] = useState("");
  const [strengthStats, setStrengthStats] = useState<StrengthStats | null>(null);

  // Cardio
  const [cardioSessions, setCardioSessions] = useState<CardioSession[]>([]);
  const [cardioTracks, setCardioTracks] = useState<[number, number, number][][][]>([]);
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("all");
  const [cardioLoaded, setCardioLoaded] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState<"distance" | "pace">("distance");

  // ── Effects ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.exercises) setExercises(data.exercises as string[]);
        if (data.totalVolumeBySession)
          setTotalVolumeBySession(data.totalVolumeBySession as { date: string; value: number }[]);
      });

    getGearStats().then(setGear);
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/stats?exercise=CARRERA")
      .then((res) => res.json())
      .then((data) => {
        const stats = data.stats as {
          sessions?: CardioSession[];
          tracks?: [number, number, number][][];
        } | null;
        if (data.statsType === "running" && stats?.sessions) {
          setCardioSessions(stats.sessions);
          if (stats.tracks) setCardioTracks(stats.tracks);
          
          // Calculate historical trends for advanced stats
          const sessions = stats.sessions;
          const drift = sessions
            .filter((s) => s.cardiac_drift !== null)
            .map((s) => ({ date: s.date, value: s.cardiac_drift }));
          const ef = sessions
            .filter((s) => s.efficiency_factor !== null)
            .map((s) => ({ date: s.date, value: s.efficiency_factor }));
          const cadence = sessions
            .filter((s) => s.avg_cadence !== null)
            .map((s) => ({ date: s.date, value: s.avg_cadence }));
            
          setAdvancedData({ drift, ef, cadence });
        }
        setCardioLoaded(true);
      })
      .catch(() => setCardioLoaded(true));
  }, [isLoaded, user]);

  useEffect(() => {
    if (!selectedExercise || !user) return;
    const controller = new AbortController();
    
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stats?exercise=${encodeURIComponent(selectedExercise)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.statsType === "strength") {
          setStrengthStats((data.stats ?? null) as StrengthStats | null);
        } else {
          setStrengthStats(null);
        }
      } catch {
        // Ignore abort errors
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    return () => controller.abort();
  }, [selectedExercise, user]);

  // ── Derived Cardio Data ─────────────────────────────────────

  const filteredSessions = useMemo(() => {
    return cardioSessions.filter((s) => {
      switch (distanceFilter) {
        case "5k":
          return s.distance_km >= 3 && s.distance_km < 8;
        case "10k":
          return s.distance_km >= 8 && s.distance_km < 14;
        case "15k+":
          return s.distance_km >= 14;
        default:
          return true;
      }
    });
  }, [cardioSessions, distanceFilter]);

  const cardioData = useMemo(() => {
    const sorted = [...filteredSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const totalDistance = sorted.reduce((s, session) => s + session.distance_km, 0);
    const totalMinutes = sorted.reduce((s, session) => s + session.duration_minutes, 0);
    const totalSessions = sorted.length;

    let paceSum = 0;
    let paceCount = 0;
    const aggregatedZones: Record<string, number> = {};
    const distanceOverTime: { date: string; value: number }[] = [];
    const paceOverTime: { date: string; value: number }[] = [];

    for (const session of sorted) {
      distanceOverTime.push({ date: session.date, value: session.distance_km });

      if (session.avg_pace_seconds_per_km) {
        paceSum += session.avg_pace_seconds_per_km;
        paceCount++;
        paceOverTime.push({ date: session.date, value: session.avg_pace_seconds_per_km });
      }

      if (session.hr_zone_seconds) {
        for (const [key, sec] of Object.entries(session.hr_zone_seconds)) {
          aggregatedZones[key] = (aggregatedZones[key] ?? 0) + sec;
        }
      }
    }

    return {
      totalDistance,
      totalMinutes,
      totalSessions,
      avgPaceSecondsPerKm: paceCount > 0 ? Math.round(paceSum / paceCount) : null,
      distanceOverTime,
      paceOverTime,
      hrZoneSeconds: Object.keys(aggregatedZones).length > 0 ? aggregatedZones : null,
    };
  }, [filteredSessions]);

  // ── Render Helpers ──────────────────────────────────────────

  const renderHrZonePanel = () => {
    if (!cardioData.hrZoneSeconds) return null;
    const zoneArray = [
      cardioData.hrZoneSeconds.zone1 ?? 0,
      cardioData.hrZoneSeconds.zone2 ?? 0,
      cardioData.hrZoneSeconds.zone3 ?? 0,
      cardioData.hrZoneSeconds.zone4 ?? 0,
      cardioData.hrZoneSeconds.zone5 ?? 0,
    ];
    const totalZoneSeconds = zoneArray.reduce((a, b) => a + b, 0);
    if (totalZoneSeconds <= 0) return null;

    return (
      <div className="bg-surface-card p-lg">
        <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md flex items-center gap-md">
          <span className="w-2 h-2 bg-m-red" />
          DISTRIBUCIÓN DE FC
        </h3>
        <div className="space-y-sm">
          {zoneArray.map((seconds, i) => {
            const pct = (seconds / totalZoneSeconds) * 100;
            const minutes = Math.round(seconds / 60);
            return (
              <div
                key={i}
                className="grid grid-cols-[80px_1fr_48px_36px] gap-sm items-center"
              >
                <span className="text-caption text-muted tracking-[1px] text-left flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 shrink-0 ${zoneBgColors[i]}`} />
                  {zoneLabels[i]}
                </span>
                <div className="h-3 bg-canvas relative">
                  <div
                    className={`h-full ${zoneBgColors[i]} transition-all duration-500`}
                    style={{ width: `${Math.max(pct, 0.5)}%` }}
                  />
                </div>
                <span className="text-caption text-primary text-right tabular-nums">
                  {minutes}M
                </span>
                <span className="text-caption text-muted text-right tabular-nums">
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-5 gap-xs mt-md pt-md border-t border-hairline">
          {zoneDescriptions.map((desc, i) => (
            <span
              key={i}
              className="text-caption text-muted/50 text-center text-[10px] tracking-[0.5px]"
            >
              {desc}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const strengthExercises = useMemo(() => {
    const s = new Map<string, string>();
    for (const e of exercises) {
      if (e === "CARRERA") continue;
      const key = e.toUpperCase();
      if (!s.has(key)) s.set(key, e);
    }
    return [...s.values()].sort();
  }, [exercises]);

  // ── Main Render ─────────────────────────────────────────────

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-caption text-muted tracking-[1px]">CARGANDO...</div>
      </div>
    );
  }

  return (
    <div>
      <MStripe className="mb-lg" />
      <h1 className="text-display-md font-display text-primary tracking-[0] mb-xl">
        ESTADÍSTICAS
      </h1>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="flex gap-px bg-hairline mb-xl">
        {(["strength", "cardio"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 p-md text-label-uppercase tracking-[1.5px] transition-colors rounded-none ${
              activeTab === tab
                ? "bg-surface-card text-primary border-b-2 border-primary"
                : "bg-canvas text-muted hover:text-primary hover:bg-surface-soft"
            }`}
          >
            <span className="flex items-center justify-center gap-sm">
              {tab === "strength" ? (
                <Dumbbell className="w-4 h-4" />
              ) : (
                <Route className="w-4 h-4" />
              )}
              {tab === "strength" ? "FUERZA" : "CARDIO / RUNNING"}
            </span>
          </button>
        ))}
      </div>

      {/* ── STRENGTH VIEW ────────────────────────────────── */}
      {activeTab === "strength" && (
        <div>
          <div className="mb-xl">
            <label className="block text-caption text-muted mb-xs tracking-[1px]">
              SELECCIONA UN EJERCICIO
            </label>
            <Combobox
              value={selectedExercise}
              onChange={setSelectedExercise}
              items={strengthExercises}
              placeholder="SELECCIONA UN EJERCICIO"
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-xxl">
              <div className="text-caption text-muted tracking-[1px]">CARGANDO...</div>
            </div>
          )}

          {!loading && selectedExercise && strengthStats && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-hairline mb-xl">
                <div className="bg-surface-card p-lg">
                  <p className="text-caption text-muted mb-xs tracking-[1px]">RÉCORD PERSONAL</p>
                  <p className="text-display-sm font-display text-primary">{strengthStats.pr} kg</p>
                </div>
                <div className="bg-surface-card p-lg">
                  <p className="text-caption text-muted mb-xs tracking-[1px]">VOLUMEN TOTAL</p>
                  <p className="text-display-sm font-display text-primary">
                    {strengthStats.totalVolume.toLocaleString()} kg
                  </p>
                </div>
                <div className="bg-surface-card p-lg">
                  <p className="text-caption text-muted mb-xs tracking-[1px]">VECES REALIZADO</p>
                  <p className="text-display-sm font-display text-primary">
                    {strengthStats.timesPerformed}
                  </p>
                </div>
              </div>

              <div className="space-y-xl">
                <div>
                  <h3 className="text-title-sm font-display text-primary tracking-[0] flex items-center gap-md mb-md">
                    <BarChart3 className="w-4 h-4 text-m-blue-light" />
                    VOLUMEN POR SESIÓN
                  </h3>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={strengthStats.volumeOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3c3c3c" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          stroke="#3c3c3c"
                          fontSize={10}
                          tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
                        />
                        <YAxis
                          stroke="#3c3c3c"
                          fontSize={10}
                          tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
                          tickFormatter={(v) => `${v}`}
                          width={40}
                        />
                        <Tooltip content={<ChartTooltip suffix="kg" />} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#0066b1"
                          strokeWidth={2}
                          dot={{ fill: "#0066b1", strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, fill: "#0066b1" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-title-sm font-display text-primary tracking-[0] flex items-center gap-md mb-md">
                      <TrendingUp className="w-4 h-4 text-m-blue-dark" />
                      PESO MÁXIMO POR SESIÓN
                  </h3>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={strengthStats.maxWeightOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3c3c3c" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          stroke="#3c3c3c"
                          fontSize={10}
                          tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
                        />
                        <YAxis
                          stroke="#3c3c3c"
                          fontSize={10}
                          tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
                          tickFormatter={(v) => `${v}`}
                          width={40}
                        />
                        <Tooltip content={<ChartTooltip suffix="kg" />} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#0066b1"
                          strokeWidth={2}
                          dot={{ fill: "#0066b1", strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, fill: "#0066b1" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {!loading && selectedExercise && !strengthStats && (
            <div className="text-center py-xxl border border-hairline">
              <Dumbbell className="w-8 h-8 text-muted mx-auto mb-md" />
              <p className="text-body-md text-muted">NO HAY DATOS PARA ESTE EJERCICIO</p>
            </div>
          )}

          {!selectedExercise && (
            <>
              {totalVolumeBySession.length > 0 && (
                <div className="mb-xl">
                  <h3 className="text-title-sm font-display text-primary tracking-[0] flex items-center gap-md mb-md">
                    <BarChart3 className="w-4 h-4 text-m-blue-light" />
                    VOLUMEN TOTAL POR SESIÓN
                  </h3>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={totalVolumeBySession}>
                        <defs>
                          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0066b1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0066b1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#3c3c3c"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          stroke="#3c3c3c"
                          fontSize={10}
                          tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#3c3c3c"
                          fontSize={10}
                          tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
                          tickFormatter={(v) => `${v}`}
                          width={40}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<ChartTooltip suffix="kg" />} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#0066b1"
                          strokeWidth={2}
                          fill="url(#volumeGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              <div className="text-center py-xxl border border-hairline">
                <BarChart3 className="w-8 h-8 text-muted mx-auto mb-md" />
                <p className="text-body-md text-muted">
                  SELECCIONA UN EJERCICIO PARA VER ESTADÍSTICAS
                </p>
              </div>
            </>
          )}
        </div>
      )}

  {/* ── CARDIO VIEW ──────────────────────────────────── */}
  {activeTab === "cardio" && (
    <div className="space-y-lg">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="lg:col-span-2 space-y-lg">
          {/* Distance Filter */}
          <div className="flex items-center gap-md mb-lg">
            <span className="text-caption text-muted tracking-[1px]">DISTANCIA:</span>
            <div className="flex gap-xs">
              {DISTANCE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setDistanceFilter(f.key)}
                  className={`px-md py-xs text-caption tracking-[1px] border transition-colors ${
                    distanceFilter === f.key
                      ? "border-primary text-primary bg-surface-elevated"
                      : "border-hairline text-muted hover:text-primary hover:border-primary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
  
          {cardioData.totalSessions > 0 ? (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline mb-xl">
                <div className="bg-surface-card p-lg">
                  <p className="text-caption text-muted mb-xxs tracking-[1.5px]">
                    DISTANCIA TOTAL
                  </p>
                  <p className="text-display-sm font-display text-primary tracking-[0]">
                    {cardioData.totalDistance.toFixed(1)}{" "}
                    <span className="text-body-sm text-muted">km</span>
                  </p>
                </div>
                <div className="bg-surface-card p-lg">
                  <p className="text-caption text-muted mb-xxs tracking-[1.5px]">
                    TIEMPO TOTAL
                  </p>
                  <p className="text-display-sm font-display text-primary tracking-[0]">
                    {durationStr(cardioData.totalMinutes)}
                  </p>
                </div>
                <div className="bg-surface-card p-lg">
                  <p className="text-caption text-muted mb-xxs tracking-[1.5px]">
                    RITMO MEDIO
                  </p>
                  <p className="text-display-sm font-display text-primary tracking-[0]">
                    {paceStr(cardioData.avgPaceSecondsPerKm)}{" "}
                    <span className="text-body-sm text-muted">/km</span>
                  </p>
                </div>
                <div className="bg-surface-card p-lg">
                  <p className="text-caption text-muted mb-xxs tracking-[1.5px]">SESIONES</p>
                  <p className="text-display-sm font-display text-primary tracking-[0]">
                    {cardioData.totalSessions}
                  </p>
                </div>
              </div>
  
              {/* Distance Per Session */}
              <div className="bg-surface-card border border-hairline p-lg mb-lg">
                <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md flex items-center gap-md">
                  <span className="w-2 h-2 bg-m-red" />
                  DISTANCIA POR SESIÓN
                </h3>
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cardioData.distanceOverTime} barCategoryGap={4}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#3c3c3c"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        stroke="#3c3c3c"
                        fontSize={10}
                        tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#3c3c3c"
                        fontSize={10}
                        tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
                        tickFormatter={(v) => `${v}`}
                        width={40}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip suffix="km" />} />
                      <Bar dataKey="value" fill="#e22718" radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
  
              {/* Pace + HR Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-hairline mb-lg">
                {cardioData.paceOverTime.length > 0 && (
                  <div className="bg-surface-card p-lg">
                    <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md flex items-center gap-md">
                      <span className="w-2 h-2 bg-m-blue-light" />
                      EVOLUCIÓN DEL RITMO
                    </h3>
                      <div className="h-48 sm:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={cardioData.paceOverTime}>
                            <defs>
                              <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1c69d4" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#1c69d4" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#3c3c3c"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="date"
                              tickFormatter={formatDate}
                              stroke="#3c3c3c"
                              fontSize={10}
                              tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="#3c3c3c"
                              fontSize={10}
                              tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
                              tickFormatter={(v) => paceStr(v)}
                              width={45}
                              domain={["dataMin - 30", "dataMax + 30"]}
                              axisLine={false}
                              tickLine={false}
                              reversed
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                  <div className="bg-surface-card border border-hairline p-md">
                                    <p className="text-caption text-muted mb-xxs tracking-[1px]">
                                      {label}
                                    </p>
                                    <p className="text-label-uppercase text-primary">
                                      {paceStr(payload[0].value as number)} /km
                                    </p>
                                  </div>
                                );
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#1c69d4"
                              strokeWidth={2}
                              fill="url(#paceGradient)"
                              dot={{ fill: "#1c69d4", strokeWidth: 0, r: 3 }}
                              activeDot={{ r: 5, fill: "#1c69d4" }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
  
                    </div>
                  )}
  
                  {renderHrZonePanel()}
                </div>
            </>
          ) : (
            <div className="text-center py-xxl border border-hairline">
              <Route className="w-8 h-8 text-muted mx-auto mb-md" />
              <p className="text-body-md text-muted">
                {!cardioLoaded
                  ? "CARGANDO..."
                  : cardioSessions.length === 0
                    ? "NO HAY DATOS DE CARDIO"
                    : "NO HAY SESIONES EN ESTE RANGO"}
              </p>
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <AdvancedRunningStats 
            gear={gear} 
            driftHistory={advancedData.drift} 
            efHistory={advancedData.ef} 
            cadenceHistory={advancedData.cadence} 
          />
        </div>
      </div>
        <div className="space-y-md">
          <div className="flex items-center justify-between">
            <h3 className="text-label-uppercase text-primary tracking-[1.5px] flex items-center gap-md">
              <Route className="w-4 h-4" />
              MAPA DE CALOR DE CARRERAS
            </h3>
          </div>
          <RunningHeatmap 
            tracks={cardioTracks} 
            mode={heatmapMode} 
            onModeChange={setHeatmapMode} 
          />
        </div>

    </div>
  )}
    </div>
  );
}
