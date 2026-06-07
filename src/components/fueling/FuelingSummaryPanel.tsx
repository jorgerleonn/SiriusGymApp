"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Timer, Zap } from "lucide-react";
import { VisualTimeline } from "./VisualTimeline";
import { ScheduleItem } from "@/lib/fueling-calculator";

interface FuelingSummaryProps {
  totalTime: string;
  durationMinutes: number;
  schedule: ScheduleItem[];
  metrics: {
    carbs: { current: number; target: number; color: string };
    fluids: { current: number; target: number; color: string };
    sodium: { current: number; target: number; color: string };
  };
}

const CircularMetric = ({ label, value, target, color }: { label: string; value: number; target: number; color: string }) => {
  const data = [
    { value: Math.min(value, target) },
    { value: Math.max(0, target - value) },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={38}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              <Cell fill={color} />
              <Cell fill="rgba(255,255,255,0.1)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-primary leading-none">{value}</span>
          <span className="text-[10px] text-muted uppercase font-bold leading-tight">{label}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted font-medium">Target: {target}</p>
    </div>
  );
};

export function FuelingSummaryPanel({ totalTime, durationMinutes, schedule, metrics }: FuelingSummaryProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-surface-card border-hairline text-center space-y-6">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Timer className="w-6 h-6 text-turquoise" />
          <span className="text-3xl font-black tracking-tighter">{totalTime}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-hairline">
          <CircularMetric 
            key={`carbs-${metrics.carbs.current}`}
            label="Carbs/hr" 
            value={metrics.carbs.current} 
            target={metrics.carbs.target} 
            color={metrics.carbs.color} 
          />
          <CircularMetric 
            key={`fluids-${metrics.fluids.current}`}
            label="Fluids/hr" 
            value={metrics.fluids.current} 
            target={metrics.fluids.target} 
            color={metrics.fluids.color} 
          />
          <CircularMetric 
            key={`sodium-${metrics.sodium.current}`}
            label="Sodium/hr" 
            value={metrics.sodium.current} 
            target={metrics.sodium.target} 
            color={metrics.sodium.color} 
          />
        </div>
      </Card>

      <Card className="p-6 bg-surface-card border-hairline space-y-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange" />
          <h2 className="text-xl font-bold text-primary">Visual Timeline</h2>
        </div>

        <VisualTimeline durationMinutes={durationMinutes} schedule={schedule} />
      </Card>
    </div>
  );
}
