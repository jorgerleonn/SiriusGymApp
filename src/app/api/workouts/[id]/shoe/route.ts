import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { shoeId } = body;

  const supabase = createSupabaseAdmin();

// 1. Get the workout and its total distance
  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("total_cardio_distance, shoe_id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (workoutError || !workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id")
    .eq("workout_id", id)
    .eq("type", "cardio");

  let sessionDistanceKm = workout.total_cardio_distance || 0;
  
  if (exercises) {
    const exIds = exercises.map(e => e.id);
    const { data: sets } = await supabase
      .from("sets")
      .select("distance_meters")
      .in("exercise_id", exIds);
    
    const manualDistanceMeters = sets?.reduce((acc, s) => acc + (Number(s.distance_meters) || 0), 0) || 0;
    sessionDistanceKm += manualDistanceMeters / 1000;
  }

  const oldShoeId = workout.shoe_id;

  // 2. Update workout with new shoeId
  const { error: updateError } = await supabase
    .from("workouts")
    .update({ shoe_id: shoeId })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 3. Update shoe distances
  // Subtract from old shoe
  if (oldShoeId) {
    const { data: oldShoe } = await supabase.from("shoes").select("total_distance").eq("id", oldShoeId).single();
    if (oldShoe) {
      await supabase
        .from("shoes")
        .update({ total_distance: Math.max(0, (oldShoe.total_distance || 0) - sessionDistanceKm) })
        .eq("id", oldShoeId);
    }
  }

  // Add to new shoe
  if (shoeId) {
    const { data: newShoe } = await supabase.from("shoes").select("total_distance").eq("id", shoeId).single();
    if (newShoe) {
      await supabase
        .from("shoes")
        .update({ total_distance: (newShoe.total_distance || 0) + sessionDistanceKm })
        .eq("id", shoeId);
    }
  }

  return NextResponse.json({ success: true });
}
