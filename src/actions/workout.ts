"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { WorkoutType, ExerciseType } from "@/lib/types";

interface StrengthSetInput {
  weight: number;
  reps: number;
  rir?: number;
  rpe?: number;
}

interface CardioSetInput {
  distance_meters: number;
  duration_seconds?: number;
  pace_seconds_per_km?: number;
  heart_rate_zone?: number;
}

interface ExerciseInput {
  name: string;
  type?: ExerciseType;
  muscle_group?: string;
  sets: (StrengthSetInput | CardioSetInput)[];
}

export async function createWorkout(
  name: string,
  exercises: ExerciseInput[],
  options?: { type?: WorkoutType; notes?: string; duration_minutes?: number }
) {
  const { userId } = await auth();
  if (!userId) return { error: "No autorizado" };
  if (!name.trim()) return { error: "El nombre es requerido" };

  const supabase = createSupabaseAdmin();

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      name: name.trim(),
      type: options?.type || "strength",
      notes: options?.notes || null,
      duration_minutes: options?.duration_minutes || null,
      date: new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (workoutError) {
    console.error("Error creating workout:", workoutError);
    return { error: workoutError.message };
  }

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    if (!ex.name.trim() || ex.sets.length === 0) continue;

    const { data: exercise, error: exError } = await supabase
      .from("exercises")
      .insert({
        workout_id: workout.id,
        name: ex.name.trim(),
        type: ex.type || "strength",
        muscle_group: ex.muscle_group || null,
        order_index: i,
      })
      .select()
      .single();

    if (exError || !exercise) {
      console.error("Error creating exercise:", exError);
      continue;
    }

    for (let j = 0; j < ex.sets.length; j++) {
      if (ex.type === "cardio") {
        const set = ex.sets[j] as CardioSetInput;
        if (!set.distance_meters || set.distance_meters <= 0) continue;
        const { error: setError } = await supabase.from("sets").insert({
          exercise_id: exercise.id,
          distance_meters: set.distance_meters,
          duration_seconds: set.duration_seconds || null,
          pace_seconds_per_km: set.pace_seconds_per_km || null,
          heart_rate_zone: set.heart_rate_zone || null,
          order_index: j,
        });
        if (setError) console.error("Error creating cardio set:", setError);
      } else {
        const set = ex.sets[j] as StrengthSetInput;
        if (!set.weight || set.weight <= 0) continue;
        const { error: setError } = await supabase.from("sets").insert({
          exercise_id: exercise.id,
          weight: set.weight,
          reps: set.reps || 0,
          rir: set.rir || null,
          rpe: set.rpe || null,
          order_index: j,
        });
        if (setError) console.error("Error creating strength set:", setError);
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/stats");

  return { success: true, workoutId: workout.id };
}

export async function deleteWorkout(workoutId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "No autorizado" };

  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/stats");

  return { success: true };
}

export async function updateWorkout(
  workoutId: string,
  name: string,
  exercises: ExerciseInput[],
  options?: { notes?: string; duration_minutes?: number }
) {
  const { userId } = await auth();
  if (!userId) return { error: "No autorizado" };
  if (!name.trim()) return { error: "El nombre es requerido" };

  const supabase = createSupabaseAdmin();

  const updateData: { name: string; notes?: string | null; duration_minutes?: number | null } = { name: name.trim() };
  if (options?.notes !== undefined) updateData.notes = options.notes;
  if (options?.duration_minutes !== undefined) updateData.duration_minutes = options.duration_minutes;

  const { error: updateError } = await supabase
    .from("workouts")
    .update(updateData)
    .eq("id", workoutId)
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error updating workout:", updateError);
    return { error: updateError.message };
  }

  const { data: existingExercises } = await supabase
    .from("exercises")
    .select("id")
    .eq("workout_id", workoutId);

  for (const exId of existingExercises?.map((e: { id: string }) => e.id) || []) {
    await supabase.from("exercises").delete().eq("id", exId);
  }

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    if (!ex.name.trim() || ex.sets.length === 0) continue;

    const { data: exercise, error: exError } = await supabase
      .from("exercises")
      .insert({
        workout_id: workoutId,
        name: ex.name.trim(),
        type: ex.type || "strength",
        muscle_group: ex.muscle_group || null,
        order_index: i,
      })
      .select()
      .single();

    if (exError || !exercise) {
      console.error("Error creating exercise:", exError);
      continue;
    }

    for (let j = 0; j < ex.sets.length; j++) {
      if (ex.type === "cardio") {
        const set = ex.sets[j] as CardioSetInput;
        if (!set.distance_meters || set.distance_meters <= 0) continue;
        await supabase.from("sets").insert({
          exercise_id: exercise.id,
          distance_meters: set.distance_meters,
          duration_seconds: set.duration_seconds || null,
          pace_seconds_per_km: set.pace_seconds_per_km || null,
          heart_rate_zone: set.heart_rate_zone || null,
          order_index: j,
        });
      } else {
        const set = ex.sets[j] as StrengthSetInput;
        if (!set.weight || set.weight <= 0) continue;
        await supabase.from("sets").insert({
          exercise_id: exercise.id,
          weight: set.weight,
          reps: set.reps || 0,
          rir: set.rir || null,
          rpe: set.rpe || null,
          order_index: j,
        });
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/stats");
  revalidatePath(`/workout/${workoutId}`);

  return { success: true };
}

export async function saveAsTemplate(
  workoutId: string,
  templateName?: string
) {
  const { userId } = await auth();
  if (!userId) return { error: "No autorizado" };

  const supabase = createSupabaseAdmin();

  const { data: workout } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", workoutId)
    .eq("user_id", userId)
    .single();

  if (!workout) return { error: "Workout no encontrado" };

  const name = templateName || workout.name;

  const { data: template, error: tmplError } = await supabase
    .from("workout_templates")
    .insert({
      user_id: userId,
      name: name.trim(),
      description: workout.notes,
      type: workout.type,
    })
    .select()
    .single();

  if (tmplError) return { error: tmplError.message };

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("workout_id", workoutId)
    .order("order_index", { ascending: true });

  if (exercises) {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const { data: sets } = await supabase
        .from("sets")
        .select("*")
        .eq("exercise_id", ex.id);

      const defaultReps = sets?.length ? (sets[0] as { reps: number | null }).reps || 10 : 10;
      const defaultWeight = sets?.length ? (sets[0] as { weight: number | null }).weight : null;

      await supabase.from("template_exercises").insert({
        template_id: template.id,
        name: ex.name,
        type: ex.type,
        muscle_group: ex.muscle_group,
        order_index: i,
        default_sets: sets?.length || 3,
        default_reps: defaultReps,
        default_weight: defaultWeight,
      });
    }
  }

  revalidatePath("/workout/new");
  return { success: true, templateId: template.id };
}

export async function deleteTemplate(templateId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "No autorizado" };

  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from("workout_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/workout/new");
  return { success: true };
}
