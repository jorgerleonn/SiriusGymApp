import { FitRecord } from "@/services/fitParser";

export interface AerobicAnalysis {
  cardiacDrift: number | null;
  efficiencyFactor: number | null;
  avgCadence: number | null;
  avgStrideLength: number | null;
  avgGroundContact: number | null;
}

export function calculateAerobicAnalysis(records: FitRecord[]): AerobicAnalysis {
  if (records.length < 10) {
    return { cardiacDrift: null, efficiencyFactor: null, avgCadence: null, avgStrideLength: null, avgGroundContact: null };
  }

  // Filter records with HR and Speed
  const validRecords = records.filter(r => r.heartRate !== null && r.speed !== null);
  if (validRecords.length < 10) {
    return { cardiacDrift: null, efficiencyFactor: null, avgCadence: null, avgStrideLength: null, avgGroundContact: null };
  }

  // Split into two halves
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

  let cardiacDrift = null;
  if (ef1 && ef2 && ef1 > 0) {
    cardiacDrift = ((ef1 - ef2) / ef1) * 100;
  }

  const sessionEF = (validRecords.reduce((sum, r) => sum + (r.speed || 0), 0) / validRecords.length) / 
                    (validRecords.reduce((sum, r) => sum + (r.heartRate || 0), 0) / validRecords.length);

  // Biomechanicals
  const cadences = records.filter(r => r.cadence !== null).map(r => r.cadence!);
  const strides = records.filter(r => r.strideLength !== null).map(r => r.strideLength!);
  const contacts = records.filter(r => r.groundContact !== null).map(r => r.groundContact!);

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  return {
    cardiacDrift: cardiacDrift !== null ? Math.round(cardiacDrift * 100) / 100 : null,
    efficiencyFactor: sessionEF > 0 ? Math.round(sessionEF * 1000) / 1000 : null,
    avgCadence: avg(cadences) ? Math.round(avg(cadences)!) : null,
    avgStrideLength: avg(strides) ? Math.round(avg(strides)!) : null,
    avgGroundContact: avg(contacts) ? Math.round(avg(contacts)!) : null,
  };
}
