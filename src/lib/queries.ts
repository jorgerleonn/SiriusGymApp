import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { DashboardStats, MuscleGroupData, ChartData } from "./types";

interface QuerySet {
  weight?: number | null;
  reps?: number | null;
  distance_meters?: number | null;
}

interface QueryExercise {
  id: string;
  workout_id: string;
  name: string;
  type: string;
  muscle_group: string;
  sets?: QuerySet[];
}

export async function getUserProfile() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("weight, age, gender")
    .eq("id", userId)
    .single();

  return data;
}

export async function getWorkouts() {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("workouts")
    .select("*")
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
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!data) return null;

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("workout_id", id)
    .order("order_index", { ascending: true });

  if (exercises) {
    const exerciseIds = exercises.map((e: { id: string }) => e.id);
    const { data: sets } = await supabase
      .from("sets")
      .select("*")
      .in("exercise_id", exerciseIds)
      .order("order_index", { ascending: true });

    data.exercises = exercises.map((ex: { id: string }) => ({
      ...ex,
      sets: sets?.filter((s: { exercise_id: string }) => s.exercise_id === ex.id) || [],
    }));
  }

  return data;
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createSupabaseAdmin();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, date, type, total_cardio_distance")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (!workouts || workouts.length === 0) {
    return {
      totalWorkouts: 0, thisWeek: 0, thisMonth: 0,
      totalVolume: 0, totalCardioDistance: 0,
      currentStreak: 0, bestStreak: 0,
      volumeOverTime: [], runningVolumeOverTime: [],
      muscleDistribution: [], weeklyActivity: [],
    };
  }

  const workoutIds = workouts.map((w: { id: string }) => w.id);

  const { data: allExercises } = await supabase
    .from("exercises")
    .select("id, workout_id, name, muscle_group, type, sets(weight, reps, distance_meters)")
    .in("workout_id", workoutIds);

  // Calculate base stats
  const totalWorkouts = workouts.length;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = workouts.filter((w: { date: string }) => new Date(w.date) >= weekAgo).length;

  const thisMonth = workouts.filter((w: { date: string }) => {
    const d = new Date(w.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Volume calculations
  const strengthExercises = allExercises?.filter((e: { type: string }) => e.type === "strength") || [];
  const cardioExercises = allExercises?.filter((e: { type: string }) => e.type === "cardio") || [];

  const totalVolume = (strengthExercises as QueryExercise[]).reduce((acc: number, ex) => {
    return acc + (ex.sets?.reduce((v: number, s) => v + (Number(s.weight) * (s.reps || 0)), 0) || 0);
  }, 0);

  const totalCardioDistance = (cardioExercises as QueryExercise[]).reduce((acc: number, ex) => {
    return acc + (ex.sets?.reduce((v: number, s) => v + (Number(s.distance_meters) || 0), 0) || 0);
  }, 0);

  // Streak calculation
  const dates = [...new Set(workouts.map((w: { date: string }) => w.date))].sort();
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  if (dates.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const lastDate = dates[dates.length - 1];

    // Check if the streak is current
    const lastDateObj = new Date(lastDate);
    const todayObj = new Date(today);
    const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      for (let i = dates.length - 1; i >= 0; i--) {
        if (i > 0) {
          const curr = new Date(dates[i]);
          const prev = new Date(dates[i - 1]);
          const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          if (diff === 1) {
            tempStreak++;
          } else {
            break;
          }
        }
      }
      currentStreak = tempStreak + 1;
    }

    for (let i = 0; i < dates.length; i++) {
      if (i > 0) {
        const curr = new Date(dates[i]);
        const prev = new Date(dates[i - 1]);
        const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak + 1);
          tempStreak = 0;
        }
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak + 1);
  }

  // Volume over time
  const volumeOverTime: ChartData[] = [];
  const runningVolumeOverTime: ChartData[] = [];

  for (const w of workouts) {
    const sessionExercises = allExercises?.filter((e: { workout_id: string }) => e.workout_id === w.id) || [];
    const strengthSession = sessionExercises.filter((e: { type: string }) => e.type === "strength");
    const cardioSession = sessionExercises.filter((e: { type: string }) => e.type === "cardio");

    const sessionVolume = (strengthSession as QueryExercise[]).reduce((acc: number, ex) => {
      return acc + (ex.sets?.reduce((v: number, s) => v + (Number(s.weight) * (s.reps || 0)), 0) || 0);
    }, 0);

    const sessionDistance = (cardioSession as QueryExercise[]).reduce((acc: number, ex) => {
      return acc + (ex.sets?.reduce((v: number, s) => v + (Number(s.distance_meters) || 0), 0) || 0);
    }, 0);

    if (sessionVolume > 0) {
      volumeOverTime.push({ date: w.date, value: Math.round(sessionVolume) });
    }
    if (sessionDistance > 0) {
      runningVolumeOverTime.push({ date: w.date, value: Math.round(sessionDistance / 1000) });
    }
  }

  // Muscle distribution
  const CARDIO_MUSCLES = [
    "CUÁDRICEPS", "ISQUIOTIBIALES", "GLÚTEOS", "GEMELOS",
    "TIBIAL ANTERIOR", "ABDOMEN", "ESPALDA INFERIOR",
  ];

  function getBaseOpacity(days: number): number {
    if (days <= 0) return 1;
    if (days === 1) return 0.8;
    if (days === 2) return 0.6;
    if (days === 3) return 0.4;
    return 0;
  }

  interface MuscleTracker {
    name: string;
    volume: number;
    sessions: number;
    strengthDays: number | null;
    cardioDays: number | null;
    cardioDistanceFactor: number | null;
  }

  const muscleTrackers = new Map<string, MuscleTracker>();
  const muscleLastDate = new Map<string, string>();
  const workoutDateIndex = new Map(
    workouts.map((w: { id: string; date: string }) => [w.id, w.date])
  );

  // Strength pass
  for (const ex of strengthExercises as QueryExercise[]) {
    const mg = ex.muscle_group || "OTROS";
    const existing = muscleTrackers.get(mg) || {
      name: mg, volume: 0, sessions: 0,
      strengthDays: null, cardioDays: null, cardioDistanceFactor: null,
    };
    existing.sessions += 1;
    existing.volume += (
      ex.sets?.reduce((v: number, s) => v + (Number(s.weight) * (s.reps || 0)), 0) || 0
    );
    muscleTrackers.set(mg, existing);

    const date = workoutDateIndex.get(ex.workout_id);
    if (date) {
      const prev = muscleLastDate.get(mg);
      if (!prev || date > prev) muscleLastDate.set(mg, date);
    }
  }

  for (const [mg, lastDate] of muscleLastDate) {
    const entry = muscleTrackers.get(mg);
    if (entry) {
      entry.strengthDays = Math.floor(
        (now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  }

  // Cardio pass — per-workout distance from cardio exercises (manual entries)
  const processedCardioWorkouts = new Set<string>();
  const cardioDistanceByWorkout = new Map<string, number>();
  for (const ex of cardioExercises as QueryExercise[]) {
    const exDistance =
      ex.sets?.reduce((v: number, s) => v + (Number(s.distance_meters) || 0), 0) || 0;
    if (exDistance > 0) {
      processedCardioWorkouts.add(ex.workout_id);
      const prev = cardioDistanceByWorkout.get(ex.workout_id) || 0;
      cardioDistanceByWorkout.set(ex.workout_id, prev + exDistance);
    }
  }

  for (const [workoutId, distanceMeters] of cardioDistanceByWorkout) {
    const distanceKm = distanceMeters / 1000;
    if (distanceKm <= 0) continue;

    let distanceFactor: number;
    if (distanceKm < 5) distanceFactor = 0.5;
    else if (distanceKm <= 10) distanceFactor = 0.75;
    else distanceFactor = 1.0;

    const date = workoutDateIndex.get(workoutId);
    if (!date) continue;
    const cardioDaysAgo = Math.floor(
      (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );

    for (const muscle of CARDIO_MUSCLES) {
      const existing = muscleTrackers.get(muscle) || {
        name: muscle, volume: 0, sessions: 0,
        strengthDays: null, cardioDays: null, cardioDistanceFactor: null,
      };
      existing.sessions += 1;
      existing.volume += Math.round(distanceMeters);

      if (existing.cardioDays === null || cardioDaysAgo < existing.cardioDays) {
        existing.cardioDays = cardioDaysAgo;
        existing.cardioDistanceFactor = distanceFactor;
      }

      muscleTrackers.set(muscle, existing);
    }
  }

  // Cardio pass — .fit uploads with total_cardio_distance on the workout row
  for (const w of workouts as { id: string; date: string; type: string; total_cardio_distance?: number }[]) {
    if (processedCardioWorkouts.has(w.id)) continue;
    if (w.type !== "cardio" || !w.total_cardio_distance || w.total_cardio_distance <= 0) continue;

    const distanceKm = w.total_cardio_distance;
    let distanceFactor: number;
    if (distanceKm < 5) distanceFactor = 0.5;
    else if (distanceKm <= 10) distanceFactor = 0.75;
    else distanceFactor = 1.0;

    const cardioDaysAgo = Math.floor(
      (now.getTime() - new Date(w.date).getTime()) / (1000 * 60 * 60 * 24)
    );

    for (const muscle of CARDIO_MUSCLES) {
      const existing = muscleTrackers.get(muscle) || {
        name: muscle, volume: 0, sessions: 0,
        strengthDays: null, cardioDays: null, cardioDistanceFactor: null,
      };
      existing.sessions += 1;
      existing.volume += Math.round(distanceKm * 1000);

      if (existing.cardioDays === null || cardioDaysAgo < existing.cardioDays) {
        existing.cardioDays = cardioDaysAgo;
        existing.cardioDistanceFactor = distanceFactor;
      }

      muscleTrackers.set(muscle, existing);
    }
  }

  // Propagation: ESPALDA → SUPERIOR / INFERIOR
  const espalda = muscleTrackers.get("ESPALDA");
  if (espalda && espalda.strengthDays !== null) {
    for (const sub of ["ESPALDA SUPERIOR", "ESPALDA INFERIOR"]) {
      const existing = muscleTrackers.get(sub);
      if (!existing) {
        muscleTrackers.set(sub, {
          name: sub, volume: 0, sessions: 0,
          strengthDays: espalda.strengthDays,
          cardioDays: null, cardioDistanceFactor: null,
        });
      } else if (existing.strengthDays === null || espalda.strengthDays < existing.strengthDays) {
        existing.strengthDays = espalda.strengthDays;
      }
    }
  }

  // Propagation: TRAPECIO → ESPALDA SUPERIOR
  const trapecio = muscleTrackers.get("TRAPECIO");
  if (trapecio && trapecio.strengthDays !== null) {
    const existing = muscleTrackers.get("ESPALDA SUPERIOR");
    if (!existing) {
      muscleTrackers.set("ESPALDA SUPERIOR", {
        name: "ESPALDA SUPERIOR", volume: 0, sessions: 0,
        strengthDays: trapecio.strengthDays,
        cardioDays: null, cardioDistanceFactor: null,
      });
    } else if (
      existing.strengthDays === null || trapecio.strengthDays < existing.strengthDays
    ) {
      existing.strengthDays = trapecio.strengthDays;
    }
  }

  // Merge into final data with effectiveOpacity
  const muscleDistribution: MuscleGroupData[] = Array.from(muscleTrackers.values())
    .map((tracker) => {
      const strengthOpacity =
        tracker.strengthDays !== null ? getBaseOpacity(tracker.strengthDays) : 0;
      const cardioOpacity =
        tracker.cardioDays !== null
          ? getBaseOpacity(tracker.cardioDays) * (tracker.cardioDistanceFactor || 1)
          : 0;
      const effectiveOpacity = Math.max(strengthOpacity, cardioOpacity);

      const strengthDays = tracker.strengthDays ?? 999;
      const cardioDays = tracker.cardioDays ?? 999;
      const lastTrainedDays = Math.min(strengthDays, cardioDays);

      return {
        name: tracker.name,
        volume: tracker.volume,
        sessions: tracker.sessions,
        lastTrainedDays,
        effectiveOpacity,
      };
    })
    .sort((a, b) => b.volume - a.volume);

  // Weekly activity for calendar (full year)
  const weeklyActivity: { date: string; count: number; hasCardio: boolean }[] = [];
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  for (let d = new Date(startOfYear); d <= endOfYear; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayWorkouts = workouts.filter((w: { date: string }) => w.date === dateStr);
    const count = dayWorkouts.length;
    const hasCardio = dayWorkouts.some((w: { type: string }) => w.type === "cardio" || w.type === "hybrid");
    weeklyActivity.push({ date: dateStr, count, hasCardio });
  }

  return {
    totalWorkouts,
    thisWeek,
    thisMonth,
    totalVolume: Math.round(totalVolume),
    totalCardioDistance: Math.round(totalCardioDistance / 1000),
    currentStreak,
    bestStreak,
    volumeOverTime,
    runningVolumeOverTime,
    muscleDistribution,
    weeklyActivity,
  };
}

export async function getWorkoutTemplates() {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createSupabaseAdmin();

  const { data: templates } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (!templates) return [];

  for (const template of templates) {
    const { data: exercises } = await supabase
      .from("template_exercises")
      .select("*")
      .eq("template_id", template.id)
      .order("order_index", { ascending: true });
    template.exercises = exercises || [];
  }

  return templates;
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

  const workoutIds = workouts.map((w: { id: string }) => w.id);

  const { data: exercises } = await supabase
    .from("exercises")
    .select("name")
    .in("workout_id", workoutIds);

  if (!exercises) return [];

  return [...new Set(exercises.map((e: { name: string }) => e.name))].sort();
}

export interface ExerciseStats {
  pr: number;
  totalVolume: number;
  timesPerformed: number;
  volumeOverTime: ChartData[];
  maxWeightOverTime: ChartData[];
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

  const workoutIds = workouts.map((w: { id: string }) => w.id);
  const workoutDateMap = workouts.reduce((acc: Record<string, string>, w: { id: string; date: string }) => {
    acc[w.id] = w.date;
    return acc;
  }, {});

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, workout_id, name, sets(weight, reps)")
    .in("workout_id", workoutIds)
    .eq("name", exerciseName);

  if (!exercises || exercises.length === 0) return null;

  let pr = 0;
  let totalVolume = 0;
  const volumeOverTime: ChartData[] = [];
  const maxWeightOverTime: ChartData[] = [];

  for (const ex of exercises) {
    const date = workoutDateMap[ex.workout_id];
    if (!date || !ex.sets) continue;

    const sessionVolume = (ex.sets as QuerySet[]).reduce((acc, s) => acc + (Number(s.weight) * (s.reps || 0)), 0);
    const sessionMaxWeight = Math.max(...(ex.sets as QuerySet[]).map((s) => Number(s.weight)));

    if (sessionMaxWeight > pr) pr = sessionMaxWeight;
    totalVolume += sessionVolume;

    volumeOverTime.push({ date, value: Math.round(sessionVolume) });
    maxWeightOverTime.push({ date, value: sessionMaxWeight });
  }

  return {
    pr,
    totalVolume,
    timesPerformed: exercises.length,
    volumeOverTime,
    maxWeightOverTime,
  };
}
