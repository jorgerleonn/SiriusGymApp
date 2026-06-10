"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Thermometer, Timer, Weight, Zap } from "lucide-react";
import { HR_ZONES } from "@/lib/fueling-constants";
import { DIYMix } from "@/lib/fueling-calculator";

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

const RATIOS = ["1:1", "2:1", "1:0.8"];

export function FuelingInputsPanel({ 
  onUpdate, 
  diyMix, 
  values 
}: { 
  onUpdate: (values: FuelingFormValues) => void, 
  diyMix: DIYMix,
  values: FuelingFormValues
}) {
  const { register, setValue, watch, getValues } = useForm<FuelingFormValues>({
      defaultValues: {
        plannedDistance: null,
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
    },
  });

  const useHomemadeDrink = watch("useHomemadeDrink");
  const homemadeRatio = watch("homemadeRatio");

  React.useEffect(() => {
    setValue("plannedDistance", values.plannedDistance);
    setValue("durationHours", values.durationHours);
    setValue("durationMinutes", values.durationMinutes);
  }, [values.plannedDistance, values.durationHours, values.durationMinutes, setValue]);

  const handleFieldChange = <K extends keyof FuelingFormValues>(
    field: K, 
    value: FuelingFormValues[K]
  ) => {
    setValue(field, value);
    onUpdate({
      ...getValues(),
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6 bg-surface-card border-hairline">
        <div className="flex items-center gap-2 mb-2">
          <Timer className="w-5 h-5 text-turquoise" />
          <h2 className="text-xl font-bold text-primary">Your Plan Inputs</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted uppercase font-semibold tracking-wider">Planned Distance</label>
            <div className="relative">
              <input 
                {...register("plannedDistance", { 
                  valueAsNumber: true,
                  onChange: (e) => handleFieldChange("plannedDistance", e.target.valueAsNumber)
                })} 
                type="number" 
                placeholder="Optional"
                className="w-full bg-canvas border border-hairline rounded-md px-3 py-2 text-primary focus:border-turquoise outline-none transition-colors"
              />
              <span className="absolute right-3 top-2 text-xs text-muted">km</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted uppercase font-semibold tracking-wider">Duration</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  {...register("durationHours", { 
                    valueAsNumber: true,
                    onChange: (e) => handleFieldChange("durationHours", e.target.valueAsNumber)
                  })} 
                  type="number" 
                  className="w-full bg-canvas border border-hairline rounded-md px-3 py-2 text-primary focus:border-turquoise outline-none transition-colors"
                />
                <span className="absolute right-3 top-2 text-xs text-muted">h</span>
              </div>
              <div className="relative flex-1">
                <input 
                  {...register("durationMinutes", { 
                    valueAsNumber: true,
                    onChange: (e) => handleFieldChange("durationMinutes", e.target.valueAsNumber)
                  })} 
                  type="number" 
                  className="w-full bg-canvas border border-hairline rounded-md px-3 py-2 text-primary focus:border-turquoise outline-none transition-colors"
                />
                <span className="absolute right-3 top-2 text-xs text-muted">m</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted uppercase font-semibold tracking-wider">Avg HR Zone</label>
            <Combobox 
              value={watch("hrZone")} 
              onChange={(v) => handleFieldChange("hrZone", v)} 
              items={HR_ZONES.map(z => z.label)} 
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted uppercase font-semibold tracking-wider flex items-center gap-1">
              <Weight className="w-3 h-3" /> Body Weight (kg)
            </label>
            <input 
              {...register("bodyWeight", {
                onChange: (e) => handleFieldChange("bodyWeight", e.target.valueAsNumber)
              })} 
              type="number" 
              className="w-full bg-canvas border border-hairline rounded-md px-3 py-2 text-primary focus:border-turquoise outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted uppercase font-semibold tracking-wider flex items-center gap-1">
              <Thermometer className="w-3 h-3" /> Temp (°C): {watch("temperature")}°
            </label>
            <input 
              {...register("temperature", {
                onChange: (e) => handleFieldChange("temperature", e.target.valueAsNumber)
              })} 
              type="range" 
              min="0" 
              max="40" 
              className="w-full accent-turquoise"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted uppercase font-semibold tracking-wider">Custom Carb Target (g/h)</label>
            <input 
              {...register("customCarbTarget", {
                onChange: (e) => handleFieldChange("customCarbTarget", e.target.value)
              })} 
              type="number" 
              placeholder="Optional"
              className="w-full bg-canvas border border-hairline rounded-md px-3 py-2 text-primary focus:border-turquoise outline-none transition-colors"
            />
          </div>
        </div>

      </Card>

      <Card className="p-6 space-y-6 bg-surface-card border-hairline">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-orange" />
          <h2 className="text-xl font-bold text-primary">Strategy Options</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-canvas rounded-lg border border-hairline">
            <span className="text-sm text-primary">Include Caffeine Strategy</span>
           <button 
             onClick={() => setValue("includeCaffeine", !getValues("includeCaffeine"))}
             className={`w-11 h-6 rounded-full transition-colors relative ${watch("includeCaffeine") ? "bg-turquoise" : "bg-muted"}`}
           >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${watch("includeCaffeine") ? "left-6" : "left-1"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-canvas rounded-lg border border-hairline">
            <span className="text-sm text-primary">DIY Sports Drink</span>
           <button 
             onClick={() => setValue("useHomemadeDrink", !getValues("useHomemadeDrink"))}
             className={`w-11 h-6 rounded-full transition-colors relative ${useHomemadeDrink ? "bg-turquoise" : "bg-muted"}`}
           >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useHomemadeDrink ? "left-6" : "left-1"}`} />
            </button>
          </div>
        </div>

        {useHomemadeDrink && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-xs text-muted uppercase font-semibold tracking-wider">Glucose:Fructose Ratio</label>
              <div className="flex p-1 bg-canvas rounded-md border border-hairline">
                {RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setValue("homemadeRatio", ratio)}
                    className={`flex-1 py-1 text-xs rounded-sm transition-all ${homemadeRatio === ratio ? "bg-turquoise text-black font-bold" : "text-muted hover:text-primary"}`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Water", value: `${diyMix.waterLiters} L`, icon: "💧" },
                { label: diyMix.sugarLabel, value: `${diyMix.sugarGrams} g`, icon: "🍬" },
                { label: "Salt", value: `${diyMix.saltGrams} g`, icon: "🧂" },
                { label: "Est. Cost", value: diyMix.estimatedCost, icon: "💰" },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-canvas border border-hairline rounded-lg flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-[10px] text-muted uppercase font-bold">{item.label}</p>
                    <p className="text-sm font-bold text-primary">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
