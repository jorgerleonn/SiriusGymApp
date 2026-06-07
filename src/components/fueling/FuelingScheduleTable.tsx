"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Edit3 } from "lucide-react";
import { ScheduleItem } from "@/lib/fueling-calculator";

interface FuelingScheduleTableProps {
  schedule: ScheduleItem[];
}

export function FuelingScheduleTable({ schedule }: FuelingScheduleTableProps) {
  return (
    <Card className="p-6 bg-surface-card border-hairline space-y-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">Fueling Schedule</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs h-8 px-3 border-hairline text-muted hover:text-primary hover:border-primary transition-all">
            <FileText className="w-3 h-3" /> Save as PDF
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs h-8 px-3 border-hairline text-muted hover:text-primary hover:border-primary transition-all">
            <Edit3 className="w-3 h-3" /> Manually Edit
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-muted uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3 px-2">Time</th>
              <th className="py-3 px-2">Fuel Suggestion</th>
              <th className="py-3 px-2 text-right">Carbs (g)</th>
              <th className="py-3 px-2 text-right">Fluids (ml)</th>
              <th className="py-3 px-2 text-right">Sodium (mg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {schedule.map((item, i) => (
              <tr key={i} className="hover:bg-canvas transition-colors group">
                <td className="py-3 px-2 text-primary font-medium">{item.time}</td>
                <td className="py-3 px-2 text-body group-hover:text-primary transition-colors">{item.suggestion}</td>
                <td className="py-3 px-2 text-right text-body">{item.carbs}</td>
                <td className="py-3 px-2 text-right text-body">{item.fluids}</td>
                <td className="py-3 px-2 text-right text-body">{item.sodium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
