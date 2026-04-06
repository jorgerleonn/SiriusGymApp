"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createWorkout(name: string, exercises: { name: string; sets: { weight: number; reps: number }[] }[]) {
  const { userId } = await auth();
  if (!userId) return { error: "No autorizado" };

  if (!name.trim()) return { error: "El nombre es requerido" };

  const supabase = createSupabaseAdmin();

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({ user_id: userId, name: name.trim(), date: new Date().toISOString().split("T")[0] })
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
      .insert({ workout_id: workout.id, name: ex.name.trim(), order_index: i })
      .select()
      .single();

    if (exError || !exercise) {
      console.error("Error creating exercise:", exError);
      continue;
    }

    for (let j = 0; j < ex.sets.length; j++) {
      const set = ex.sets[j];
      if (set.weight <= 0 || set.reps <= 0) continue;

      const { error: setError } = await supabase.from("sets").insert({
        exercise_id: exercise.id,
        weight: set.weight,
        reps: set.reps,
        order_index: j,
      });

      if (setError) {
        console.error("Error creating set:", setError);
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
