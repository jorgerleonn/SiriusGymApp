import FitParser from "fit-file-parser";

export interface FitSession {
  startTime: string;
  totalDistance: number;
  totalMovingTime: number;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  sport: string;
  avgSpeed: number | null;
  totalCalories: number | null;
}

export interface FitRecord {
  timestamp: number;
  heartRate: number | null;
  distance: number | null;
  speed: number | null;
  altitude: number | null;
  cadence: number | null;
  positionLat: number | null;
  positionLong: number | null;
}

export interface FitParseResult {
  session: FitSession;
  records: FitRecord[];
  hrZoneSeconds: { zone1: number; zone2: number; zone3: number; zone4: number; zone5: number };
  paceSecondsPerKm: number | null;
  distanceKm: number;
  movingTimeMinutes: number;
  route: [number, number][];
}

function safeNumber(val: unknown): number | null {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "bigint") return Number(val);
  return null;
}

function getSessionField(session: Record<string, unknown>, field: string): number | null {
  const val = session[field];
  if (val === undefined || val === null) return null;
  return safeNumber(val);
}

function getSessionTimestamp(session: Record<string, unknown>): string {
  const raw = session.start_time ?? session.timestamp ?? session.StartTime;
  if (raw instanceof Date) return raw.toISOString();
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return new Date(raw * 1000).toISOString();
  return new Date().toISOString();
}

function getSessionSport(session: Record<string, unknown>): string {
  const sport = session.sport ?? session.sport_name ?? "";
  if (typeof sport === "string") return sport;
  return String(sport ?? "running");
}

export function estimateMaxHR(age: number): number {
  return 220 - age;
}

export function heartRateToZone(hr: number, maxHr: number): number {
  const pct = hr / maxHr;
  if (pct < 0.6) return 1;
  if (pct < 0.7) return 2;
  if (pct < 0.8) return 3;
  if (pct < 0.9) return 4;
  return 5;
}

export function calculateHRZoneSeconds(
  records: FitRecord[],
  sessionMaxHr: number | null,
  userAge: number = 35
): { zone1: number; zone2: number; zone3: number; zone4: number; zone5: number } {
  const zones = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
  const maxHr = sessionMaxHr ?? estimateMaxHR(userAge);

  const hrRecords = records.filter((r) => r.heartRate !== null && r.heartRate !== undefined);

  if (hrRecords.length === 0) {
    return zones;
  }

  for (let i = 0; i < hrRecords.length; i++) {
    const r = hrRecords[i];
    if (r.heartRate === null) continue;

    let deltaSeconds = 1;
    if (i < hrRecords.length - 1) {
      const nextTs = hrRecords[i + 1].timestamp;
      deltaSeconds = Math.max(1, nextTs - r.timestamp);
    }
    if (deltaSeconds > 30) deltaSeconds = 1;

    const zone = heartRateToZone(r.heartRate, maxHr);
    const key = `zone${zone}` as keyof typeof zones;
    zones[key] += deltaSeconds;
  }

  return zones;
}

export function calculatePace(seconds: number, meters: number): number | null {
  if (!seconds || !meters || meters <= 0) return null;
  return Math.round(seconds / (meters / 1000));
}

export function formatPace(paceSecondsPerKm: number | null): string {
  if (paceSecondsPerKm === null || paceSecondsPerKm <= 0) return "-";
  const min = Math.floor(paceSecondsPerKm / 60);
  const sec = paceSecondsPerKm % 60;
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

export async function parseFitFile(
  buffer: ArrayBuffer,
  userAge: number = 35
): Promise<FitParseResult> {
  const parser = new FitParser({
    force: true,
    speedUnit: "m/s",
    lengthUnit: "m",
    elapsedRecordField: true,
  });

  let data;
  try {
    data = await parser.parseAsync(buffer);
  } catch (err) {
    throw new Error(`Error al parsear archivo .fit: ${String(err)}`);
  }

  if (!data) {
    throw new Error("El parser .fit no devolvió datos");
  }

  const dataObj = data as unknown as Record<string, unknown>;
  const sessions = (dataObj.sessions ?? []) as Record<string, unknown>[];
  const records = (dataObj.records ?? []) as Record<string, unknown>[];

  if (sessions.length === 0) {
    throw new Error("No se encontró ninguna sesión en el archivo .fit");
  }

  const session = sessions[0];

  const totalDistance = getSessionField(session, "total_distance") ?? 0;
  const totalTimerTime = getSessionField(session, "total_timer_time") ?? 0;
  const totalMovingTime = getSessionField(session, "total_elapsed_time") ?? totalTimerTime;
  const avgHeartRate = getSessionField(session, "avg_heart_rate");
  const maxHeartRate = getSessionField(session, "max_heart_rate");
  const avgSpeed = getSessionField(session, "avg_speed");
  const totalCalories = getSessionField(session, "total_calories");

  const mappedRecords: FitRecord[] = records.map((r) => {
    const rawLat = r.position_lat ?? r.positionLat;
    const rawLng = r.position_long ?? r.positionLong;
    return {
      timestamp:
        r.timestamp instanceof Date
          ? r.timestamp.getTime() / 1000
          : safeNumber(r.timestamp as number) ?? 0,
      heartRate: getSessionField(r as Record<string, unknown>, "heart_rate"),
      distance: getSessionField(r as Record<string, unknown>, "distance"),
      speed: getSessionField(r as Record<string, unknown>, "speed"),
      altitude: getSessionField(r as Record<string, unknown>, "altitude"),
      cadence: getSessionField(r as Record<string, unknown>, "cadence"),
      positionLat: safeNumber(rawLat as number),
      positionLong: safeNumber(rawLng as number),
    };
  });

  const route: [number, number][] = mappedRecords
    .filter((r): r is FitRecord & { positionLat: number; positionLong: number } =>
      r.positionLat !== null && r.positionLong !== null
    )
    .map((r) => [r.positionLat, r.positionLong]);

  const pace = calculatePace(totalMovingTime, totalDistance);
  const hrZoneSeconds = calculateHRZoneSeconds(mappedRecords, maxHeartRate, userAge);

  return {
    session: {
      startTime: getSessionTimestamp(session),
      totalDistance,
      totalMovingTime,
      avgHeartRate,
      maxHeartRate,
      sport: getSessionSport(session),
      avgSpeed,
      totalCalories,
    },
    records: mappedRecords,
    hrZoneSeconds,
    paceSecondsPerKm: pace,
    distanceKm: Math.round((totalDistance / 10)) / 100,
    movingTimeMinutes: Math.round(totalMovingTime / 60),
    route,
  };
}
