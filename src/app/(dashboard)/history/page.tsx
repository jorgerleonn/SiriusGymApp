import { getWorkouts } from "@/lib/queries";
import { Dumbbell, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MStripe } from "@/components/ui/m-stripe";

export default async function HistoryPage() {
  const workouts = await getWorkouts();

  return (
    <div>
      <MStripe className="mb-lg" />
      <h1 className="text-display-md font-display text-primary tracking-[0] mb-xl">
        HISTORIAL
      </h1>

      {workouts.length === 0 ? (
        <div className="text-center py-xxl border border-hairline">
          <Dumbbell className="w-8 h-8 text-muted mx-auto mb-md" />
          <p className="text-body-md text-muted mb-md">NO HAY ENTRENAMIENTOS</p>
          <Link href="/workout/new">
            <Button variant="outline" size="sm">
              CREA TU PRIMERO
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-px bg-hairline">
          {workouts.map((workout: { id: string; name: string; date: string; type: string }) => {
            const isStrength = workout.type === "strength" || workout.type === "hybrid";
            const isCardio = workout.type === "cardio" || workout.type === "hybrid";
            return (
              <Link
                key={workout.id}
                href={`/workout/${workout.id}`}
                className="block bg-surface-card hover:bg-surface-elevated transition-colors group"
              >
                <div className="p-lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-md mb-md">
                    <div className="min-w-0">
                      <div className="flex items-center gap-md flex-wrap">
                        <h3 className="text-label-uppercase text-primary tracking-[1.5px]">{workout.name}</h3>
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
                      <p className="text-body-sm text-muted mt-xs tracking-[0]">
                        {new Date(workout.date).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors shrink-0 self-start" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
