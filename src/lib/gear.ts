import { Gear } from "./types";

export async function getGearStats(): Promise<Gear[]> {
  // Mock data for gear tracking as database table is not yet created
  return [
    { id: "1", name: "Nike Pegasus 40", totalDistance: 450, limit: 700 },
    { id: "2", name: "Asics Novablast 4", totalDistance: 820, limit: 700 },
  ];
}
