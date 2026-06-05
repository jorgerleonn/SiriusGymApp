"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface ConsistencyCalendarProps {
  data: { date: string; count: number }[];
}

function getIntensity(count: number, max: number): string {
  if (count === 0) return "bg-surface-soft";
  const ratio = count / Math.max(max, 1);
  if (ratio > 0.75) return "bg-m-blue-light";
  if (ratio > 0.5) return "bg-m-blue-dark/80";
  if (ratio > 0.25) return "bg-m-blue-dark/40";
  return "bg-m-blue-dark/20";
}

export function ConsistencyCalendar({ data }: ConsistencyCalendarProps) {
  const { weeks, dayLabels, maxCount } = useMemo(() => {
    if (data.length === 0) return { weeks: [], dayLabels: [], maxCount: 0 };

    const dayMap = new Map(data.map((d) => [d.date, d.count]));
    const max = Math.max(...data.map((d) => d.count), 1);

    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);

    const weeks: { date: string; count: number; day: number }[][] = [];
    let currentWeek: { date: string; count: number; day: number }[] = [];

    const startDay = firstDate.getDay();

    for (let i = 0; i < startDay; i++) {
      currentWeek.push({ date: "", count: 0, day: i });
    }

    const cursor = new Date(firstDate);
    while (cursor <= lastDate) {
      const dateStr = cursor.toISOString().split("T")[0];
      currentWeek.push({
        date: dateStr,
        count: dayMap.get(dateStr) || 0,
        day: cursor.getDay(),
      });

      if (cursor.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (currentWeek.length > 0) weeks.push(currentWeek);

    const dayLabels = ["D", "L", "M", "M", "J", "V", "S"];

    return { weeks, dayLabels, maxCount: max };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted text-body-sm">
        SIN DATOS DE ACTIVIDAD
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 mr-2">
          {dayLabels.map((day, i) => (
            <div
              key={i}
              className="w-3 h-3 flex items-center justify-center text-[6px] text-muted"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={`${wi}-${di}`}
                  className={cn(
                    "w-3 h-3 rounded-none transition-colors duration-200",
                    getIntensity(day.count, maxCount),
                    day.count === 0 && "border border-hairline/20"
                  )}
                  title={day.date ? `${day.date}: ${day.count} entrenos` : ""}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
