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
    .select("id, date, type, total_cardio_distance, duration_minutes, avg_heart_rate, max_heart_rate, avg_pace_seconds_per_km, hr_zone_seconds, total_calories")
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

  // Fetch strength + manual cardio exercises (exercises table)
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, workout_id, name, type, sets(weight, reps, distance_meters, duration_seconds, pace_seconds_per_km, heart_rate_zone)")
    .in("workout_id", workoutIds);

  // ── Exercise listing (no specific exercise selected) ──────────────
  if (!exerciseName) {
    const exerciseNames = exercises?.map(e => e.name) || [];
    const uniqueExercises = [...new Set(exerciseNames)].sort();

    // Add "CARRERA" if any cardio workouts with total_cardio_distance exist
    const hasCardioWorkouts = workouts.some(
      w => w.type === "cardio" && w.total_cardio_distance != null && w.total_cardio_distance > 0
    );
    if (hasCardioWorkouts && !uniqueExercises.includes("CARRERA")) {
      uniqueExercises.unshift("CARRERA");
    }

    // Total volume by session (strength only)
    const volumeBySession: { date: string; value: number }[] = [];
    for (const w of workouts) {
      const sessionExercises = exercises?.filter(e => e.workout_id === w.id) || [];
      let sessionVolume = 0;
      for (const ex of sessionExercises) {
        if (ex.sets) {
          sessionVolume += ex.sets.reduce(
            (acc: number, s: { weight: number; reps: number }) => acc + (Number(s.weight) * s.reps),
            0
          );
        }
      }
      volumeBySession.push({ date: w.date, value: Math.round(sessionVolume) });
    }

    return NextResponse.json({
      exercises: uniqueExercises,
      stats: null,
      totalVolumeBySession: volumeBySession,
    });
  }

  // ── Running stats ─────────────────────────────────────────────────
  if (exerciseName === "CARRERA") {
    const cardioWorkouts = workouts.filter(
      w => w.type === "cardio" && w.total_cardio_distance != null && w.total_cardio_distance > 0
    );

    if (cardioWorkouts.length === 0) {
      return NextResponse.json({ exercises: [], stats: null, statsType: "running" });
    }

    let totalDistance = 0;
    let totalMinutes = 0;
    let totalCalories = 0;
    let hrSum = 0;
    let hrCount = 0;
    let paceSum = 0;
    let paceCount = 0;
    const distanceOverTime: { date: string; value: number }[] = [];
    const paceOverTime: { date: string; value: number }[] = [];
    const hrOverTime: { date: string; value: number }[] = [];
    const aggregatedZones: Record<string, number> = {};

    for (const w of cardioWorkouts) {
      totalDistance += w.total_cardio_distance ?? 0;
      totalMinutes += w.duration_minutes ?? 0;
      totalCalories += w.total_calories ?? 0;

      if (w.avg_heart_rate) {
        hrSum += w.avg_heart_rate;
        hrCount++;
      }

      if (w.avg_pace_seconds_per_km) {
        paceSum += w.avg_pace_seconds_per_km;
        paceCount++;
      }

      distanceOverTime.push({ date: w.date, value: Math.round((w.total_cardio_distance ?? 0) * 100) / 100 });

      if (w.avg_pace_seconds_per_km) {
        paceOverTime.push({ date: w.date, value: w.avg_pace_seconds_per_km });
      }

      if (w.avg_heart_rate) {
        hrOverTime.push({ date: w.date, value: w.avg_heart_rate });
      }

      if (w.hr_zone_seconds) {
        const zones = w.hr_zone_seconds as Record<string, number>;
        for (const [key, sec] of Object.entries(zones)) {
          aggregatedZones[key] = (aggregatedZones[key] ?? 0) + sec;
        }
      }
    }

    // Also include manual cardio exercises named CARRERA
    const manualCardioExercises = exercises?.filter(
      e => e.name === "CARRERA" || e.name === "Carrera" || e.name === "carrera"
    ) || [];

    for (const ex of manualCardioExercises) {
      if (!ex.sets) continue;
      const date = workoutDateMap[ex.workout_id];
      if (!date) continue;

      for (const s of ex.sets) {
        const distM = Number(s.distance_meters) || 0;
        const durS = Number(s.duration_seconds) || 0;
        const pace = Number(s.pace_seconds_per_km) || 0;
        const zone = Number(s.heart_rate_zone) || 0;

        if (distM > 0) {
          const distKm = distM / 1000;
          totalDistance += distKm;
          distanceOverTime.push({ date, value: Math.round(distKm * 100) / 100 });
          totalMinutes += Math.round(durS / 60);
        }
        if (pace > 0) { paceSum += pace; paceCount++; }
        if (zone > 0) {
          const key = `zone${zone}`;
          aggregatedZones[key] = (aggregatedZones[key] ?? 0) + durS;
        }
      }
    }

    return NextResponse.json({
      exercises: [],
      statsType: "running",
      stats: {
        type: "running",
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalMinutes,
        totalSessions: cardioWorkouts.length + manualCardioExercises.length,
        avgPaceSecondsPerKm: paceCount > 0 ? Math.round(paceSum / paceCount) : null,
        avgHeartRate: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
        totalCalories,
        distanceOverTime,
        paceOverTime,
        hrOverTime,
        hrZoneSeconds: Object.keys(aggregatedZones).length > 0 ? aggregatedZones : null,
      },
    });
  }

  // ── Strength stats (existing logic) ───────────────────────────────
  const targetExercises = exercises?.filter(e => e.name === exerciseName) || [];

  if (targetExercises.length === 0) {
    return NextResponse.json({ exercises: [], stats: null, statsType: "strength" });
  }

  let pr = 0;
  let totalVolume = 0;
  const volumeOverTime: { date: string; value: number }[] = [];
  const maxWeightOverTime: { date: string; value: number }[] = [];

  for (const ex of targetExercises) {
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
    statsType: "strength",
    stats: {
      type: "strength",
      pr,
      totalVolume,
      timesPerformed: targetExercises.length,
      volumeOverTime,
      maxWeightOverTime,
    },
  });
}
