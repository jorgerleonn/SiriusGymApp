export interface UserProfile {
  weight: number | null;
  age: number | null;
  gender: "male" | "female" | null;
}

export function calculateCalories(
  avgHeartRate: number | null,
  durationMinutes: number | null,
  distanceKm: number | null,
  profile: UserProfile | null
): number {
  const weight = profile?.weight ?? 75;
  const age = profile?.age ?? 25;
  const gender = profile?.gender ?? "male";

  if (!avgHeartRate || avgHeartRate <= 0 || !durationMinutes) {
    // Fallback por distancia
    if (distanceKm && distanceKm > 0) {
      return Math.round(weight * distanceKm * 1.036);
    }
    return 0;
  }

  let calories = 0;
  if (gender === "female") {
    calories = ((age * 0.074 - weight * 0.05741 + avgHeartRate * 0.4472 - 20.4022) / 4.184) * durationMinutes;
  } else {
    calories = ((age * 0.2017 + weight * 0.09036 + avgHeartRate * 0.6309 - 55.0969) / 4.184) * durationMinutes;
  }

  return Math.round(Math.max(0, calories));
}
