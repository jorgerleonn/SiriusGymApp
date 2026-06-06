"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
} from "recharts";

interface ChartDataPoint {
  date: string;
  value: number;
}

interface RunningStats {
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
}

const zoneBgColors = [
  "bg-m-blue-dark",
  "bg-m-blue-light",
  "bg-m-blue-light/80",
  "bg-m-red",
  "bg-m-red/80",
];

const zoneLabels = ["Z1 RECUP", "Z2 RESIST", "Z3 TEMPO", "Z4 UMBRAL", "Z5 MÁX"];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
};

function paceStr(sec: number | null | undefined): string {
  if (!sec) return "-";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function durationStr(min: number): string {
  if (min <= 0) return "-";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}min`;
}

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

export function RunningStatsView({ stats }: { stats: RunningStats }) {
  const zones = stats.hrZoneSeconds;
  const zoneArray = zones
    ? [zones.zone1 ?? 0, zones.zone2 ?? 0, zones.zone3 ?? 0, zones.zone4 ?? 0, zones.zone5 ?? 0]
    : null;
  const totalZoneSeconds = zoneArray ? zoneArray.reduce((a, b) => a + b, 0) : 0;

  // Sort data chronologically
  const distanceData = [...stats.distanceOverTime].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const paceData = [...stats.paceOverTime].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-xl">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline">
        <div className="bg-surface-card p-lg">
          <p className="text-caption text-muted mb-xxs tracking-[1.5px]">DISTANCIA TOTAL</p>
          <p className="text-display-sm font-display text-primary tracking-[0]">
            {stats.totalDistance.toFixed(1)} <span className="text-body-sm text-muted">km</span>
          </p>
        </div>
        <div className="bg-surface-card p-lg">
          <p className="text-caption text-muted mb-xxs tracking-[1.5px]">TIEMPO TOTAL</p>
          <p className="text-display-sm font-display text-primary tracking-[0]">
            {durationStr(stats.totalMinutes)}
          </p>
        </div>
        <div className="bg-surface-card p-lg">
          <p className="text-caption text-muted mb-xxs tracking-[1.5px]">RITMO MEDIO</p>
          <p className="text-display-sm font-display text-primary tracking-[0]">
            {paceStr(stats.avgPaceSecondsPerKm)} <span className="text-body-sm text-muted">/km</span>
          </p>
        </div>
        <div className="bg-surface-card p-lg">
          <p className="text-caption text-muted mb-xxs tracking-[1.5px]">SESIONES</p>
          <p className="text-display-sm font-display text-primary tracking-[0]">
            {stats.totalSessions}
          </p>
        </div>
      </div>

      {/* Distance Over Time */}
      <div className="bg-surface-card border border-hairline p-lg">
        <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md flex items-center gap-md">
          <span className="w-2 h-2 bg-m-red" />
          DISTANCIA POR SESIÓN
        </h3>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distanceData} barCategoryGap={4}>
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
              <Tooltip content={<ChartTooltip suffix="km" />} />
              <Bar
                dataKey="value"
                fill="#e22718"
                radius={[0, 0, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-hairline">
        {/* Pace Trend */}
        {paceData.length > 0 && (
          <div className="bg-surface-card p-lg">
            <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md flex items-center gap-md">
              <span className="w-2 h-2 bg-m-blue-light" />
              EVOLUCIÓN DEL RITMO
            </h3>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paceData}>
                  <defs>
                    <linearGradient id="paceGradientRs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1c69d4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1c69d4" stopOpacity={0} />
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
                          <p className="text-caption text-muted mb-xxs tracking-[1px]">{label}</p>
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
                    stroke="none"
                    fill="url(#paceGradientRs)"
                  />
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
        )}

        {/* HR Zone Distribution */}
        {zoneArray && totalZoneSeconds > 0 && (
          <div className="bg-surface-card p-lg">
            <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md flex items-center gap-md">
            <span className="w-2 h-2 bg-m-red" />
            DISTRIBUCIÓN DE FC
            </h3>
            <div className="space-y-sm">
              {zoneArray.map((seconds, i) => {
                const pct = totalZoneSeconds > 0 ? (seconds / totalZoneSeconds) * 100 : 0;
                const minutes = Math.round(seconds / 60);
                return (
                  <div key={i} className="grid grid-cols-[80px_1fr_48px_36px] gap-sm items-center">
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
                      {minutes}m
                    </span>
                    <span className="text-caption text-muted text-right tabular-nums">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-5 gap-xs mt-md pt-md border-t border-hairline">
              {["< 60%", "60-70%", "70-80%", "80-90%", "> 90%"].map((desc, i) => (
                <span key={i} className="text-caption text-muted/50 text-center text-[10px] tracking-[0.5px]">
                  {desc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
