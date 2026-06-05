"use client";

import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import type { ChartData } from "@/lib/types";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
};

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
      <p className="text-caption text-muted mb-xxs">{label}</p>
      <p className="text-label-uppercase text-primary">
        {payload[0].value?.toLocaleString()} {suffix}
      </p>
    </div>
  );
}

export function VolumeChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted text-body-sm">
        SIN DATOS DE VOLUMEN
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0066b1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0066b1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#3c3c3c"
            fontSize={10}
            tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#3c3c3c"
            fontSize={10}
            tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
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
            fill="url(#volumeFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RunningChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted text-body-sm">
        SIN DATOS DE CARDIO
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#3c3c3c"
            fontSize={10}
            tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#3c3c3c"
            fontSize={10}
            tick={{ fill: "#7e7e7e", letterSpacing: "1px" }}
            tickFormatter={(v) => `${v}km`}
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
  );
}
