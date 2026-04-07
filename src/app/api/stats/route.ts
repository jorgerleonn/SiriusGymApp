import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const exerciseName = searchParams.get("exercise");

  const supabase = createSupabaseAdmin();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, date")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (!workouts || workouts.length === 0) {
    return NextResponse.json({ exercises: [], stats: null });
  }

  const workoutIds = workouts.map(w => w.id);
  const workoutDateMap = workouts.reduce((acc, w) => {
    acc[w.id] = w.date;
    return acc;
  }, {} as Record<string, string>);

  if (!exerciseName) {
    const { data: exercises } = await supabase
      .from("exercises")
      .select("name, workout_id, sets(weight, reps)")
      .in("workout_id", workoutIds);

    const exerciseNames = exercises?.map(e => e.name) || [];
    const uniqueExercises = [...new Set(exerciseNames)].sort();

    const volumeBySession: { date: string; value: number }[] = [];
    for (const w of workouts) {
      const sessionExercises = exercises?.filter(e => e.workout_id === w.id) || [];
      let sessionVolume = 0;
      for (const ex of sessionExercises) {
        if (ex.sets) {
          sessionVolume += ex.sets.reduce((acc: number, s: any) => acc + (Number(s.weight) * s.reps), 0);
        }
      }
      volumeBySession.push({ date: w.date, value: Math.round(sessionVolume) });
    }

    return NextResponse.json({ 
      exercises: uniqueExercises, 
      stats: null,
      totalVolumeBySession: volumeBySession
    });
  }

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, workout_id, name, sets(weight, reps)")
    .in("workout_id", workoutIds)
    .eq("name", exerciseName);

  if (!exercises || exercises.length === 0) {
    return NextResponse.json({ exercises: [], stats: null });
  }

  let pr = 0;
  let totalVolume = 0;
  const volumeOverTime: { date: string; value: number }[] = [];
  const maxWeightOverTime: { date: string; value: number }[] = [];

  for (const ex of exercises) {
    const date = workoutDateMap[ex.workout_id];
    if (!date || !ex.sets) continue;

    const sessionVolume = ex.sets.reduce((acc, s) => acc + (Number(s.weight) * s.reps), 0);
    const sessionMaxWeight = Math.max(...ex.sets.map(s => Number(s.weight)));

    if (sessionMaxWeight > pr) pr = sessionMaxWeight;
    totalVolume += sessionVolume;

    volumeOverTime.push({ date, value: Math.round(sessionVolume) });
    maxWeightOverTime.push({ date, value: sessionMaxWeight });
  }

  return NextResponse.json({
    exercises: [],
    stats: {
      pr,
      totalVolume,
      timesPerformed: exercises.length,
      volumeOverTime,
      maxWeightOverTime,
    }
  });
}