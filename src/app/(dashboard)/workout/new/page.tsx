"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createWorkout } from "@/actions/workout";
import type { WorkoutType, ExerciseType, WorkoutTemplate } from "@/lib/types";
import { X, Dumbbell, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { MStripe } from "@/components/ui/m-stripe";
import { CardioDropzone } from "@/components/cardio-dropzone";

const MUSCLE_GROUPS = [
  "PECTORAL", "ESPALDA", "ESPALDA SUPERIOR", "ESPALDA INFERIOR", "HOMBROS", "BÍCEPS", "TRÍCEPS",
  "CUÁDRICEPS", "ISQUIOTIBIALES", "GLÚTEOS", "GEMELOS", "ABDOMEN", "TRAPECIO"
];

interface SetForm {
  weight: string;
  reps: string;
  rir: string;
  rpe: string;
  distance_meters: string;
  duration_seconds: string;
  pace_seconds_per_km: string;
  heart_rate_zone: string;
}

interface ExerciseForm {
  name: string;
  type: ExerciseType;
  muscle_group: string;
  sets: SetForm[];
}

export default function NewWorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  const [workoutType, setWorkoutType] = useState<WorkoutType>("strength");
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<ExerciseForm[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [existingExercises, setExistingExercises] = useState<string[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/templates").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setTemplates(data as WorkoutTemplate[]);
    });
  }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.exercises) setExistingExercises(data.exercises as string[]);
      })
      .catch(() => {});
  }, []);

  const templateApplied = useRef(false);

  useEffect(() => {
    if (!templateId || templates.length === 0 || templateApplied.current) return;
    templateApplied.current = true;
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;

    const timer = setTimeout(() => {
      setWorkoutType(tmpl.type);
      setWorkoutName(tmpl.name);
      setExercises(
        tmpl.exercises.map((ex) => ({
          name: ex.name,
          type: ex.type,
          muscle_group: ex.muscle_group || "",
          sets: Array.from({ length: ex.default_sets }, () => ({
            weight: ex.default_weight?.toString() || "",
            reps: ex.default_reps.toString(),
            rir: "",
            rpe: "",
            distance_meters: "",
            duration_seconds: "",
            pace_seconds_per_km: "",
            heart_rate_zone: "",
          })),
        }))
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [templateId, templates]);

  const emptySet = (type: ExerciseType): SetForm => {
    if (type === "cardio") {
      return { weight: "", reps: "", rir: "", rpe: "", distance_meters: "", duration_seconds: "", pace_seconds_per_km: "", heart_rate_zone: "" };
    }
    return { weight: "", reps: "", rir: "", rpe: "", distance_meters: "", duration_seconds: "", pace_seconds_per_km: "", heart_rate_zone: "" };
  };

  const addExercise = (type: ExerciseType = "strength") => {
    setExercises([...exercises, { name: "", type, muscle_group: "", sets: [emptySet(type)] }]);
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets.push(emptySet(newExercises[exerciseIndex].type));
    setExercises(newExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets.splice(setIndex, 1);
    setExercises(newExercises);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!workoutName.trim()) return;

    const validExercises = exercises
      .filter((ex) => ex.name.trim())
      .map((ex) => ({
        name: ex.name.trim(),
        type: ex.type,
        muscle_group: ex.muscle_group || undefined,
        sets: ex.sets
          .filter((s) => {
            if (ex.type === "cardio") return s.distance_meters;
            return s.weight;
          })
          .map((s) => {
            if (ex.type === "cardio") {
              return {
                distance_meters: parseFloat(s.distance_meters) || 0,
                duration_seconds: parseInt(s.duration_seconds) || undefined,
                pace_seconds_per_km: parseInt(s.pace_seconds_per_km) || undefined,
                heart_rate_zone: parseInt(s.heart_rate_zone) || undefined,
              };
            }
            return {
              weight: parseFloat(s.weight) || 0,
              reps: parseInt(s.reps) || 0,
              rir: s.rir ? parseInt(s.rir) : undefined,
              rpe: s.rpe ? parseFloat(s.rpe) : undefined,
            };
          }),
      }))
      .filter((ex) => ex.sets.length > 0);

    setLoading(true);
    setError(null);

    const result = await createWorkout(workoutName, validExercises, {
      type: workoutType,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
  };

  const updateExerciseField = (index: number, field: keyof ExerciseForm, value: string | ExerciseType) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value as never;
    setExercises(newExercises);
  };

  const updateSetField = (exIndex: number, setIndex: number, field: keyof SetForm, value: string) => {
    const newExercises = [...exercises];
    newExercises[exIndex].sets[setIndex][field] = value;
    setExercises(newExercises);
  };

  const selectTemplate = (tmpl: WorkoutTemplate) => {
    setWorkoutType(tmpl.type);
    setWorkoutName(tmpl.name);
    setExercises(
      tmpl.exercises.map((ex) => ({
        name: ex.name,
        type: ex.type,
        muscle_group: ex.muscle_group || "",
        sets: Array.from({ length: ex.default_sets }, () => ({
          weight: ex.default_weight?.toString() || "",
          reps: ex.default_reps.toString(),
          rir: "",
          rpe: "",
          distance_meters: "",
          duration_seconds: "",
          pace_seconds_per_km: "",
          heart_rate_zone: "",
        })),
      }))
    );
    setShowTemplatePicker(false);
  };

  return (
    <div className="max-w-3xl pt-md">
      <MStripe className="mb-lg" />

      <h1 className="text-display-md font-display text-primary tracking-[0]">Nuevo Entrenamiento</h1>
      <p className="text-body-md text-muted mt-xs mb-xl">
        {new Date().toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {/* Template Picker Modal */}
      {showTemplatePicker && templates.length > 0 && (
        <div className="fixed inset-0 bg-canvas/90 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-card border border-hairline p-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-lg">
              <h3 className="text-title-md font-display text-primary tracking-[0]">SELECCIONAR PLANTILLA</h3>
              <button onClick={() => setShowTemplatePicker(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-px bg-hairline">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => selectTemplate(tmpl)}
                  className="w-full text-left bg-surface-card hover:bg-surface-elevated transition-colors p-lg"
                >
                  <h4 className="text-label-uppercase text-primary tracking-[1.5px]">{tmpl.name}</h4>
                  {tmpl.description && (
                    <p className="text-body-sm text-muted mt-xxs tracking-[0]">{tmpl.description}</p>
                  )}
                  <p className="text-caption text-muted mt-xs tracking-[1px]">
                    {tmpl.type === "strength" ? "FUERZA" : tmpl.type === "cardio" ? "CARDIO" : "HÍBRIDO"} · {tmpl.exercises?.length || 0} EJERCICIOS
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-lg p-md border border-m-red/50 text-caption text-m-red">
          {error}
        </div>
      )}

      <div className="space-y-lg">
        {/* Workout Type Selector */}
        <div className="flex gap-px bg-hairline">
          {(["strength", "cardio", "hybrid"] as WorkoutType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setWorkoutType(type);
                if (exercises.length === 0) {
                  addExercise(type === "hybrid" ? "strength" : type);
                }
              }}
              className={`flex-1 p-md text-label-uppercase tracking-[1.5px] transition-colors rounded-none ${
                workoutType === type
                  ? "bg-surface-card text-primary border-b-2 border-primary"
                  : "bg-canvas text-muted hover:text-primary hover:bg-surface-soft"
              }`}
            >
              {type === "strength" ? "FUERZA" : type === "cardio" ? "CARDIO" : "HÍBRIDO"}
            </button>
          ))}
        </div>

        {/* Template / From Scratch Selector */}
        <div className="flex gap-md items-center">
          {templates.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplatePicker(true)}
            >
              USAR PLANTILLA
            </Button>
          )}
          {templateId && (
            <span className="text-caption text-m-blue-light tracking-[1px]">
              PLANTILLA CARGADA
            </span>
          )}
        </div>

        {/* Workout Name */}
        <div>
          <label className="block text-caption text-muted mb-xs tracking-[1px] uppercase">
            Nombre del Entrenamiento
          </label>
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder={workoutType === "strength" ? "DÍA DE PECHO" : workoutType === "cardio" ? "RODADA LARGA" : "FULL BODY + CARDIO"}
            className="w-full bg-surface-card border border-hairline rounded-none px-md py-sm text-primary placeholder:text-muted/50 focus:border-primary outline-none text-body-md tracking-[0]"
          />
        </div>

        {/* Exercises */}
        {exercises.map((exercise, exIndex) => (
          <div key={exIndex} className="bg-surface-card border border-hairline rounded-none p-lg">
            {/* Exercise Header */}
            <div className="flex justify-between items-center mb-md gap-md">
              <div className="flex-1 flex flex-col sm:flex-row gap-sm">
                <Combobox
                  value={exercise.name}
                  onChange={(value) => updateExerciseField(exIndex, "name", value)}
                  items={existingExercises}
                  placeholder="NOMBRE DEL EJERCICIO"
                />

                {/* Type toggle for hybrid */}
                {workoutType === "hybrid" && (
                  <div className="flex">
                    <button
                      onClick={() => updateExerciseField(exIndex, "type", "strength")}
                      className={`px-sm py-xs text-caption tracking-[1px] border ${
                        exercise.type === "strength"
                          ? "border-m-blue-light text-m-blue-light bg-m-blue-light/10"
                          : "border-hairline text-muted"
                      }`}
                    >
                      <Dumbbell className="w-3 h-3 inline mr-1" />
                      FUERZA
                    </button>
                    <button
                      onClick={() => updateExerciseField(exIndex, "type", "cardio")}
                      className={`px-sm py-xs text-caption tracking-[1px] border ${
                        exercise.type === "cardio"
                          ? "border-m-red text-m-red bg-m-red/10"
                          : "border-hairline text-muted"
                      }`}
                    >
                      <Route className="w-3 h-3 inline mr-1" />
                      CARDIO
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => removeExercise(exIndex)} className="p-xs text-muted hover:text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Muscle Group */}
            <div className="mb-md">
              <select
                value={exercise.muscle_group}
                onChange={(e) => updateExerciseField(exIndex, "muscle_group", e.target.value)}
                className="bg-canvas border border-hairline rounded-none px-sm py-xs text-caption text-muted focus:border-primary outline-none w-full sm:w-auto tracking-[1px]"
              >
                <option value="">GRUPO MUSCULAR</option>
                {MUSCLE_GROUPS.map((mg) => (
                  <option key={mg} value={mg}>{mg}</option>
                ))}
              </select>
            </div>

            {/* Sets */}
            <div className="space-y-xs">
              {/* Header */}
              <div className="hidden sm:grid text-caption text-muted px-xs mb-xs tracking-[1px]"
                style={
                  exercise.type === "cardio"
                    ? { gridTemplateColumns: "2rem 1fr 1fr 1fr 1.5rem" }
                    : { gridTemplateColumns: "2rem 1fr 1fr 1fr 1fr 1.5rem" }
                }
              >
                <span>#</span>
                {exercise.type === "cardio" ? (
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
                <div
                  key={setIndex}
                  className="grid gap-xs items-center"
                  style={
                    exercise.type === "cardio"
                      ? { gridTemplateColumns: "1.5rem 1fr 1fr 1fr 1fr 1.5rem" }
                      : { gridTemplateColumns: "1.5rem 1fr 1fr 1fr 1fr 1.5rem" }
                  }
                >
                  <span className="text-caption text-muted">#{setIndex + 1}</span>

                  {exercise.type === "cardio" ? (
                    <>
                      <input
                        type="number"
                        value={set.distance_meters}
                        onChange={(e) => updateSetField(exIndex, setIndex, "distance_meters", e.target.value)}
                        placeholder="0"
                        className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none"
                      />
                      <input
                        type="number"
                        value={set.duration_seconds}
                        onChange={(e) => updateSetField(exIndex, setIndex, "duration_seconds", e.target.value)}
                        placeholder="-"
                        className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none"
                      />
                      <input
                        type="number"
                        value={set.pace_seconds_per_km}
                        onChange={(e) => updateSetField(exIndex, setIndex, "pace_seconds_per_km", e.target.value)}
                        placeholder="-"
                        className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none"
                      />
                      <select
                        value={set.heart_rate_zone}
                        onChange={(e) => updateSetField(exIndex, setIndex, "heart_rate_zone", e.target.value)}
                        className="bg-canvas border border-hairline rounded-none px-xs py-xs text-caption text-muted text-center focus:border-primary outline-none"
                      >
                        <option value="">ZONA</option>
                        {[1, 2, 3, 4, 5].map((z) => (
                          <option key={z} value={z}>Z{z}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSetField(exIndex, setIndex, "weight", e.target.value)}
                        placeholder="0"
                        className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none"
                      />
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSetField(exIndex, setIndex, "reps", e.target.value)}
                        placeholder="0"
                        className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none"
                      />
                      <input
                        type="number"
                        value={set.rir}
                        onChange={(e) => updateSetField(exIndex, setIndex, "rir", e.target.value)}
                        placeholder="-"
                        min="0"
                        max="5"
                        className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none"
                      />
                      <input
                        type="number"
                        value={set.rpe}
                        onChange={(e) => updateSetField(exIndex, setIndex, "rpe", e.target.value)}
                        placeholder="-"
                        min="0"
                        max="10"
                        step="0.5"
                        className="bg-canvas border border-hairline rounded-none px-xs py-xs text-primary text-center text-body-sm focus:border-primary outline-none"
                      />
                    </>
                  )}

                  <button onClick={() => removeSet(exIndex, setIndex)} className="p-xs text-muted hover:text-primary">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addSet(exIndex)}
                className="text-caption text-muted hover:text-primary tracking-[1px] mt-xs"
              >
                + AÑADIR SERIE
              </button>
            </div>
          </div>
        ))}

        {/* Cardio .fit Upload */}
        {(workoutType === "cardio" || workoutType === "hybrid") && (
          <div className="bg-surface-card border border-hairline rounded-none p-lg">
            <h3 className="text-caption text-muted mb-sm tracking-[1.5px] uppercase">IMPORTAR .fit</h3>
            <CardioDropzone />
          </div>
        )}

        {/* Add Exercise Buttons */}
        <div className="flex gap-px bg-hairline">
          <button
            onClick={() => addExercise("strength")}
            className="flex-1 py-md border border-hairline bg-surface-card text-muted hover:text-primary hover:bg-surface-elevated transition-colors text-label-uppercase tracking-[1.5px] flex items-center justify-center gap-sm"
          >
            <Dumbbell className="w-4 h-4" />
            + EJERCICIO FUERZA
          </button>
          {(workoutType === "cardio" || workoutType === "hybrid") && (
            <button
              onClick={() => addExercise("cardio")}
              className="flex-1 py-md border border-hairline bg-surface-card text-muted hover:text-primary hover:bg-surface-elevated transition-colors text-label-uppercase tracking-[1.5px] flex items-center justify-center gap-sm"
            >
              <Route className="w-4 h-4" />
              + EJERCICIO CARDIO
            </button>
          )}
        </div>

        {/* Submit */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={loading || !workoutName.trim()}
          className="w-full"
        >
          {loading ? "GUARDANDO..." : "GUARDAR ENTRENAMIENTO"}
        </Button>
      </div>
    </div>
  );
}
