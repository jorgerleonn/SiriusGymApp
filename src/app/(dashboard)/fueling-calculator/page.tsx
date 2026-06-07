"use client";

import React, { useState, useMemo } from "react";
import { FuelingInputsPanel } from "@/components/fueling/FuelingInputsPanel";
import { FuelingSummaryPanel } from "@/components/fueling/FuelingSummaryPanel";
import { FuelingScheduleTable } from "@/components/fueling/FuelingScheduleTable";
import { FuelingPlaybook } from "@/components/fueling/FuelingPlaybook";
import { HR_ZONES } from "@/lib/fueling-constants";
import { calculateHourlyTargets, generateFuelingSchedule, calculateDIYMix } from "@/lib/fueling-calculator";

interface FuelingFormValues {
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

export default function FuelingCalculatorPage() {
  const [values, setValues] = useState<FuelingFormValues>({
    durationHours: 2,
    durationMinutes: 0,
    hrZone: "Zone 3: Tempo (70-80%)",
    bodyWeight: 70,
    temperature: 20,
    giTraining: "Intermediate",
    customCarbTarget: "",
    includeCaffeine: false,
    useHomemadeDrink: false,
    homemadeRatio: "2:1",
    gelProduct: "Maurten Gel 100",
    drinkProduct: "Maurten Drink Mix 160",
  });

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
      values.giTraining,
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
          <FuelingInputsPanel onUpdate={setValues} diyMix={fuelingData.diyMix} />
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
