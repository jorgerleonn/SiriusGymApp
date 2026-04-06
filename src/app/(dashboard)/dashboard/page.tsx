import { getWorkouts } from "@/lib/queries";
import { Dumbbell, TrendingUp, Calendar, ChevronRight } from "lucide-react";
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
    <div className="max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-sirius-text mb-1 sm:mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-sirius-textMuted">Bienvenido de vuelta</p>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-sirius-surface border border-sirius-border rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-sirius-accent/10 rounded-xl shrink-0">
              <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-sirius-accent" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-sirius-text">{totalWorkouts}</p>
              <p className="text-xs sm:text-sm text-sirius-textMuted">Total workouts</p>
            </div>
          </div>
        </div>
        <div className="bg-sirius-surface border border-sirius-border rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-sirius-text">{thisWeek}</p>
              <p className="text-xs sm:text-sm text-sirius-textMuted">Esta semana</p>
            </div>
          </div>
        </div>
        <div className="bg-sirius-surface border border-sirius-border rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-purple-500/10 rounded-xl shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-sirius-text">
                {workouts[0]?.date ? new Date(workouts[0].date).toLocaleDateString("es-ES", { month: "short", day: "numeric" }) : "-"}
              </p>
              <p className="text-xs sm:text-sm text-sirius-textMuted">Último workout</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 sm:mb-8">
        <Link href="/workout/new" className="block w-full bg-sirius-accent text-sirius-bg font-semibold 
          py-3 sm:py-4 rounded-xl text-center hover:bg-sirius-star transition-all duration-300 shadow-glow text-sm sm:text-base">
          + Nuevo Entrenamiento
        </Link>
      </div>

      {/* Recent Workouts */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-sirius-text mb-3 sm:mb-4">Entrenamientos Recientes</h2>
        <div className="space-y-3">
          {workouts.length === 0 ? (
            <div className="text-center py-10 sm:py-12 text-sirius-textMuted">
              <Dumbbell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm sm:text-base mb-2">No hay workouts todavía</p>
              <Link href="/workout/new" className="text-sm sm:text-base text-sirius-accent hover:underline">
                Crea tu primer entrenamiento
              </Link>
            </div>
          ) : (
            workouts.slice(0, 5).map((workout) => (
              <Link key={workout.id} href={`/history`} 
                className="block bg-sirius-surface border border-sirius-border rounded-xl p-3 sm:p-4 
                hover:border-sirius-accent/30 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sirius-text text-sm sm:text-base truncate">{workout.name}</h3>
                    <p className="text-xs sm:text-sm text-sirius-textMuted">
                      {workout.exercises?.length || 0} ejercicios • {new Date(workout.date).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-sirius-accent shrink-0 ml-2" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}