const STORAGE_KEY = "lumen_fidei_saint_collection";

function getKey(userId: number): string {
  return `${STORAGE_KEY}_${userId}`;
}

export function getCollectedSaints(userId: number): string[] {
  try {
    const stored = localStorage.getItem(getKey(userId));
    if (!stored) return [];
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

export function addToSaintCollection(userId: number, saintId: string): void {
  const collected = getCollectedSaints(userId);
  if (!collected.includes(saintId)) {
    collected.push(saintId);
    localStorage.setItem(getKey(userId), JSON.stringify(collected));
  }
}

export function isSaintCollected(userId: number, saintId: string): boolean {
  return getCollectedSaints(userId).includes(saintId);
}
