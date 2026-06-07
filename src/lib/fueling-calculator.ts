// No imports needed

export interface FuelingTargets {
  targetCarbs: number;
  targetFluids: number;
  targetSodium: number;
}

export interface DIYMix {
  waterLiters: string;
  sugarGrams: number;
  sugarLabel: string;
  saltGrams: string;
  estimatedCost: string;
}

export interface ScheduleItem {
  time: string;
  suggestion: string;
  carbs: number;
  fluids: number;
  sodium: number;
}

export function calculateHourlyTargets(
  weight: number,
  temp: number,
  hrZoneMultiplier: number,
  giTrainingLevel: string,
  customCarbTarget: string | number,
  durationMinutes: number
): FuelingTargets {
  // 1. Fluids Calculation (ml/hr)
  let targetFluids = 10 * weight;
  if (temp > 20) {
    targetFluids += (temp - 20) * 15;
  }

  // 2. Carbs Calculation (g/hr)
  let targetCarbs = 0;

  if (durationMinutes > 60) {
    targetCarbs = 60 * hrZoneMultiplier;
    
    const giCaps: Record<string, number> = {
      "Beginner": 60,
      "Intermediate": 90,
      "Advanced": 120,
      "Elite": 120,
    };

    const cap = giCaps[giTrainingLevel] || 60;
    targetCarbs = Math.min(targetCarbs, cap);
  }

  if (customCarbTarget && customCarbTarget !== "") {
    targetCarbs = Number(customCarbTarget);
  }

  // 3. Sodium Calculation (mg/hr)
  const targetSodium = (targetFluids / 1000) * 800;

  return {
    targetCarbs: Math.round(targetCarbs),
    targetFluids: Math.round(targetFluids),
    targetSodium: Math.round(targetSodium),
  };
}

export function generateFuelingSchedule(
  durationMinutes: number,
  targets: FuelingTargets
): ScheduleItem[] {
  const schedule: ScheduleItem[] = [];
  
  // Start at 30 mins and stop before reaching total duration
  for (let t = 30; t < durationMinutes; t += 30) {
    const hh = String(Math.floor(t / 60)).padStart(2, '0');
    const mm = String(t % 60).padStart(2, '0');
    const timeString = `${hh}:${mm}`;

    const carbs = targets.targetCarbs / 2;
    const fluids = targets.targetFluids / 2;
    const sodium = targets.targetSodium / 2;

    let suggestion = "Water";
    if (carbs > 0) {
      suggestion = "1 Gel + Agua";
    } else if (sodium > 0) {
      suggestion = "Water + Electrolytes";
    }

    schedule.push({
      time: timeString,
      suggestion,
      carbs: Math.round(carbs),
      fluids: Math.round(fluids),
      sodium: Math.round(sodium),
    });
  }

  return schedule;
}

export function calculateDIYMix(
  targetCarbs: number,
  targetFluids: number,
  targetSodium: number,
  durationMinutes: number,
  glucoseRatio: string
): DIYMix {
  const totalHours = durationMinutes / 60;
  const totalCarbs = targetCarbs * totalHours;
  const totalFluids = targetFluids * totalHours;
  const totalSodium = targetSodium * totalHours;

  const waterLiters = (totalFluids / 1000).toFixed(1);
  const saltGrams = (totalSodium / 393).toFixed(1);
  const sugarGrams = Math.round(totalCarbs);
  const sugarLabel = glucoseRatio === "1:1" ? "TABLE SUGAR" : "MALTODEXTRIN + FRUCTOSE";
  
  const cost = ((totalCarbs / 1000) * 1.20 + (parseFloat(saltGrams) / 1000) * 0.30).toFixed(2);

  return {
    waterLiters,
    sugarGrams,
    sugarLabel,
    saltGrams,
    estimatedCost: `€${cost}`,
  };
}
