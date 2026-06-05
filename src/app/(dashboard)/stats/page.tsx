"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
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
import { RunningStatsView } from "@/components/running-stats-view";

interface ChartDataPoint {
  date: string;
  value: number;
}

interface StrengthStats {
  type: "strength";
  pr: number;
  totalVolume: number;
  timesPerformed: number;
  volumeOverTime: ChartDataPoint[];
  maxWeightOverTime: ChartDataPoint[];
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
};

function ChartTooltip({ active, payload, label, suffix = "" }: {
  active?: boolean; payload?: { value: number }[]; label?: string; suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-hairline p-md">
      <p className="text-caption text-muted mb-xxs tracking-[1px]">{label}</p>
      <p className="text-label-uppercase text-primary">{payload[0].value?.toLocaleString()} {suffix}</p>
    </div>
  );
}

type StatsData = StrengthStats | null;

export default function StatsPage() {
  const { user, isLoaded } = useUser();
  const [exercises, setExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [statsType, setStatsType] = useState<"strength" | "running" | null>(null);
  const [stats, setStats] = useState<StatsData>(null);
  const [runningStats, setRunningStats] = useState<Record<string, unknown> | null>(null);
  const [totalVolumeBySession, setTotalVolumeBySession] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data) => {
          if (data.exercises) setExercises(data.exercises);
          if (data.totalVolumeBySession) setTotalVolumeBySession(data.totalVolumeBySession);
        });
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (!selectedExercise || !user) return;

    const controller = new AbortController();
    const idle = setTimeout(() => setLoading(true), 0);
    fetch(`/api/stats?exercise=${encodeURIComponent(selectedExercise)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(idle);
        setStatsType(data.statsType ?? null);

        if (data.statsType === "running") {
          setRunningStats(data.stats ?? null);
          setStats(null);
        } else {
          setStats(data.stats || null);
          setRunningStats(null);
        }

        setLoading(false);
      })
      .catch(() => clearTimeout(idle));
    return () => { controller.abort(); clearTimeout(idle); };
  }, [selectedExercise, user]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-caption text-muted tracking-[1px]">CARGANDO...</div>
      </div>
    );
  }

  const isRunning = statsType === "running" && runningStats;

  return (
    <div>
      <MStripe className="mb-lg" />
      <h1 className="text-display-md font-display text-primary tracking-[0] mb-xl">
        ESTADÍSTICAS
      </h1>

      {/* Exercise Selector */}
      <div className="mb-xl">
        <label className="block text-caption text-muted mb-xs tracking-[1px]">
          SELECCIONA UN EJERCICIO
        </label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full bg-surface-card border border-hairline rounded-none px-md py-sm text-primary focus:border-primary outline-none text-body-md tracking-[0]"
        >
          <option value="" className="text-muted">SELECCIONA UN EJERCICIO</option>
          {exercises.map((ex) => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      </div>

      {/* Running Stats View */}
      {selectedExercise && !loading && isRunning && runningStats && (
        <RunningStatsView stats={runningStats as {
          totalDistance: number;
          totalMinutes: number;
          totalSessions: number;
          avgPaceSecondsPerKm: number | null;
          avgHeartRate: number | null;
          totalCalories: number;
          distanceOverTime: ChartDataPoint[];
          paceOverTime: ChartDataPoint[];
          hrOverTime: ChartDataPoint[];
          hrZoneSeconds: Record<string, number> | null;
        }} />
      )}

      {/* Strength Stats */}
      {selectedExercise && !loading && !isRunning && stats && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-hairline mb-xl">
            <div className="bg-surface-card p-lg">
              <p className="text-caption text-muted mb-xs tracking-[1px]">RÉCORD PERSONAL</p>
              <p className="text-display-sm font-display text-primary">{stats.pr} kg</p>
            </div>
            <div className="bg-surface-card p-lg">
              <p className="text-caption text-muted mb-xs tracking-[1px]">VOLUMEN TOTAL</p>
              <p className="text-display-sm font-display text-primary">
                {stats.totalVolume.toLocaleString()} kg
              </p>
            </div>
            <div className="bg-surface-card p-lg">
              <p className="text-caption text-muted mb-xs tracking-[1px]">VECES REALIZADO</p>
              <p className="text-display-sm font-display text-primary">{stats.timesPerformed}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-xl">
            <div>
              <h3 className="text-title-sm font-display text-primary tracking-[0] flex items-center gap-md mb-md">
                <BarChart3 className="w-4 h-4 text-m-blue-light" />
                VOLUMEN POR SESIÓN
              </h3>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.volumeOverTime}>
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
                  <LineChart data={stats.maxWeightOverTime}>
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
                      stroke="#1c69d4"
                      strokeWidth={2}
                      dot={{ fill: "#1c69d4", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: "#1c69d4" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No data state */}
      {selectedExercise && !loading && !stats && !isRunning && (
        <div className="text-center py-xxl border border-hairline">
          {selectedExercise === "CARRERA" ? (
            <>
              <Route className="w-8 h-8 text-muted mx-auto mb-md" />
              <p className="text-body-md text-muted">NO HAY DATOS DE CARDIO</p>
            </>
          ) : (
            <>
              <Dumbbell className="w-8 h-8 text-muted mx-auto mb-md" />
              <p className="text-body-md text-muted">NO HAY DATOS PARA ESTE EJERCICIO</p>
            </>
          )}
        </div>
      )}

      {/* Default empty state */}
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#3c3c3c" vertical={false} />
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
            <p className="text-body-md text-muted">SELECCIONA UN EJERCICIO PARA VER ESTADÍSTICAS</p>
          </div>
        </>
      )}
    </div>
  );
}
