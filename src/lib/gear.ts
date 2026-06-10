import { Gear, ShoeDB } from "./types";
 
export async function getGearStats(): Promise<Gear[]> {
  try {
    const res = await fetch("/api/shoes");
    if (!res.ok) throw new Error("Failed to fetch shoes");
    
    const shoes = await res.json();
 
    return (Array.isArray(shoes) ? shoes : []).map((s: ShoeDB) => ({
      id: s.id,
      name: s.name,
      totalDistance: s.total_distance,
      limit: 700, // Default limit since it's not in DB yet
    }));
  } catch (error) {
    console.error("Error fetching gear stats:", error);
    return [];
  }
}
