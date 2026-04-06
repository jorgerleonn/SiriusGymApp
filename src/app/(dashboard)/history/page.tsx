import { getWorkouts } from "@/lib/queries";
import { Dumbbell } from "lucide-react";
import Link from "next/link";

export default async function HistoryPage() {
  const workouts = await getWorkouts();

  return (
    <div>
      <h1 className="text-[2rem] font-bold text-space-spectral mb-10 pt-4 tracking-[0.96px]">Historial</h1>

      {workouts.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="w-12 h-12 text-space-spectral/30 mx-auto mb-4" />
          <p className="text-space-spectral/60 text-[0.875rem]" style={{ textTransform: 'none', letterSpacing: 'normal' }}>No hay workouts todavía</p>
        </div>
      ) : (
        <div className="space-y-px bg-space-ghost-border">
          {workouts.map((workout) => (
            <Link key={workout.id} href={`/workout/${workout.id}`} className="block bg-space-black hover:bg-space-ghost transition-colors">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-[0.8125rem] font-bold text-space-spectral tracking-[1.17px]">{workout.name}</h3>
                    <p className="text-[0.625rem] text-space-spectral/50 mt-1" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                      {new Date(workout.date).toLocaleDateString("es-ES", { 
                        weekday: "long", year: "numeric", month: "long", day: "numeric" 
                      })}
                    </p>
                  </div>
                  <span className="self-start px-3 py-1 bg-space-ghost text-space-spectral/70 rounded-[4px] text-[0.625rem] tracking-[1px] uppercase whitespace-nowrap">
                    {workout.exercises?.length || 0} ejercicios
                  </span>
                </div>

                <div className="space-y-px bg-space-ghost-border">
                  {workout.exercises?.map((ex: { name: string; sets?: { weight: number; reps: number }[] }, i: number) => {
                    const totalSets = ex.sets?.length || 0;
                    const totalVolume = ex.sets?.reduce((acc, s) => acc + (Number(s.weight) * s.reps), 0) || 0;
                    return (
                      <div key={i} className="flex justify-between bg-space-black py-2 px-2">
                        <span className="text-[0.75rem] text-space-spectral tracking-[1.17px] truncate pr-2">{ex.name}</span>
                        <span className="text-[0.625rem] text-space-spectral/50 whitespace-nowrap">
                          {totalSets} series • {totalVolume.toFixed(0)}kg
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}