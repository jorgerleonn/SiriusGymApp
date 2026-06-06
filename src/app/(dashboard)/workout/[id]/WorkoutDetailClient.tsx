"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateWorkout, deleteWorkout, saveAsTemplate } from "@/actions/workout";
import { X, Trash2, Pencil, Save, ArrowLeft, Dumbbell, Route, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { MStripe } from "@/components/ui/m-stripe";
import { CardioDetailView } from "@/components/cardio-detail-view";
import type { WorkoutType, ExerciseType } from "@/lib/types";

const MUSCLE_GROUPS = [
  "PECTORAL", "ESPALDA", "ESPALDA SUPERIOR", "ESPALDA INFERIOR", "HOMBROS", "BÍCEPS", "TRÍCEPS",
  "CUÁDRICEPS", "ISQUIOTIBIALES", "GLÚTEOS", "GEMELOS", "ABDOMEN", "TRAPECIO"
];

interface SetData {
  id?: string;
  weight?: number | null;
  reps?: number | null;
  rir?: number | null;
  rpe?: number | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  pace_seconds_per_km?: number | null;
  heart_rate_zone?: number | null;
  order_index?: number;
}

interface ExerciseData {
  id?: string;
  name: string;
  type?: ExerciseType;
  muscle_group?: string | null;
  sets: SetData[];
}

interface WorkoutData {
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
  route_data: [number, number][] | null;
  created_at: string;
  exercises: ExerciseData[];
}

interface Props {
  workout: WorkoutData;
}

export default function WorkoutDetailClient({ workout: initial }: Props) {
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutData>(() => ({
    ...initial,
    exercises: mergeDuplicateExercises(initial.exercises),
  }));
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingExercises, setExistingExercises] = useState<string[]>([]);
  const idCounter = useRef(0);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.exercises) setExistingExercises(data.exercises as string[]);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!workout) return;
    setSaving(true);

    const deduped = mergeDuplicateExercises(workout.exercises);

    const exercisesToSave = deduped
      .filter((ex) => ex.name.trim())
      .map((ex) => ({
        name: ex.name.trim(),
        type: ex.type || "strength",
        muscle_group: ex.muscle_group || undefined,
        sets: ex.sets
          .filter((s) => {
            if (ex.type === "cardio") return s.distance_meters && s.distance_meters > 0;
            return s.weight && s.weight > 0;
          })
          .map((s, setIndex) => {
            if (ex.type === "cardio") {
              return {
                distance_meters: Number(s.distance_meters) || 0,
                duration_seconds: Number(s.duration_seconds) || undefined,
                pace_seconds_per_km: Number(s.pace_seconds_per_km) || undefined,
                heart_rate_zone: Number(s.heart_rate_zone) || undefined,
                order_index: setIndex,
              };
            }
            return {
              weight: Number(s.weight) || 0,
              reps: Number(s.reps) || 0,
              rir: s.rir ? Number(s.rir) : undefined,
              rpe: s.rpe ? Number(s.rpe) : undefined,
              order_index: setIndex,
            };
          }),
      }))
      .filter((ex) => ex.sets.length > 0);

    const result = await updateWorkout(workout.id, workout.name, exercisesToSave, { date: workout.date });
    setSaving(false);

    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!workout || !confirm("¿ESTÁS SEGURO?")) return;
    const result = await deleteWorkout(workout.id);
    if (result.success) router.push("/history");
  };

  const handleSaveAsTemplate = async () => {
    if (!workout) return;
    const name = prompt("NOMBRE DE LA PLANTILLA:", workout.name);
    if (!name) return;
    await saveAsTemplate(workout.id, name);
  };

  const nextId = () => `n-${++idCounter.current}`;

  const addExercise = (type: ExerciseType = "strength") => {
    if (!workout) return;
    const id = nextId();
    setWorkout({
      ...workout,
      exercises: [
        ...workout.exercises,
        {
          id,
          name: "",
          type,
          sets: type === "cardio"
            ? [{ id: nextId(), distance_meters: 0, duration_seconds: 0, pace_seconds_per_km: 0, heart_rate_zone: 0 }]
            : [{ id: nextId(), weight: 0, reps: 0, rir: 0, rpe: 0 }],
        },
      ],
    });
  };

  const addSet = (exIndex: number) => {
    if (!workout) return;
    const newExercises = [...workout.exercises];
    const ex = newExercises[exIndex];
    const type = ex.type || "strength";
    const id = nextId();
    if (type === "cardio") {
      ex.sets.push({ id, distance_meters: 0, duration_seconds: 0, pace_seconds_per_km: 0, heart_rate_zone: 0 });
    } else {
      ex.sets.push({ id, weight: 0, reps: 0, rir: 0, rpe: 0 });
    }
    setWorkout({ ...workout, exercises: newExercises });
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    if (!workout) return;
    const newExercises = [...workout.exercises];
    newExercises[exIndex].sets.splice(setIndex, 1);
    setWorkout({ ...workout, exercises: newExercises });
  };

  const removeExercise = (exIndex: number) => {
    if (!workout) return;
    setWorkout({ ...workout, exercises: workout.exercises.filter((_, i) => i !== exIndex) });
  };

  const updateSetField = (exIndex: number, setIndex: number, field: string, value: number) => {
    if (!workout) return;
    const newExercises = [...workout.exercises];
    const set = newExercises[exIndex].sets[setIndex] as Record<string, unknown>;
    set[field] = value;
    setWorkout({ ...workout, exercises: newExercises });
  };

  function mergeDuplicateExercises(exercises: ExerciseData[]): ExerciseData[] {
    const seen = new Map<string, ExerciseData>();
    const counter = { value: 0 };

    for (const ex of exercises) {
      const key = ex.name.trim().toLowerCase();
      if (!key) {
        seen.set(`__empty_${ex.id || counter.value++}`, ex);
        continue;
      }

      if (seen.has(key)) {
        const existing = seen.get(key)!;
        existing.sets.push(...ex.sets);
      } else {
        seen.set(key, { ...ex, sets: [...ex.sets] });
      }
    }

    const merged = Array.from(seen.values());
    for (const ex of merged) {
      ex.sets = ex.sets.map((s, i) => ({ ...s, order_index: i }));
    }
    return merged;
  }

  const handleExerciseNameChange = (exIndex: number, newName: string) => {
    if (!workout) return;
    const newExercises = workout.exercises.map((ex, i) =>
      i === exIndex ? { ...ex, name: newName } : ex
    );

    const merged = mergeDuplicateExercises(newExercises);
    setWorkout({ ...workout, exercises: merged });
  };

  const updateExerciseField = (exIndex: number, field: string, value: string) => {
    if (!workout) return;
    const newExercises = [...workout.exercises];
    (newExercises[exIndex] as unknown as Record<string, unknown>)[field] = value || null;
    setWorkout({ ...workout, exercises: newExercises });
  };

  const formatPace = (seconds: number | null | undefined) => {
    if (!seconds) return "-";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-3xl">
      <MStripe className="mb-lg" />

      {/* Header */}
      <div className="mb-lg">
        <button
          onClick={() => router.push("/history")}
          className="flex items-center gap-xs text-caption text-muted hover:text-primary transition-colors mb-md"
        >
          <ArrowLeft className="w-4 h-4" />
          VOLVER
        </button>

        {isEditing ? (
          <input
            type="text"
            value={workout.name}
            onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
            className="w-full bg-surface-card border border-hairline rounded-none px-md py-sm text-display-sm font-display text-primary focus:border-primary outline-none"
          />
        ) : (
          <h1 className="text-display-md font-display text-primary tracking-[0]">{workout.name}</h1>
        )}

        <div className="flex items-center gap-md mt-sm">
          {isEditing ? (
            <input
              type="text"
              value={workout.date.split("T")[0].split("-").reverse().join("/")}
              onChange={(e) => {
                const parts = e.target.value.split("/");
                if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
                  setWorkout({ ...workout, date: `${parts[2]}-${parts[1]}-${parts[0]}` });
                } else {
                  setWorkout({ ...workout, date: e.target.value });
                }
              }}
              placeholder="DD/MM/AAAA"
              className="bg-canvas border border-hairline rounded-none px-sm py-xs text-caption text-primary focus:border-primary outline-none w-[140px]"
            />
          ) : (
            <span className="text-body-sm text-muted tracking-[0]">
              {new Date(workout.date).toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
          <span className={`text-caption tracking-[1px] px-xs py-[2px] border ${
            workout.type === "strength" ? "text-m-blue-light border-m-blue-light/30" :
            workout.type === "cardio" ? "text-m-red border-m-red/30" :
            "text-primary border-primary/30"
          }`}>
            {workout.type === "strength" ? "FUERZA" : workout.type === "cardio" ? "CARDIO" : "HÍBRIDO"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-md mb-xl flex-wrap">
        {isEditing ? (
          <>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-xs" />
              {saving ? "GUARDANDO..." : "GUARDAR"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              CANCELAR
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 mr-xs" />
              EDITAR
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-xs" />
              ELIMINAR
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSaveAsTemplate}>
              <Copy className="w-4 h-4 mr-xs" />
              GUARDAR PLANTILLA
            </Button>
          </>
        )}
      </div>

      {/* Cardio FIT-imported view */}
      {workout.type === "cardio" && workout.exercises.length === 0 && (
        <CardioDetailView workout={workout} />
      )}

      {/* Exercises (strength / hybrid / manual cardio) */}
      {workout.exercises.length > 0 && (
        <div className="space-y-lg">
          {workout.exercises.map((exercise, exIndex) => {
            const isCardio = exercise.type === "cardio";

            return (
              <div key={exercise.id || exIndex} className="bg-surface-card border border-hairline rounded-none p-lg">
                {/* Exercise Header */}
                <div className="flex justify-between items-center mb-md gap-md">
                  <div className="flex-1 flex items-center gap-md">
                    {isEditing ? (
                      <Combobox
                        value={exercise.name}
                        onChange={(value) => handleExerciseNameChange(exIndex, value)}
                        items={existingExercises}
                        placeholder="NOMBRE DEL EJERCICIO"
                      />
                    ) : (
                      <div className="flex items-center gap-md">
                        {isCardio ? (
                          <Route className="w-4 h-4 text-m-red" />
                        ) : (
                          <Dumbbell className="w-4 h-4 text-m-blue-light" />
                        )}
                        <h3 className="text-label-uppercase text-primary tracking-[1.5px]">{exercise.name}</h3>
                      </div>
                    )}
                    {(exercise.muscle_group && !isEditing) && (
                      <span className="text-caption text-muted tracking-[1px]">
                        {exercise.muscle_group}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <button onClick={() => removeExercise(exIndex)} className="text-muted hover:text-primary">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Muscle Group */}
                {isEditing && (
                  <div className="mb-md">
                    <select
                      value={exercise.muscle_group || ""}
                      onChange={(e) => updateExerciseField(exIndex, "muscle_group", e.target.value)}
                      className="bg-canvas border border-hairline rounded-none px-sm py-xs text-caption text-muted focus:border-primary outline-none w-full sm:w-auto tracking-[1px]"
                    >
                      <option value="">GRUPO MUSCULAR</option>
                      {MUSCLE_GROUPS.map((mg) => (
                        <option key={mg} value={mg}>{mg}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sets */}
                <div className="space-y-xs">
                  {isEditing ? (
                    <>
                      <div className={`hidden sm:grid text-caption text-muted px-xs mb-xs tracking-[1px]`}
                        style={{ gridTemplateColumns: isCardio ? "2rem 1fr 1fr 1fr 1fr 1.5rem" : "2rem 1fr 1fr 1fr 1fr 1.5rem" }}>
                        <span>#</span>
                        {isCardio ? (
                          <>
                            <span>DISTANCIA (M)</span>
                            <span>DURACIÓN (S)</span>
                            <span>RITMO (S/KM)</span>
                            <span>ZONA FC</span>
                          </>
                        ) : (
                          <>
                            <span>PESO</span>
                            <span>REPS</span>
                            <span>RIR</span>
                            <span>RPE</span>
                          </>
                        )}
                        <span></span>
                      </div>
                      {exercise.sets.map((set, setIndex) => (
                        <div key={set.id || setIndex}
                          className="grid gap-xs items-center"
                          style={{ gridTemplateColumns: "1.5rem 1fr 1fr 1fr 1fr 1.5rem" }}>
                          <span className="text-caption text-muted">#{setIndex + 1}</span>
                          {isCardio ? (
                            <>
                              <input type="number" value={set.distance_meters || ""}
                                onChange={(e) => updateSetField(exIndex, setIndex, "distance_meters", parseFloat(e.target.value) || 0)}
                                className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none" />
                              <input type="number" value={set.duration_seconds || ""}
                                onChange={(e) => updateSetField(exIndex, setIndex, "duration_seconds", parseFloat(e.target.value) || 0)}
                                className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none" />
                              <input type="number" value={set.pace_seconds_per_km || ""}
                                onChange={(e) => updateSetField(exIndex, setIndex, "pace_seconds_per_km", parseFloat(e.target.value) || 0)}
                                className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none" />
                              <input type="number" value={set.heart_rate_zone || ""} min="1" max="5"
                                onChange={(e) => updateSetField(exIndex, setIndex, "heart_rate_zone", parseInt(e.target.value) || 0)}
                                className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none" />
                            </>
                          ) : (
                            <>
                              <input type="number" value={set.weight || ""}
                                onChange={(e) => updateSetField(exIndex, setIndex, "weight", parseFloat(e.target.value) || 0)}
                                className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none" />
                              <input type="number" value={set.reps || ""}
                                onChange={(e) => updateSetField(exIndex, setIndex, "reps", parseInt(e.target.value) || 0)}
                                className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none" />
                              <input type="number" value={set.rir || ""} min="0" max="5"
                                onChange={(e) => updateSetField(exIndex, setIndex, "rir", parseInt(e.target.value) || 0)}
                                className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none" />
                              <input type="number" value={set.rpe || ""} min="0" max="10" step="0.5"
                                onChange={(e) => updateSetField(exIndex, setIndex, "rpe", parseFloat(e.target.value) || 0)}
                                className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none" />
                            </>
                          )}
                          <button onClick={() => removeSet(exIndex, setIndex)} className="text-muted hover:text-primary">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addSet(exIndex)}
                        className="text-caption text-muted hover:text-primary tracking-[1px] mt-xs">
                        + AÑADIR SERIE
                      </button>
                    </>
                  ) : (
                    /* View mode */
                    <>
                      <div className={`hidden sm:grid text-caption text-muted px-xs mb-xs tracking-[1px]`}
                        style={{ gridTemplateColumns: isCardio ? "2rem 1fr 1fr 1fr 1fr" : "2rem 1fr 1fr 1fr 1fr" }}>
                        <span>#</span>
                        {isCardio ? (
                          <>
                            <span>DISTANCIA</span>
                            <span>DURACIÓN</span>
                            <span>RITMO</span>
                            <span>ZONA FC</span>
                          </>
                        ) : (
                          <>
                            <span>PESO</span>
                            <span>REPS</span>
                            <span>RIR</span>
                            <span>RPE</span>
                          </>
                        )}
                      </div>
                      {exercise.sets.map((set, setIndex) => (
                        <div key={set.id || setIndex}
                          className="grid gap-xs items-center py-xxs"
                          style={{ gridTemplateColumns: "1.5rem 1fr 1fr 1fr 1fr" }}>
                          <span className="text-caption text-muted">#{setIndex + 1}</span>
                          {isCardio ? (
                            <>
                              <span className="text-body-sm text-primary text-center">
                                {set.distance_meters ? `${(set.distance_meters / 1000).toFixed(2)} km` : "-"}
                              </span>
                              <span className="text-body-sm text-primary text-center">
                                {set.duration_seconds ? formatPace(set.duration_seconds) : "-"}
                              </span>
                              <span className="text-body-sm text-primary text-center">
                                {set.pace_seconds_per_km ? formatPace(set.pace_seconds_per_km) + " /km" : "-"}
                              </span>
                              <span className="text-body-sm text-primary text-center">
                                {set.heart_rate_zone ? `Z${set.heart_rate_zone}` : "-"}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-body-sm text-primary text-center">{set.weight} kg</span>
                              <span className="text-body-sm text-primary text-center">{set.reps}</span>
                              <span className="text-body-sm text-muted text-center">
                                {set.rir != null && set.rir > 0 ? `${set.rir} RIR` : "-"}
                              </span>
                              <span className="text-body-sm text-muted text-center">
                                {set.rpe != null && set.rpe > 0 ? `${set.rpe} RPE` : "-"}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Exercise Buttons (editing only) */}
          {isEditing && (
            <div className="flex gap-px bg-hairline">
              <button
                onClick={() => addExercise("strength")}
                className="flex-1 py-md border border-hairline bg-surface-card text-muted hover:text-primary hover:bg-surface-elevated transition-colors text-label-uppercase tracking-[1.5px] flex items-center justify-center gap-sm"
              >
                <Dumbbell className="w-4 h-4" />
                + FUERZA
              </button>
              <button
                onClick={() => addExercise("cardio")}
                className="flex-1 py-md border border-hairline bg-surface-card text-muted hover:text-primary hover:bg-surface-elevated transition-colors text-label-uppercase tracking-[1.5px] flex items-center justify-center gap-sm"
              >
                <Route className="w-4 h-4" />
                + CARDIO
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
