import { getWorkouts } from "@/lib/queries";
import { Dumbbell, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const workouts = await getWorkouts();

  const totalWorkouts = workouts.length;
  const thisWeek = workouts.filter((w) => {
    const date = new Date(w.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  }).length;

  return (
    <div>
      {/* Header - Text on background, no container */}
      <div className="mb-10 pt-4">
        <h1 className="text-[2rem] font-bold text-space-spectral mb-2 tracking-[0.96px]">Dashboard</h1>
        <p className="text-space-spectral/60 text-[0.875rem]" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Bienvenido de vuelta</p>
      </div>

      {/* Stats - Grid with dividers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-space-ghost-border mb-8">
        <div className="bg-space-black p-6">
          <p className="text-[0.625rem] text-space-spectral/50 mb-1 tracking-[1px] uppercase">Total Workouts</p>
          <p className="text-[2rem] font-bold text-space-spectral tracking-[0.96px]">{totalWorkouts}</p>
        </div>
        <div className="bg-space-black p-6">
          <p className="text-[0.625rem] text-space-spectral/50 mb-1 tracking-[1px] uppercase">Esta Semana</p>
          <p className="text-[2rem] font-bold text-space-spectral tracking-[0.96px]">{thisWeek}</p>
        </div>
        <div className="bg-space-black p-6">
          <p className="text-[0.625rem] text-space-spectral/50 mb-1 tracking-[1px] uppercase">Último Workout</p>
          <p className="text-[1.5rem] font-bold text-space-spectral tracking-[0.96px]">
            {workouts[0]?.date ? new Date(workouts[0].date).toLocaleDateString("es-ES", { month: "short", day: "numeric" }) : "-"}
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mb-8">
        <Link href="/workout/new" className="inline-block px-6 py-3 bg-space-ghost border border-space-ghost-border rounded-ghost text-space-spectral hover:bg-[rgba(240,240,250,0.2)] transition-all duration-300 text-[0.75rem] font-bold tracking-[1.17px]">
          + Nuevo Entrenamiento
        </Link>
      </div>

      {/* Recent Workouts - List with dividers */}
      <div>
        <h2 className="text-[1rem] font-bold text-space-spectral mb-4 tracking-[0.96px]">Entrenamientos Recientes</h2>
        
        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className="w-12 h-12 text-space-spectral/30 mx-auto mb-4" />
            <p className="text-space-spectral/60 text-[0.875rem]" style={{ textTransform: 'none', letterSpacing: 'normal' }}>No hay workouts todavía</p>
            <Link href="/workout/new" className="text-space-spectral hover:underline inline-block mt-2 text-[0.875rem]" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
              Crea tu primer entrenamiento
            </Link>
          </div>
        ) : (
          <div className="space-y-px bg-space-ghost-border">
            {workouts.slice(0, 5).map((workout) => (
              <Link 
                key={workout.id} 
                href={`/history`} 
                className="block bg-space-black py-4 px-4 hover:bg-space-ghost transition-colors group"
              >
                <div className="flex justify-between items-center">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[0.8125rem] font-bold text-space-spectral tracking-[1.17px] truncate">{workout.name}</h3>
                    <p className="text-[0.625rem] text-space-spectral/50 mt-1" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                      {workout.exercises?.length || 0} ejercicios • {new Date(workout.date).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-space-spectral/50 group-hover:text-space-spectral transition-colors shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}