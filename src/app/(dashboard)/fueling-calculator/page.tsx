"use client";

import React, { useState, useMemo, useEffect } from "react";
import { FuelingInputsPanel } from "@/components/fueling/FuelingInputsPanel";
import { FuelingSummaryPanel } from "@/components/fueling/FuelingSummaryPanel";
import { FuelingScheduleTable } from "@/components/fueling/FuelingScheduleTable";
import { FuelingPlaybook } from "@/components/fueling/FuelingPlaybook";
import { HR_ZONES } from "@/lib/fueling-constants";
import { calculateHourlyTargets, generateFuelingSchedule, calculateDIYMix } from "@/lib/fueling-calculator";

interface FuelingFormValues {
  plannedDistance: number | null;
  durationHours: number;
  durationMinutes: number;
  hrZone: string;
  bodyWeight: number;
  temperature: number;
  giTraining: string;
  customCarbTarget: string;
  includeCaffeine: boolean;
  useHomemadeDrink: boolean;
  homemadeRatio: string;
  gelProduct: string;
  drinkProduct: string;
}

interface RunningSession {
  date: string;
  distance_km: number;
  duration_minutes: number;
  avg_pace_seconds_per_km: number | null;
  avg_heart_rate: number | null;
  total_calories: number | null;
  hr_zone_seconds: Record<string, number> | null;
}

export default function FuelingCalculatorPage() {
  const [sessions, setSessions] = useState<RunningSession[]>([]);
  const [values, setValues] = useState<FuelingFormValues>({
    plannedDistance: null,
    durationHours: 2,
    durationMinutes: 0,
    hrZone: "Zone 3: Tempo (70-80%)",
    bodyWeight: Number(localStorage.getItem("sirius_bodyWeight")) || 75,
    temperature: 20,
    giTraining: "Intermediate",
    customCarbTarget: "",
    includeCaffeine: false,
    useHomemadeDrink: false,
    homemadeRatio: "2:1",
    gelProduct: "Maurten Gel 100",
    drinkProduct: "Maurten Drink Mix 160",
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats?exercise=CARRERA");
        const data = await res.json();
        if (data.stats && data.stats.sessions) {
          setSessions(data.stats.sessions);
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    localStorage.setItem("sirius_bodyWeight", values.bodyWeight.toString());
  }, [values.bodyWeight]);

  const avgPace = useMemo(() => {
    if (sessions.length === 0) return 0;
    
    const zoneMatch = values.hrZone.match(/Zone (\d+)/);
    const targetZone = zoneMatch ? `zone${zoneMatch[1]}` : null;

    if (!targetZone) return 0;

    const zoneSessions = sessions.filter(s => {
      if (!s.hr_zone_seconds) return false;
      const zones = s.hr_zone_seconds;
      const selectedZoneTime = zones[targetZone] || 0;
      const totalTime = Object.values(zones).reduce((a, b) => a + b, 0);
      return selectedZoneTime > totalTime * 0.3;
    });

    const finalSessions = zoneSessions.length > 0 ? zoneSessions : sessions;
    const validSessions = finalSessions.filter(s => s.avg_pace_seconds_per_km);
    if (validSessions.length === 0) return 0;
    
    return validSessions.reduce((acc, s) => acc + (s.avg_pace_seconds_per_km || 0), 0) / validSessions.length;
  }, [sessions, values.hrZone]);

  const handleUpdate = (newValues: FuelingFormValues) => {
    setValues(prev => {
      const distChanged = newValues.plannedDistance !== prev.plannedDistance;
      const durChanged = newValues.durationHours !== prev.durationHours || newValues.durationMinutes !== prev.durationMinutes;

      if (distChanged && !durChanged && avgPace !== 0) {
        const totalSeconds = (newValues.plannedDistance || 0) * avgPace;
        const totalMinutes = Math.round(totalSeconds / 60);
        return {
          ...newValues,
          durationHours: Math.floor(totalMinutes / 60),
          durationMinutes: totalMinutes % 60,
        };
      }

      if (durChanged && !distChanged && avgPace !== 0) {
        const totalSeconds = (newValues.durationHours * 3600) + (newValues.durationMinutes * 60);
        const distance = Math.round((totalSeconds / avgPace) * 100) / 100;
        return {
          ...newValues,
          plannedDistance: distance,
        };
      }

      return newValues;
    });
  };

  // Sync Distance -> Duration (Removed useEffect)
  // Sync Duration -> Distance (Removed useEffect)

  const totalDurationMinutes = useMemo(() => {
    return (Number(values.durationHours) * 60) + Number(values.durationMinutes);
  }, [values.durationHours, values.durationMinutes]);

  const totalTimeFormatted = `${values.durationHours}h ${values.durationMinutes}m`;

  const fuelingData = useMemo(() => {
    const selectedZone = HR_ZONES.find(z => z.label === values.hrZone) || HR_ZONES[2];
    
    const targets = calculateHourlyTargets(
      values.bodyWeight,
      values.temperature,
      selectedZone.carbDemandMultiplier,
      values.customCarbTarget,
      totalDurationMinutes
    );

    const schedule = generateFuelingSchedule(totalDurationMinutes, targets);

    const diyMix = calculateDIYMix(
      targets.targetCarbs,
      targets.targetFluids,
      targets.targetSodium,
      totalDurationMinutes,
      values.homemadeRatio
    );

    return { targets, schedule, diyMix };
  }, [values, totalDurationMinutes]);

  const metrics = {
    carbs: { 
      current: fuelingData.targets.targetCarbs, 
      target: 90, 
      color: "#2dd4bf" 
    },
    fluids: { 
      current: fuelingData.targets.targetFluids, 
      target: 800, 
      color: "#2dd4bf" 
    },
    sodium: { 
      current: fuelingData.targets.targetSodium, 
      target: 600, 
      color: "#f97316" 
    },
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-primary tracking-tighter">Endurance Fueling Calculator</h1>
        <p className="text-muted text-sm max-w-2xl">
          Optimize your nutrition and hydration strategy based on intensity, environmental conditions, and gastrointestinal tolerance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-8">
          <FuelingInputsPanel 
            onUpdate={handleUpdate} 
            diyMix={fuelingData.diyMix} 
            values={values}
          />
        </div>
        
        <div className="lg:col-span-7 space-y-8">
          <FuelingSummaryPanel 
            totalTime={totalTimeFormatted} 
            durationMinutes={totalDurationMinutes}
            schedule={fuelingData.schedule}
            metrics={metrics} 
          />
          <FuelingScheduleTable schedule={fuelingData.schedule} />
          <FuelingPlaybook />
        </div>
      </div>
    </div>
  );
}
