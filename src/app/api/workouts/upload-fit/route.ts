import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { parseFitFile } from "@/services/fitParser";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".fit")) {
      return NextResponse.json({ error: "Solo se aceptan archivos .fit" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength < 12) {
      return NextResponse.json({ error: "Archivo .fit inválido o corrupto" }, { status: 400 });
    }

    const ageStr = formData.get("age") as string | null;
    const userAge = ageStr ? parseInt(ageStr, 10) : 35;

    let parsed;
    try {
      parsed = await parseFitFile(bytes, userAge);
    } catch (parseErr) {
      return NextResponse.json(
        { error: `Error al parsear archivo .fit: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}` },
        { status: 422 }
      );
    }

    const { session, distanceKm, movingTimeMinutes, paceSecondsPerKm, hrZoneSeconds, route } = parsed;
    const records = parsed.records;

    const dateOnly = session.startTime.split("T")[0] ?? new Date().toISOString().split("T")[0];


    const hrZoneSummary = [
      hrZoneSeconds.zone1,
      hrZoneSeconds.zone2,
      hrZoneSeconds.zone3,
      hrZoneSeconds.zone4,
      hrZoneSeconds.zone5,
    ];

    const dominantZone = hrZoneSummary.indexOf(Math.max(...hrZoneSummary)) + 1;

    const heartRateData = records
      .filter((r) => r.heartRate !== null)
      .map((r) => ({
        t: r.timestamp - records[0].timestamp,
        v: r.heartRate,
      }));

    const supabase = createSupabaseAdmin();

    const { data: workout, error: wErr } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        name: "CARRERA",
        date: dateOnly,
        type: "cardio",
        duration_minutes: movingTimeMinutes,
        total_cardio_distance: distanceKm,
        avg_heart_rate: session.avgHeartRate,
        max_heart_rate: session.maxHeartRate,
        avg_pace_seconds_per_km: paceSecondsPerKm,
        hr_zone_seconds: hrZoneSeconds,
        heart_rate_data: heartRateData,
        route_data: route.length > 2 ? route : null,
        total_calories: session.totalCalories,
        notes: [

          `Importado de archivo .fit`,
          distanceKm > 0 ? `${distanceKm.toFixed(2)} km` : null,
          paceSecondsPerKm
            ? `Ritmo ${Math.floor(paceSecondsPerKm / 60)}:${(paceSecondsPerKm % 60).toString().padStart(2, "0")}/km`
            : null,
          session.avgHeartRate ? `FC media ${session.avgHeartRate} lpm` : null,
          `Zona dominante: ${dominantZone}`,
        ]
          .filter(Boolean)
          .join(" • "),
      })
      .select()
      .single();

    if (wErr || !workout) {
      return NextResponse.json(
        { error: `Error al guardar entrenamiento: ${wErr?.message ?? "unknown"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      workout: {
        id: workout.id,
        name: workout.name,
        date: dateOnly,
        distanceKm,
        movingTimeMinutes,
        pace: paceSecondsPerKm,
        avgHeartRate: session.avgHeartRate,
        maxHeartRate: session.maxHeartRate,
        hrZones: hrZoneSeconds,
      },
    });
  } catch (err) {
    console.error("FIT upload error:", err);
    return NextResponse.json(
      { error: `Error interno del servidor: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
