"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ShoppingBag, TrendingUp, Activity } from "lucide-react";
import { Gear } from "@/lib/types";

interface AdvancedRunningStatsProps {
  gear: Gear[];
  driftHistory: { date: string; value: number }[];
  efHistory: { date: string; value: number }[];
  cadenceHistory: { date: string; value: number }[];
}

export function AdvancedRunningStats({ gear, driftHistory, efHistory, cadenceHistory }: AdvancedRunningStatsProps) {
  return (
    <div className="space-y-lg w-full">
      {/* Gear Tracker */}
      <div className="bg-surface-card border border-hairline p-lg">
        <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md flex items-center gap-md">
          <ShoppingBag className="w-4 h-4" />
          CONTROL DE MATERIAL
        </h3>
        <div className="space-y-md">
          {gear.map((item) => {
            const progress = Math.min((item.totalDistance / item.limit) * 100, 100);
            const isOverLimit = item.totalDistance > item.limit;
            return (
              <div key={item.id} className="space-y-xs">
                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-primary font-display">{item.name}</span>
                  <span className={`text-caption tabular-nums ${isOverLimit ? "text-[#F57627]" : "text-muted"}`}>
                    {item.totalDistance} / {item.limit} km
                  </span>
                </div>
                <div className="h-1 w-full bg-canvas">
                  <div 
                    className={`h-full transition-all duration-500 ${isOverLimit ? "bg-[#F57627]" : "bg-[#27F5BE]"}`} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                {isOverLimit && (
                  <span className="text-[10px] text-[#F57627] uppercase tracking-wider font-bold">
                    Sustituir calzado
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cardiac Drift & EF History */}
      <div className="bg-surface-card border border-hairline p-lg">
        <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md flex items-center gap-md">
          <TrendingUp className="w-4 h-4" />
          DESACOPLE Y EFICIENCIA
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={driftHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(d) => d.split("-")[2]}
              />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "0" }}
                itemStyle={{ fontSize: 10 }}
              />
              <Line type="monotone" dataKey="value" name="Drift %" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" data={efHistory} dataKey="value" name="EF" stroke="#27F5BE" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Running Dynamics History */}
      <div className="bg-surface-card border border-hairline p-lg">
        <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md flex items-center gap-md">
          <Activity className="w-4 h-4" />
          DINÁMICA DE CARRERA
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cadenceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(d) => d.split("-")[2]}
              />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "0" }}
                itemStyle={{ fontSize: 10 }}
              />
              <Line type="monotone" dataKey="value" name="Cadencia (spm)" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
