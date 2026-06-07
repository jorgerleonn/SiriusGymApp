import { FitRecord } from "@/services/fitParser";

export function calculateSessionAerobics(records: FitRecord[]) {
  if (records.length < 10) return { drift: null, ef: null };

  const validRecords = records.filter(r => r.heartRate !== null && r.speed !== null);
  if (validRecords.length < 10) return { drift: null, ef: null };

  const mid = Math.floor(validRecords.length / 2);
  const firstHalf = validRecords.slice(0, mid);
  const secondHalf = validRecords.slice(mid);

  const calcEF = (recs: FitRecord[]) => {
    const avgHR = recs.reduce((sum, r) => sum + (r.heartRate || 0), 0) / recs.length;
    const avgSpeed = recs.reduce((sum, r) => sum + (r.speed || 0), 0) / recs.length;
    return avgHR > 0 ? avgSpeed / avgHR : null;
  };

  const ef1 = calcEF(firstHalf);
  const ef2 = calcEF(secondHalf);

  let drift = null;
  if (ef1 && ef2 && ef1 > 0) {
    drift = ((ef1 - ef2) / ef1) * 100;
  }

  const sessionEF = (validRecords.reduce((sum, r) => sum + (r.speed || 0), 0) / validRecords.length) / 
                    (validRecords.reduce((sum, r) => sum + (r.heartRate || 0), 0) / validRecords.length);

  return {
    drift: drift !== null ? Math.round(drift * 100) / 100 : null,
    ef: sessionEF > 0 ? Math.round(sessionEF * 1000) / 1000 : null,
  };
}
