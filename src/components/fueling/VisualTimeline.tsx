"use client";

import React from "react";
import { ScheduleItem } from "@/lib/fueling-calculator";

interface VisualTimelineProps {
  durationMinutes: number;
  schedule: ScheduleItem[];
}

export function VisualTimeline({ durationMinutes, schedule }: VisualTimelineProps) {
  const convertTimeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const hourMarks = [];
  const totalHours = Math.floor(durationMinutes / 60);
  for (let h = 0; h <= totalHours; h++) {
    const minutes = h * 60;
    if (minutes <= durationMinutes) {
      hourMarks.push({
        hour: h,
        position: (minutes / durationMinutes) * 100,
      });
    }
  }

  return (
    <div className="relative h-24 flex items-center px-4">
      {/* Base Axis Line */}
      <div className="absolute left-4 right-4 h-px bg-hairline z-0" />

      {/* Hour Marks */}
      <div className="flex justify-between w-full relative z-10">
        {hourMarks.map(({ hour, position }) => (
          <div 
            key={hour} 
            className="absolute flex flex-col items-center gap-1 transition-all"
            style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-2 h-2 rounded-full bg-muted border border-canvas" />
            <span className="text-[10px] text-muted font-bold">{hour}h</span>
          </div>
        ))}
      </div>

      {/* Fueling Nodes */}
      {schedule.map((item, i) => {
        const minutes = convertTimeToMinutes(item.time);
        const position = (minutes / durationMinutes) * 100;
        const hasCarbs = item.carbs > 0;

        return (
          <div 
            key={i} 
            className="absolute h-4 w-4 -mt-1.5 rounded-full border-2 border-canvas cursor-pointer hover:scale-125 transition-transform z-20 group"
            style={{ 
              left: `${position}%`, 
              transform: 'translateX(-50%)',
              backgroundColor: hasCarbs ? '#f97316' : '#2dd4bf', // Orange for carbs, Turquoise for water
              boxShadow: hasCarbs ? '0 0 10px rgba(249, 115, 22, 0.4)' : '0 0 10px rgba(45, 212, 191, 0.4)'
            }}
            title={`${item.time} - ${item.suggestion}`}
          >
            {/* Custom Tooltip on Hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max">
              <div className="bg-surface-elevated text-primary text-[10px] font-bold py-1 px-2 rounded border border-hairline whitespace-nowrap shadow-xl">
                {item.time}: {item.suggestion}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
