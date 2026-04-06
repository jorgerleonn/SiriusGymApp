"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkout } from "@/actions/workout";
import { Plus, X } from "lucide-react";

export default function NewWorkoutPage() {
  const router = useRouter();
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<{ name: string; sets: { weight: string; reps: string }[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: [{ weight: "", reps: "" }] }]);
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets.push({ weight: "", reps: "" });
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
      .filter(ex => ex.name.trim())
      .map(ex => ({
        name: ex.name.trim(),
        sets: ex.sets
          .filter(s => s.weight && s.reps)
          .map(s => ({
            weight: parseFloat(s.weight),
            reps: parseInt(s.reps),
          })),
      }))
      .filter(ex => ex.sets.length > 0);

    setLoading(true);
    setError(null);

    const result = await createWorkout(workoutName, validExercises);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-sirius-text mb-1 sm:mb-2">Nuevo Entrenamiento</h1>
      <p className="text-sm sm:text-base text-sirius-textMuted mb-6 sm:mb-8">
        {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-sirius-danger/10 border border-sirius-danger/30 rounded-xl text-sirius-danger text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm text-sirius-textMuted mb-2">Nombre del entrenamiento</label>
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="Día de Pecho, Pierna, etc."
            className="w-full bg-sirius-surface border border-sirius-border rounded-xl px-3 sm:px-4 py-2 sm:py-3 
              text-sirius-text placeholder:text-sirius-textMuted focus:border-sirius-accent outline-none text-base"
          />
        </div>

        {exercises.map((exercise, exIndex) => (
          <div key={exIndex} className="bg-sirius-surface border border-sirius-border rounded-xl p-3 sm:p-4">
            <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
              <input
                type="text"
                value={exercise.name}
                onChange={(e) => {
                  const newEx = [...exercises];
                  newEx[exIndex].name = e.target.value;
                  setExercises(newEx);
                }}
                placeholder="Nombre del ejercicio"
                className="flex-1 min-w-0 bg-sirius-bg border border-sirius-border rounded-lg px-2 sm:px-3 py-2 
                  text-sirius-text placeholder:text-sirius-textMuted focus:border-sirius-accent outline-none text-sm sm:text-base"
              />
              <button onClick={() => removeExercise(exIndex)} className="p-1.5 sm:p-2 text-sirius-textMuted hover:text-sirius-danger shrink-0">
                <X className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-[2rem_1fr_1fr_auto] gap-2 text-xs text-sirius-textMuted mb-1 px-1">
                <span>Serie</span>
                <span>Peso (kg)</span>
                <span>Reps</span>
                <span></span>
              </div>
              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} className="grid grid-cols-[auto_1fr_1fr_auto] sm:grid-cols-[2rem_1fr_1fr_auto] gap-1 sm:gap-2 items-center">
                  <span className="text-sirius-textMuted text-xs sm:text-sm w-6 sm:w-auto">#{setIndex + 1}</span>
                  <div className="relative">
                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) => {
                        const newEx = [...exercises];
                        newEx[exIndex].sets[setIndex].weight = e.target.value;
                        setExercises(newEx);
                      }}
                      placeholder="kg"
                      className="w-full bg-sirius-bg border border-sirius-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 
                        text-sirius-text text-center text-sm focus:border-sirius-accent outline-none"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sirius-textMuted text-xs sm:hidden">kg</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) => {
                        const newEx = [...exercises];
                        newEx[exIndex].sets[setIndex].reps = e.target.value;
                        setExercises(newEx);
                      }}
                      placeholder="reps"
                      className="w-full bg-sirius-bg border border-sirius-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 
                        text-sirius-text text-center text-sm focus:border-sirius-accent outline-none"
                    />
                  </div>
                  <button onClick={() => removeSet(exIndex, setIndex)} className="p-1 text-sirius-textMuted hover:text-sirius-danger">
                    <X className="w-3 sm:w-4 h-3 sm:h-4" />
                  </button>
                </div>
              ))}
              <button onClick={() => addSet(exIndex)} className="text-xs sm:text-sm text-sirius-accent hover:underline">
                + Añadir serie
              </button>
            </div>
          </div>
        ))}

        <button onClick={addExercise} className="w-full py-3 sm:py-4 border-2 border-dashed border-sirius-border 
          rounded-xl text-sirius-textMuted hover:border-sirius-accent/50 hover:text-sirius-accent transition-colors text-sm sm:text-base">
          + Añadir Ejercicio
        </button>

        <button onClick={handleSubmit} disabled={loading || !workoutName.trim()}
          className="w-full bg-sirius-accent text-sirius-bg font-semibold py-3 sm:py-4 rounded-xl 
            hover:bg-sirius-star transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
          {loading ? "Guardando..." : "Guardar Entrenamiento"}
        </button>
      </div>
    </div>
  );
}