"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase";
import { updateWorkout, deleteWorkout } from "@/actions/workout";
import { Plus, X, Trash2, Pencil, Save, ArrowLeft } from "lucide-react";

interface Set {
  id: string;
  weight: number;
  reps: number;
  order_index: number;
}

interface Exercise {
  id: string;
  name: string;
  sets: Set[];
}

interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: Exercise[];
}

export default function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workoutId, setWorkoutId] = useState<string>("");

  useEffect(() => {
    if (params) {
      params.then(p => setWorkoutId(p.id));
    }
  }, [params]);

  useEffect(() => {
    if (isLoaded && user && workoutId) {
      const supabase = createSupabaseClient();
      supabase
        .from("workouts")
        .select(`
          *,
          exercises (
            *,
            sets (*)
          )
        `)
        .eq("id", workoutId)
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setWorkout(data);
          setLoading(false);
        });
    }
  }, [isLoaded, user, workoutId]);

  const handleSave = async () => {
    if (!workout) return;
    setSaving(true);

    const exercisesToSave = workout.exercises
      .filter(ex => ex.name.trim())
      .map((ex, exIndex) => ({
        name: ex.name.trim(),
        sets: ex.sets
          .filter(s => s.weight && s.reps)
          .map((s, setIndex) => ({
            weight: parseFloat(s.weight.toString()),
            reps: parseInt(s.reps.toString()),
            order_index: setIndex,
          })),
      }))
      .filter(ex => ex.sets.length > 0);

    const result = await updateWorkout(workout.id, workout.name, exercisesToSave);
    setSaving(false);

    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!workout || !confirm("¿Estás seguro de que quieres eliminar este entrenamiento?")) return;
    
    const result = await deleteWorkout(workout.id);
    if (result.success) {
      router.push("/history");
    }
  };

  const addExercise = () => {
    if (!workout) return;
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, { id: `new-${Date.now()}`, name: "", sets: [{ id: `new-set-${Date.now()}`, weight: 0, reps: 0, order_index: 0 }] }]
    });
  };

  const addSet = (exIndex: number) => {
    if (!workout) return;
    const newExercises = [...workout.exercises];
    newExercises[exIndex].sets.push({ id: `new-set-${Date.now()}`, weight: 0, reps: 0, order_index: newExercises[exIndex].sets.length });
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
    const newExercises = workout.exercises.filter((_, i) => i !== exIndex);
    setWorkout({ ...workout, exercises: newExercises });
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-space-spectral/50 text-[0.75rem] tracking-[1px] uppercase">Cargando...</div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-12">
        <p className="text-space-spectral/50">Entrenamiento no encontrado</p>
        <button onClick={() => router.push("/history")} className="text-space-spectral hover:underline mt-2">
          Volver al historial
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6 pt-4">
        <button 
          onClick={() => router.push("/history")}
          className="flex items-center gap-2 text-space-spectral/50 hover:text-space-spectral transition-colors text-[0.75rem] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        
        {isEditing ? (
          <input
            type="text"
            value={workout.name}
            onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
            className="w-full bg-space-black border border-space-ghost-border rounded-[4px] px-4 py-2 
              text-space-spectral text-[1.5rem] font-bold tracking-[0.96px] focus:border-space-ghost-border outline-none"
          />
        ) : (
          <h1 className="text-[2rem] font-bold text-space-spectral tracking-[0.96px]">{workout.name}</h1>
        )}
        
        <p className="text-[0.75rem] text-space-spectral/50 mt-2" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
          {new Date(workout.date).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-8">
        {isEditing ? (
          <>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-space-ghost border border-space-ghost-border rounded-ghost text-space-spectral hover:bg-[rgba(240,240,250,0.2)] transition-all text-[0.75rem] font-bold tracking-[1.17px]"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-space-spectral/50 hover:text-space-spectral transition-colors text-[0.75rem]"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-space-ghost border border-space-ghost-border rounded-ghost text-space-spectral hover:bg-[rgba(240,240,250,0.2)] transition-all text-[0.75rem] font-bold tracking-[1.17px]"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
            <button 
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-space-ghost-border rounded-[4px] text-space-spectral/50 hover:text-space-spectral transition-colors text-[0.75rem]"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </>
        )}
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {workout.exercises.map((exercise, exIndex) => (
          <div key={exercise.id} className="bg-space-black border border-space-ghost-border rounded-[4px] p-4">
            <div className="flex justify-between items-center mb-4 gap-2">
              {isEditing ? (
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => {
                    const newExercises = [...workout.exercises];
                    newExercises[exIndex].name = e.target.value;
                    setWorkout({ ...workout, exercises: newExercises });
                  }}
                  placeholder="NOMBRE DEL EJERCICIO"
                  className="flex-1 min-w-0 bg-space-black border border-space-ghost-border rounded-[4px] px-3 py-2 
                    text-space-spectral placeholder:text-space-spectral/30 focus:border-space-ghost-border outline-none text-[0.8125rem] tracking-[1.17px]"
                />
              ) : (
                <h3 className="text-[0.8125rem] font-bold text-space-spectral tracking-[1.17px]">{exercise.name}</h3>
              )}
              {isEditing && (
                <button onClick={() => removeExercise(exIndex)} className="p-2 text-space-spectral/50 hover:text-space-spectral">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {exercise.sets.map((set, setIndex) => (
                <div key={set.id} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                  <span className="text-[0.625rem] text-space-spectral/50 w-6">#{setIndex + 1}</span>
                  {isEditing ? (
                    <>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => {
                          const newExercises = [...workout.exercises];
                          newExercises[exIndex].sets[setIndex].weight = parseFloat(e.target.value) || 0;
                          setWorkout({ ...workout, exercises: newExercises });
                        }}
                        className="bg-space-black border border-space-ghost-border rounded-[4px] px-2 py-1 
                          text-space-spectral text-center text-[0.8125rem] focus:border-space-ghost-border outline-none"
                      />
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => {
                          const newExercises = [...workout.exercises];
                          newExercises[exIndex].sets[setIndex].reps = parseInt(e.target.value) || 0;
                          setWorkout({ ...workout, exercises: newExercises });
                        }}
                        className="bg-space-black border border-space-ghost-border rounded-[4px] px-2 py-1 
                          text-space-spectral text-center text-[0.8125rem] focus:border-space-ghost-border outline-none"
                      />
                      <button onClick={() => removeSet(exIndex, setIndex)} className="p-1 text-space-spectral/50 hover:text-space-spectral">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[0.8125rem] text-space-spectral tracking-[1.17px] text-center">{set.weight} kg</span>
                      <span className="text-[0.8125rem] text-space-spectral/70 text-center">{set.reps} reps</span>
                      <span></span>
                    </>
                  )}
                </div>
              ))}
              {isEditing && (
                <button onClick={() => addSet(exIndex)} className="text-[0.625rem] text-space-spectral/70 hover:text-space-spectral tracking-[1px] uppercase">
                  + Añadir serie
                </button>
              )}
            </div>
          </div>
        ))}

        {isEditing && (
          <button onClick={addExercise} className="w-full py-4 border border-space-ghost-border 
            rounded-[4px] text-space-spectral/50 hover:text-space-spectral hover:border-space-ghost-border transition-colors text-[0.8125rem] tracking-[1.17px] uppercase">
            + Añadir Ejercicio
          </button>
        )}
      </div>
    </div>
  );
}