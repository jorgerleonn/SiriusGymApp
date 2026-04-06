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
    <div className="max-w-2xl pt-4">
      <h1 className="text-[2rem] font-bold text-space-spectral mb-4 tracking-[0.96px]">Nuevo Entrenamiento</h1>
      <p className="text-[0.75rem] text-space-spectral/50 mb-8" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
        {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>

      {error && (
        <div className="mb-6 p-4 border border-space-ghost-border rounded-[4px] text-space-spectral/70 text-[0.75rem]">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-[0.625rem] text-space-spectral/50 mb-2 tracking-[1px] uppercase">Nombre del entrenamiento</label>
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="DÍA DE PECHO, PIERNA, ETC."
            className="w-full bg-space-black border border-space-ghost-border rounded-[4px] px-4 py-3 
              text-space-spectral placeholder:text-space-spectral/30 focus:border-space-ghost-border outline-none text-[0.8125rem] tracking-[1.17px]"
          />
        </div>

        {exercises.map((exercise, exIndex) => (
          <div key={exIndex} className="bg-space-black border border-space-ghost-border rounded-[4px] p-4">
            <div className="flex justify-between items-center mb-4 gap-2">
              <input
                type="text"
                value={exercise.name}
                onChange={(e) => {
                  const newEx = [...exercises];
                  newEx[exIndex].name = e.target.value;
                  setExercises(newEx);
                }}
                placeholder="NOMBRE DEL EJERCICIO"
                className="flex-1 min-w-0 bg-space-black border border-space-ghost-border rounded-[4px] px-3 py-2 
                  text-space-spectral placeholder:text-space-spectral/30 focus:border-space-ghost-border outline-none text-[0.8125rem] tracking-[1.17px]"
              />
              <button onClick={() => removeExercise(exIndex)} className="p-2 text-space-spectral/50 hover:text-space-spectral">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Header for desktop */}
              <div className="hidden sm:grid grid-cols-[2rem_1fr_1fr_auto] gap-2 text-[0.625rem] text-space-spectral/50 mb-1 px-1 tracking-[1px] uppercase">
                <span>Serie</span>
                <span>Peso (kg)</span>
                <span>Reps</span>
                <span></span>
              </div>
              
              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} className="grid grid-cols-[auto_1fr_1fr_auto] sm:grid-cols-[2rem_1fr_1fr_auto] gap-1 sm:gap-2 items-center">
                  <span className="text-[0.625rem] text-space-spectral/50 w-6 sm:w-auto">#{setIndex + 1}</span>
                  <input
                    type="number"
                    value={set.weight}
                    onChange={(e) => {
                      const newEx = [...exercises];
                      newEx[exIndex].sets[setIndex].weight = e.target.value;
                      setExercises(newEx);
                    }}
                    placeholder="0"
                    className="bg-space-black border border-space-ghost-border rounded-[4px] px-2 sm:px-3 py-1.5 sm:py-2 
                      text-space-spectral text-center text-[0.8125rem] focus:border-space-ghost-border outline-none"
                  />
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => {
                      const newEx = [...exercises];
                      newEx[exIndex].sets[setIndex].reps = e.target.value;
                      setExercises(newEx);
                    }}
                    placeholder="0"
                    className="bg-space-black border border-space-ghost-border rounded-[4px] px-2 sm:px-3 py-1.5 sm:py-2 
                      text-space-spectral text-center text-[0.8125rem] focus:border-space-ghost-border outline-none"
                  />
                  <button onClick={() => removeSet(exIndex, setIndex)} className="p-1 text-space-spectral/50 hover:text-space-spectral">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={() => addSet(exIndex)} className="text-[0.625rem] text-space-spectral/70 hover:text-space-spectral tracking-[1px] uppercase">
                + Añadir serie
              </button>
            </div>
          </div>
        ))}

        <button onClick={addExercise} className="w-full py-4 border border-space-ghost-border 
          rounded-[4px] text-space-spectral/50 hover:text-space-spectral hover:border-space-ghost-border transition-colors text-[0.8125rem] tracking-[1.17px] uppercase">
          + Añadir Ejercicio
        </button>

        <button onClick={handleSubmit} disabled={loading || !workoutName.trim()}
          className="w-full px-6 py-3 bg-space-ghost border border-space-ghost-border rounded-ghost text-space-spectral 
            hover:bg-[rgba(240,240,250,0.2)] transition-all duration-300 text-[0.75rem] font-bold tracking-[1.17px] uppercase disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Guardando..." : "Guardar Entrenamiento"}
        </button>
      </div>
    </div>
  );
}