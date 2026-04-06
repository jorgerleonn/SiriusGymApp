import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function getWorkouts() {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("workouts")
    .select(`
      *,
      exercises (
        *,
        sets (*)
      )
    `)
    .eq("user_id", userId)
    .order("date", { ascending: false });
  return data || [];
}

export async function getWorkout(id: string) {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("workouts")
    .select(`
      *,
      exercises (
        *,
        sets (*)
      )
    `)
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function getStats() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createSupabaseAdmin();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (!workouts || workouts.length === 0) return null;

  const { data: allExercises } = await supabase
    .from("exercises")
    .select(`
      *,
      sets (weight, reps)
    `)
    .in("workout_id", workouts.map(w => w.id));

  const totalWorkouts = workouts.length;
  const totalSets = allExercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0;
  const totalVolume = allExercises?.reduce((acc: number, ex: any) => {
    return acc + (ex.sets?.reduce((v: number, s: any) => v + (Number(s.weight) * s.reps), 0) || 0);
  }, 0) || 0;

  const firstWorkout = workouts[workouts.length - 1];
  const lastWorkout = workouts[0];
  const daysActive = Math.max(1, Math.ceil((new Date(lastWorkout.date).getTime() - new Date(firstWorkout.date).getTime()) / (1000 * 60 * 60 * 24)));

  const thisWeek = workouts.filter(w => {
    const date = new Date(w.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  }).length;

  const thisMonth = workouts.filter(w => {
    const date = new Date(w.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const workoutNames = workouts.map(w => w.name);
  const workoutTypeCounts: Record<string, number> = workoutNames.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const favoriteWorkout = Object.entries(workoutTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  const exerciseNames = allExercises?.map(e => e.name) || [];
  const exerciseCounts: Record<string, number> = exerciseNames.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const favoriteExercise = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  const exercisePRs = allExercises?.reduce((acc: Record<string, { weight: number; reps: number }>, ex: any) => {
    const maxWeight = Math.max(...(ex.sets?.map((s: any) => Number(s.weight)) || [0]));
    if (maxWeight > 0 && (!acc[ex.name] || maxWeight > acc[ex.name].weight)) {
      acc[ex.name] = { weight: maxWeight, reps: ex.sets?.find((s: any) => Number(s.weight) === maxWeight)?.reps || 0 };
    }
    return acc;
  }, {} as Record<string, { weight: number; reps: number }>);

  return {
    totalWorkouts,
    totalSets,
    totalVolume: Math.round(totalVolume),
    daysActive,
    thisWeek,
    thisMonth,
    favoriteWorkout,
    favoriteExercise,
    exercisePRs: exercisePRs || {},
    workoutsPerWeek: totalWorkouts / Math.max(1, daysActive / 7),
  };
}

export async function getAllExercises() {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createSupabaseAdmin();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", userId);

  if (!workouts || workouts.length === 0) return [];

  const workoutIds = workouts.map(w => w.id);

  const { data: exercises } = await supabase
    .from("exercises")
    .select("name")
    .in("workout_id", workoutIds);

  if (!exercises) return [];

  const exerciseNames = exercises.map(e => e.name);
  const uniqueExercises = [...new Set(exerciseNames)].sort();

  return uniqueExercises;
}

export interface ExerciseStats {
  pr: number;
  totalVolume: number;
  timesPerformed: chartData[];
  volumeOverTime: chartData[];
  maxWeightOverTime: chartData[];
}

export interface chartData {
  date: string;
  value: number;
}

export async function getExerciseStats(exerciseName: string): Promise<ExerciseStats | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createSupabaseAdmin();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, date")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (!workouts || workouts.length === 0) return null;

  const workoutIds = workouts.map(w => w.id);
  const workoutDateMap = workouts.reduce((acc, w) => {
    acc[w.id] = w.date;
    return acc;
  }, {} as Record<string, string>);

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, workout_id, name, sets(weight, reps)")
    .in("workout_id", workoutIds)
    .eq("name", exerciseName);

  if (!exercises || exercises.length === 0) return null;

  let pr = 0;
  let totalVolume = 0;
  const timesPerformed: chartData[] = [];
  const volumeOverTime: chartData[] = [];
  const maxWeightOverTime: chartData[] = [];

  for (const ex of exercises) {
    const date = workoutDateMap[ex.workout_id];
    if (!date || !ex.sets) continue;

    const sessionVolume = ex.sets.reduce((acc, s) => acc + (Number(s.weight) * s.reps), 0);
    const sessionMaxWeight = Math.max(...ex.sets.map(s => Number(s.weight)));

    if (sessionMaxWeight > pr) pr = sessionMaxWeight;
    totalVolume += sessionVolume;

    timesPerformed.push({ date, value: ex.sets.length });
    volumeOverTime.push({ date, value: Math.round(sessionVolume) });
    maxWeightOverTime.push({ date, value: sessionMaxWeight });
  }

  return {
    pr,
    totalVolume,
    timesPerformed,
    volumeOverTime,
    maxWeightOverTime,
  };
}