"use client";

interface CardioData {
  total_cardio_distance: number | null;
  duration_minutes: number | null;
  avg_pace_seconds_per_km: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  total_calories: number | null;
  hr_zone_seconds: Record<string, number> | null;
  notes: string | null;
}

function fmt(val: number | null | undefined, fallback = "-"): string {
  return val != null ? String(val) : fallback;
}

function paceStr(sec: number | null | undefined): string {
  if (!sec) return "-";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function durationStr(min: number | null | undefined): string {
  if (!min) return "-";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

const zoneColors = [
  "bg-m-blue-dark",
  "bg-m-blue-light",
  "bg-m-blue-light/80",
  "bg-m-red",
  "bg-m-red/80",
];

const zoneLabels = ["Z1 RECUPERACIÓN", "Z2 RESISTENCIA", "Z3 TEMPO", "Z4 UMBRAL", "Z5 MÁXIMO"];

const zoneDescriptions = [
  "< 60% FCmáx",
  "60-70% FCmáx",
  "70-80% FCmáx",
  "80-90% FCmáx",
  "> 90% FCmáx",
];

export function CardioDetailView({ workout }: { workout: CardioData }) {
  const zones = workout.hr_zone_seconds ?? null;

  const zoneArray = zones
    ? [zones.zone1 ?? 0, zones.zone2 ?? 0, zones.zone3 ?? 0, zones.zone4 ?? 0, zones.zone5 ?? 0]
    : null;

  const totalZoneSeconds = zoneArray ? zoneArray.reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-lg">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline">
        <KpiCard label="DISTANCIA" value={`${fmt(workout.total_cardio_distance, "0")} km`} sub={null} />
        <KpiCard label="DURACIÓN" value={durationStr(workout.duration_minutes)} sub={null} />
        <KpiCard
          label="RITMO MEDIO"
          value={`${paceStr(workout.avg_pace_seconds_per_km)} /km`}
          sub={null}
        />
        <KpiCard
          label="FC MEDIA"
          value={fmt(workout.avg_heart_rate)}
          sub={workout.max_heart_rate ? `MÁX ${workout.max_heart_rate} lpm` : null}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline">
        <KpiCard
          label="FC MÁXIMA"
          value={`${fmt(workout.max_heart_rate)} lpm`}
          sub={workout.avg_heart_rate
            ? `${Math.round(((workout.max_heart_rate ?? 0) / (workout.avg_heart_rate ?? 1)) * 100)}%`
            : null}
        />
        <KpiCard
          label="CALORÍAS"
          value={fmt(workout.total_calories)}
          sub="KCAL EST."
        />
        <KpiCard
          label="PACE"
          value={`${paceStr(workout.avg_pace_seconds_per_km)} /km`}
          sub={workout.duration_minutes && workout.total_cardio_distance
            ? `${(workout.total_cardio_distance / (workout.duration_minutes / 60)).toFixed(1)} km/h`
            : null}
        />
        <KpiCard
          label="ZONA DOMINANTE"
          value={(() => {
            if (!zoneArray) return "-";
            const idx = zoneArray.indexOf(Math.max(...zoneArray));
            return `Z${idx + 1}`;
          })()}
          sub="POR TIEMPO"
        />
      </div>

      {/* HR Zone Breakdown */}
      {zoneArray && totalZoneSeconds > 0 && (
        <div className="bg-surface-card border border-hairline p-lg">
          <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md">
            DISTRIBUCIÓN DE FRECUENCIA CARDÍACA
          </h3>
          <div className="space-y-sm">
            {zoneArray.map((seconds, i) => {
              const pct = totalZoneSeconds > 0 ? (seconds / totalZoneSeconds) * 100 : 0;
              const minutes = Math.round(seconds / 60);
              return (
                <div key={i} className="grid grid-cols-[100px_1fr_60px_60px] gap-sm items-center">
                  <span className="text-caption text-muted tracking-[1px] flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 shrink-0 ${zoneColors[i]}`} />
                    {zoneLabels[i]}
                  </span>
                  <div className="h-4 bg-canvas relative">
                    <div
                      className={`h-full ${zoneColors[i]} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 0.5)}%` }}
                    />
                  </div>
                  <span className="text-caption text-primary text-right tabular-nums">
                    {minutes}m
                  </span>
                  <span className="text-caption text-muted text-right tabular-nums">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-5 gap-xs mt-md pt-md border-t border-hairline">
            {zoneDescriptions.map((desc, i) => (
              <span key={i} className="text-caption text-muted/50 text-center text-[10px] tracking-[0.5px]">
                {desc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {workout.notes && (
        <div className="bg-surface-card border border-hairline p-lg">
          <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-sm">NOTAS</h3>
          <p className="text-body-sm text-muted whitespace-pre-wrap">{workout.notes}</p>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string | null;
}) {
  return (
    <div className="bg-surface-card p-lg flex flex-col justify-center">
      <span className="text-caption text-muted tracking-[1.5px] mb-xxs">{label}</span>
      <span className="text-display-sm font-display text-primary tracking-[0]">{value}</span>
      {sub && <span className="text-caption text-muted/60 tracking-[1px] mt-xxs">{sub}</span>}
    </div>
  );
}
