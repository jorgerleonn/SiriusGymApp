import { getDashboardStats, getWorkouts } from "@/lib/queries";
import { getWorkoutTemplates } from "@/lib/queries";
import type { WorkoutTemplate } from "@/lib/types";
import { Dumbbell, Flame, TrendingUp, Route, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { MStripe } from "@/components/ui/m-stripe";
import { StatCard } from "@/components/ui/stat-card";
import { MuscleMap } from "@/components/ui/muscle-map";
import { ConsistencyCalendar } from "@/components/ui/consistency-calendar";
import { VolumeChart, RunningChart } from "@/components/ui/analytics-charts";
import { CardioDropzone } from "@/components/cardio-dropzone";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const workouts = await getWorkouts();
  const templates = await getWorkoutTemplates();

  return (
    <div className="space-y-xl">
      {/* M Stripe Divider */}
      <MStripe />

      {/* Hero Stats Grid */}
      <div className="pt-md">
        <h1 className="text-display-md font-display text-primary tracking-[0]">
          Dashboard
        </h1>
        <p className="text-body-md text-muted mt-xs">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline">
        <StatCard
          label="Total Entrenos"
          value={stats?.totalWorkouts ?? 0}
          sub="DE POR VIDA"
        />
        <StatCard
          label="Esta Semana"
          value={stats?.thisWeek ?? 0}
          sub={`${stats?.thisMonth ?? 0} ESTE MES`}
        />
        <StatCard
          label="Racha Actual"
          value={`${stats?.currentStreak ?? 0} DÍAS`}
          sub={`MEJOR: ${stats?.bestStreak ?? 0} DÍAS`}
        />
        <StatCard
          label="Volumen Total"
          value={`${((stats?.totalVolume ?? 0) / 1000).toFixed(1)}k`}
          sub={`${stats?.totalCardioDistance ?? 0} KM CARDIO`}
        />
      </div>

      {/* New Workout + Templates Row */}
      <div className="flex flex-col sm:flex-row gap-md">
        <Link href="/workout/new">
          <Button variant="primary" size="md" className="flex items-center gap-md">
            <Plus className="w-4 h-4" />
            Nuevo Entrenamiento
          </Button>
        </Link>
        {templates.length > 0 && (
          <div className="flex flex-wrap gap-xs items-center">
            <span className="text-caption text-muted tracking-[1.5px] mr-xs">
              PLANTILLAS:
            </span>
            {templates.slice(0, 4).map((t: WorkoutTemplate) => (
              <Link
                key={t.id}
                href={`/workout/new?template=${t.id}`}
                className="px-md py-xs border border-hairline text-caption text-muted hover:text-primary hover:border-primary transition-colors rounded-none bg-transparent"
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Charts & Muscle Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-hairline">
        {/* Volume Over Time - takes 2 cols */}
        <div className="bg-surface-card p-lg lg:col-span-2">
          <div className="flex items-center justify-between mb-md">
            <h3 className="text-title-sm font-display text-primary tracking-[0] flex items-center gap-md">
              <TrendingUp className="w-4 h-4 text-m-blue-light" />
              VOLUMEN PROGRESIVO
            </h3>
            <span className="text-caption text-muted tracking-[1.5px]">
              CARGA TOTAL (KG)
            </span>
          </div>
          <VolumeChart data={stats?.volumeOverTime ?? []} />
        </div>

        {/* Muscle Distribution */}
        <div className="bg-surface-card p-lg">
          <div className="flex items-center justify-between mb-md">
            <h3 className="text-title-sm font-display text-primary tracking-[0] flex items-center gap-md">
              <Dumbbell className="w-4 h-4 text-m-blue-dark" />
              DISTRIBUCIÓN
            </h3>
            <span className="text-caption text-muted tracking-[1.5px]">
              VOLUMEN
            </span>
          </div>
          <MuscleMap data={stats?.muscleDistribution ?? []} />
        </div>
      </div>

      {/* Cardio + Calendar row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-hairline">
        {/* Running Distance + FIT Upload */}
        <div className="bg-surface-card p-lg flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <h3 className="text-title-sm font-display text-primary tracking-[0] flex items-center gap-md">
              <Route className="w-4 h-4 text-m-red" />
              CARDIO
            </h3>
            <span className="text-caption text-muted tracking-[1.5px]">
              DISTANCIA (KM)
            </span>
          </div>
          <RunningChart data={stats?.runningVolumeOverTime ?? []} />
          <CardioDropzone />
        </div>

        {/* Consistency Calendar */}
        <div className="bg-surface-card p-lg lg:col-span-2">
          <div className="flex items-center justify-between mb-md">
            <h3 className="text-title-sm font-display text-primary tracking-[0] flex items-center gap-md">
              <Flame className="w-4 h-4 text-m-red" />
              CONSISTENCIA
            </h3>
            <span className="text-caption text-muted tracking-[1.5px]">
              {new Date().getFullYear()}
            </span>
          </div>
          <ConsistencyCalendar data={stats?.weeklyActivity ?? []} />
        </div>
      </div>

      {/* Recent Workouts */}
      <div>
        <div className="flex items-center justify-between mb-md">
          <h3 className="text-title-sm font-display text-primary tracking-[0]">
            ENTRENAMIENTOS RECIENTES
          </h3>
          <Link
            href="/history"
            className="text-label-uppercase text-muted hover:text-primary transition-colors tracking-[1.5px]"
          >
            VER TODOS →
          </Link>
        </div>

        {workouts.length === 0 ? (
          <div className="text-center py-xl border border-hairline">
            <Dumbbell className="w-8 h-8 text-muted mx-auto mb-md" />
            <p className="text-body-md text-muted mb-md">
              NO HAY ENTRENAMIENTOS
            </p>
            <Link href="/workout/new">
              <Button variant="outline" size="sm">
                CREA TU PRIMERO
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-px bg-hairline">
            {workouts.slice(0, 5).map((workout: { id: string; name: string; date: string; type: string }) => {
              const isStrength = workout.type === "strength" || workout.type === "hybrid";
              const isCardio = workout.type === "cardio" || workout.type === "hybrid";
              return (
                <Link
                  key={workout.id}
                  href={`/workout/${workout.id}`}
                  className="block bg-surface-card hover:bg-surface-elevated transition-colors group"
                >
                  <div className="p-lg">
                    <div className="flex justify-between items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-md">
                          <h4 className="text-label-uppercase text-primary tracking-[1.5px] truncate">
                            {workout.name}
                          </h4>
                          <div className="flex gap-xxs">
                            {isStrength && (
                              <span className="text-caption text-m-blue-light tracking-[1px] border border-m-blue-light/30 px-xs py-[2px]">
                                FUERZA
                              </span>
                            )}
                            {isCardio && (
                              <span className="text-caption text-m-red tracking-[1px] border border-m-red/30 px-xs py-[2px]">
                                CARDIO
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-body-sm text-muted mt-xxs tracking-[0]">
                          {new Date(workout.date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors shrink-0 ml-md" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
