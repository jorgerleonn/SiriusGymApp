export type WorkoutType = "strength" | "cardio" | "hybrid";
export type ExerciseType = "strength" | "cardio";

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  date: string;
  type: WorkoutType;
  notes: string | null;
  duration_minutes: number | null;
  total_cardio_distance: number | null;
  total_calories: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  avg_pace_seconds_per_km: number | null;
  hr_zone_seconds: Record<string, number> | null;
  heart_rate_data: { t: number; v: number }[] | null;
  route_data: [number, number][] | null;
  gear_id: string | null;
  cardiac_drift: number | null;
  efficiency_factor: number | null;
  created_at: string;
  exercises?: Exercise[];
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  type: ExerciseType;
  muscle_group: string | null;
  order_index: number;
  notes: string | null;
  sets?: Set[];
}

export interface Set {
  id: string;
  exercise_id: string;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  rpe: number | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  pace_seconds_per_km: number | null;
  heart_rate_zone: number | null;
  is_completed: boolean;
  order_index: number;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: WorkoutType;
  created_at: string;
  exercises: TemplateExercise[];
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  name: string;
  type: ExerciseType;
  muscle_group: string | null;
  order_index: number;
  default_sets: number;
  default_reps: number;
  default_weight: number | null;
  notes: string | null;
}

export interface ChartData {
  date: string;
  value: number;
}

export interface MuscleGroupData {
  name: string;
  volume: number;
  sessions: number;
  lastTrainedDays: number;
  effectiveOpacity: number;
}

export interface Gear {
  id: string;
  name: string;
  totalDistance: number;
  limit: number;
}

export interface DashboardStats {
  totalWorkouts: number;
  thisWeek: number;
  thisMonth: number;
  totalVolume: number;
  totalCardioDistance: number;
  currentStreak: number;
  bestStreak: number;
  volumeOverTime: ChartData[];
  runningVolumeOverTime: ChartData[];
  muscleDistribution: MuscleGroupData[];
  weeklyActivity: { date: string; count: number; hasCardio: boolean }[];
}

export type { ExerciseStats } from "./queries";
