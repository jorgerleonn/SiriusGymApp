"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface ConsistencyCalendarProps {
  data: { date: string; count: number; hasCardio: boolean }[];
}

const MONTHS = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

function getIntensity(count: number, max: number, hasCardio: boolean): string {
  if (count === 0) return "bg-surface-soft";
  const ratio = count / Math.max(max, 1);
  if (hasCardio) {
    if (ratio > 0.75) return "bg-m-red";
    if (ratio > 0.5) return "bg-m-red/80";
    if (ratio > 0.25) return "bg-m-red/50";
    return "bg-m-red/30";
  }
  if (ratio > 0.75) return "bg-m-blue-light";
  if (ratio > 0.5) return "bg-m-blue-dark/80";
  if (ratio > 0.25) return "bg-m-blue-dark/40";
  return "bg-m-blue-dark/20";
}

export function ConsistencyCalendar({ data }: ConsistencyCalendarProps) {
  const { months, maxCount } = useMemo(() => {
    const dayMap = new Map(data.map((d) => [d.date, { count: d.count, hasCardio: d.hasCardio }]));
    const max = Math.max(...data.map((d) => d.count), 1);
    const year = new Date().getFullYear();

    const months = Array.from({ length: 12 }, (_, month) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();

      const weeks: { date: string; count: number; hasCardio: boolean }[][] = [];
      let currentWeek: { date: string; count: number; hasCardio: boolean }[] = [];

      for (let i = 0; i < firstDay; i++) {
        currentWeek.push({ date: "", count: -1, hasCardio: false });
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        currentWeek.push({
          date: dateStr,
          count: dayMap.get(dateStr)?.count || 0,
          hasCardio: dayMap.get(dateStr)?.hasCardio || false,
        });

        if (new Date(year, month, day).getDay() === 6) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      if (currentWeek.length > 0) weeks.push(currentWeek);

      return { name: MONTHS[month], weeks };
    });

    return { months, maxCount: max };
  }, [data]);

  const hasActivity = maxCount > 1;

  if (!hasActivity) {
    return (
      <div className="flex items-center justify-center py-8 text-muted text-body-sm">
        SIN DATOS DE ACTIVIDAD
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {months.map((month, mi) => (
        <div key={mi}>
          <p className="text-caption text-muted mb-[6px] tracking-[1px]">{month.name}</p>
          <div className="flex gap-px">
            <div className="flex flex-col gap-px mr-[2px]">
              {DAY_LABELS.map((day, i) => (
                <div
                  key={i}
                  className="w-[10px] h-[10px] flex items-center justify-center text-[5px] text-muted/60"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="flex gap-px">
              {month.weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-px">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={cn(
                        "w-[10px] h-[10px] rounded-none transition-colors duration-200",
                        day.count === -1 && "bg-transparent",
                        day.count === 0 && "bg-surface-soft border border-hairline/20",
                        day.count > 0 && getIntensity(day.count, maxCount, day.hasCardio)
                      )}
                      title={day.date ? `${day.date}: ${day.count} entrenos` : ""}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
