export interface HRZoneOption {
  id: string;
  label: string;
  description: string;
  carbDemandMultiplier: number;
}

export const HR_ZONES: HRZoneOption[] = [
  {
    id: "z1",
    label: "Zone 1: Recovery (50-60%)",
    description: "Esfuerzo muy suave, calentamiento o recuperación activa.",
    carbDemandMultiplier: 0.6, 
  },
  {
    id: "z2",
    label: "Zone 2: Aerobic Base (60-70%)",
    description: "Ritmo conversacional. Quema principal de grasas.",
    carbDemandMultiplier: 0.8,
  },
  {
    id: "z3",
    label: "Zone 3: Tempo (70-80%)",
    description: "Esfuerzo moderado. Respiración profunda pero controlable.",
    carbDemandMultiplier: 1.0,
  },
  {
    id: "z4",
    label: "Zone 4: Threshold (80-90%)",
    description: "Esfuerzo duro. Cerca del umbral de lactato.",
    carbDemandMultiplier: 1.2,
  },
  {
    id: "z5",
    label: "Zone 5: VO2 Max (90-100%)",
    description: "Esfuerzo máximo. Vaciado rápido de glucógeno.",
    carbDemandMultiplier: 1.4,
  }
];
