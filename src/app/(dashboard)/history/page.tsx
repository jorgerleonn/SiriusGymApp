import { getWorkouts } from "@/lib/queries";
import { Dumbbell } from "lucide-react";

export default async function HistoryPage() {
  const workouts = await getWorkouts();

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-sirius-text mb-6 sm:mb-8">Historial</h1>

      {workouts.length === 0 ? (
        <div className="text-center py-10 sm:py-12 text-sirius-textMuted">
          <Dumbbell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm sm:text-base">No hay workouts todavía</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map((workout) => (
            <div key={workout.id} className="bg-sirius-surface border border-sirius-border rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-sirius-text">{workout.name}</h3>
                  <p className="text-xs sm:text-sm text-sirius-textMuted">
                    {new Date(workout.date).toLocaleDateString("es-ES", { 
                      weekday: "long", year: "numeric", month: "long", day: "numeric" 
                    })}
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 bg-sirius-accent/10 text-sirius-accent rounded-full text-xs sm:text-sm whitespace-nowrap">
                  {workout.exercises?.length || 0} ejercicios
                </span>
              </div>

              <div className="space-y-2">
                {workout.exercises?.map((ex: { name: string; sets?: { weight: number; reps: number }[] }, i: number) => {
                  const totalSets = ex.sets?.length || 0;
                  const totalVolume = ex.sets?.reduce((acc, s) => acc + (Number(s.weight) * s.reps), 0) || 0;
                  return (
                    <div key={i} className="flex justify-between text-xs sm:text-sm py-2 border-t border-sirius-border/50">
                      <span className="text-sirius-text truncate pr-2">{ex.name}</span>
                      <span className="text-sirius-textMuted whitespace-nowrap">
                        {totalSets} series • {totalVolume.toFixed(0)}kg
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}