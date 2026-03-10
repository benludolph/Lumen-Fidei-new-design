const STORAGE_KEY = "lumen_fidei_saint_collection";

export interface CollectedSaint {
  dayNumber: number;
  name: string;
  image: string;
  quote: string;
}

function getKey(userId: number): string {
  return `${STORAGE_KEY}_${userId}`;
}

export function getCollectedSaints(userId: number): CollectedSaint[] {
  try {
    const stored = localStorage.getItem(getKey(userId));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    if (parsed.length > 0 && typeof parsed[0] === "string") {
      localStorage.removeItem(getKey(userId));
      return [];
    }
    return parsed.filter(
      (s: any) => typeof s.dayNumber === "number" && typeof s.name === "string"
    ) as CollectedSaint[];
  } catch {
    return [];
  }
}

export function addToSaintCollection(userId: number, saint: CollectedSaint): void {
  const collected = getCollectedSaints(userId);
  if (!collected.some(s => s.dayNumber === saint.dayNumber)) {
    collected.push(saint);
    localStorage.setItem(getKey(userId), JSON.stringify(collected));
  }
}

export function isSaintCollected(userId: number, dayNumber: number): boolean {
  return getCollectedSaints(userId).some(s => s.dayNumber === dayNumber);
}
